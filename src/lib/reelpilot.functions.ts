// ReelPilot server functions: BYOK provider keys, AI generation, assets.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { decryptSecret, encryptSecret, maskKey } from "./crypto.server";
import { callUserLlm, parseModelJson } from "./llm.server";
import { createGatewayResponsesCall } from "./ai/responses";
import { mapGatewayVoice, requestElevenLabsSpeech, requestGatewaySpeech } from "./speech.server";
import type { Database } from "@/integrations/supabase/types";

type ProviderKeyRow = Database["public"]["Tables"]["provider_keys"]["Row"];

export type ClientKey = Omit<ProviderKeyRow, "encrypted_key" | "user_id" | "last_used_at" | "created_at"> & {
  last_used_at: string | null;
  created_at: string;
};

function toClientKey(row: ProviderKeyRow): ClientKey {
  const { encrypted_key: _drop, user_id: _u, ...rest } = row;
  void _drop;
  void _u;
  return rest;
}

const scriptScenesSchema = z.object({
  title: z.string(),
  script: z.string(),
  scenes: z
    .array(
      z.object({
        visual: z.string(),
        duration: z.number(),
        line: z.string(),
      }),
    )
    .min(1)
    .max(10),
});

// ---------- Provider keys (BYOK, encrypted at rest) ----------

export const addProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input) =>
      z
        .object({
          category: z.enum(["video", "voice", "llm", "music"]),
          provider: z.string().min(1).max(120),
          label: z.string().max(200).default(""),
          secret: z.string().min(4).max(2000),
          endpoint: z.string().url().max(500).optional(),
          headers: z.string().max(2000).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const encrypted = await encryptSecret(data.secret);
    const hint = maskKey(data.secret);

    let headers: Record<string, string> = {};
    if (data.headers) {
      for (const line of data.headers.split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }

    const { data: existing } = await supabase
      .from("provider_keys")
      .select("id")
      .eq("category", data.category);
    const isFirst = !existing || existing.length === 0;

    const { data: row, error } = await supabase
      .from("provider_keys")
      .insert({
        user_id: userId,
        category: data.category,
        provider: data.provider,
        label: data.label || `${data.provider} key`,
        encrypted_key: encrypted,
        key_hint: hint,
        endpoint: data.endpoint ?? null,
        custom_headers: data.headers ? headers : null,
        status: "active",
        is_default: isFirst,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toClientKey(row);
  });

export const deleteProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("provider_keys")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setDefaultProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: key } = await supabase
      .from("provider_keys")
      .select("id, category")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (!key) throw new Error("Key not found");
    await supabase.from("provider_keys").update({ is_default: false }).eq("user_id", userId).eq("category", key.category);
    await supabase.from("provider_keys").update({ is_default: true }).eq("id", data.id);
    return { ok: true };
  });

async function checkProvider(category: string, provider: string, secret: string, endpoint?: string | null) {
  const p = provider.toLowerCase();
  try {
    if (category === "llm") {
      if (endpoint) {
        const res = await fetch(`${endpoint.replace(/\/+$/, "")}/models`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        if (res.ok) return { ok: true, message: "Endpoint reachable and authorized" };
        return { ok: false, message: `Endpoint responded ${res.status}` };
      }
      if (p === "openai") {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${secret}` },
        });
        if (res.ok) return { ok: true, message: "OpenAI key is valid" };
        return { ok: false, message: `OpenAI responded ${res.status}` };
      }
      if (p === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: { "x-api-key": secret, "anthropic-version": "2023-06-01" },
        });
        if (res.ok) return { ok: true, message: "Anthropic key is valid" };
        return { ok: false, message: `Anthropic responded ${res.status}` };
      }
      if (p === "google gemini" || p === "gemini") {
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
          headers: { "x-goog-api-key": secret },
        });
        if (res.ok) return { ok: true, message: "Gemini key is valid" };
        return { ok: false, message: `Gemini responded ${res.status}` };
      }
    }
    if (category === "voice" && p === "elevenlabs") {
      const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
        headers: { "xi-api-key": secret },
      });
      if (res.ok) return { ok: true, message: "ElevenLabs key is valid" };
      return { ok: false, message: `ElevenLabs responded ${res.status}` };
    }
    if (endpoint) {
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${secret}` } });
      if (res.ok || res.status === 405 || res.status === 404) {
        return { ok: true, message: "Endpoint reachable" };
      }
      return { ok: false, message: `Endpoint responded ${res.status}` };
    }
    return { ok: true, message: "Saved — ReelPilot will verify this provider on first use" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

export const testProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input) =>
      z
        .object({
          keyId: z.string().uuid().optional(),
          category: z.enum(["video", "voice", "llm", "music"]).optional(),
          provider: z.string().max(120).optional(),
          secret: z.string().max(2000).optional(),
          endpoint: z.string().url().max(500).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    let category = data.category ?? "";
    let provider = data.provider ?? "";
    let secret = data.secret ?? "";
    let endpoint: string | null = data.endpoint ?? null;

    if (data.keyId) {
      const { data: row, error } = await context.supabase
        .from("provider_keys")
        .select("*")
        .eq("id", data.keyId)
        .eq("user_id", context.userId)
        .single();
      if (error || !row) throw new Error("Key not found");
      category = row.category;
      provider = row.provider;
      endpoint = row.endpoint;
      secret = await decryptSecret(row.encrypted_key);
    }
    if (!category || !provider || !secret) throw new Error("Nothing to test");

    const result = await checkProvider(category, provider, secret, endpoint);
    if (data.keyId) {
      await context.supabase
        .from("provider_keys")
        .update({ status: result.ok ? "active" : "invalid" })
        .eq("id", data.keyId);
    }
    return result;
  });

// ---------- Script generation ----------

function buildScriptTurns(input: {
  brief: string;
  niche: string;
  tone: string;
  language: string;
  videoLength: number;
}) {
  const system =
    "You are ReelPilot, an expert short-form video scriptwriter. You write punchy, viral-style " +
    "scripts for vertical reels. Respond ONLY with a JSON object of shape " +
    '{"title": string, "script": string, "scenes": [{"visual": string, "duration": number, "line": string}]} ' +
    "where `script` is the full voiceover narration (hook, body, CTA), `scenes` has 4-6 scenes whose " +
    "durations in seconds sum to roughly the target length, `visual` is an image-generation prompt for the scene, " +
    "and `line` is the exact spoken line for that scene. No markdown, no commentary — JSON only.";
  const user =
    `Niche: ${input.niche}\nBrand tone: ${input.tone}\nLanguage: ${input.language}\n` +
    `Target length: ${input.videoLength} seconds\nBrief: ${input.brief}`;
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export const generateScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input) =>
      z
        .object({
          brief: z.string().min(4).max(2000),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: settings } = await supabase
      .from("agent_settings")
      .select("niche, tone, language, video_length")
      .eq("user_id", userId)
      .single();
    const input = {
      brief: data.brief,
      niche: settings?.niche ?? "General",
      tone: settings?.tone ?? "Friendly, punchy",
      language: settings?.language ?? "English",
      videoLength: settings?.video_length ?? 40,
    };
    const turns = buildScriptTurns(input);

    const { data: llmKey } = await supabase
      .from("provider_keys")
      .select("*")
      .eq("user_id", userId)
      .eq("category", "llm")
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();

    let raw: string;
    let used: string;

    if (llmKey) {
      const secret = await decryptSecret(llmKey.encrypted_key);
      raw = await callUserLlm(
        { provider: llmKey.provider, endpoint: llmKey.endpoint, secret },
        turns,
        { jsonExpected: true },
      );
      used = `${llmKey.provider} (your key)`;

      await supabase
        .from("provider_keys")
        .update({
          usage_count: llmKey.usage_count + 1,
          last_used_at: new Date().toISOString(),
          status: "active",
        })
        .eq("id", llmKey.id);
      await supabase.from("usage_log").insert({
        user_id: userId,
        key_id: llmKey.id,
        category: "llm",
        provider: llmKey.provider,
        amount: 1,
      });
    } else {
      const result = createGatewayResponsesCall(
        { reasoningEffort: "medium" },
        [
          { role: "system", content: turns[0].content },
          { role: "user", content: turns[1].content },
        ],
      );
      raw = await result.text;
      used = "Lovable AI (built-in)";
      await supabase.from("usage_log").insert({
        user_id: userId,
        category: "llm",
        provider: "Lovable AI",
        amount: 1,
      });
    }

    let parsed: unknown;
    try {
      parsed = parseModelJson(raw);
    } catch {
      parsed = null;
    }
    const safe = scriptScenesSchema.safeParse(parsed);
    if (!safe.success) {
      // Fall back: use the raw text as the script with a single scene.
      return {
        title: input.brief.slice(0, 80),
        script: raw.slice(0, 4000),
        scenes: [{ visual: "Vertical reel, dynamic lighting", duration: input.videoLength, line: input.brief }],
        used,
      };
    }
    return safe.data;
  });

// ---------- Voiceover ----------

const ASSET_BUCKET = "reel-assets";

export const generateVoiceover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input) =>
      z
        .object({
          videoId: z.string().uuid(),
          voice: z.string().max(120).default("Nova — warm female"),
          lines: z.array(z.string().min(1).max(2000)).min(1).max(20),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const text = data.lines.join("\n\n");

    const { data: voiceKey } = await supabase
      .from("provider_keys")
      .select("*")
      .eq("user_id", userId)
      .eq("category", "voice")
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();

    let audio: Response;
    let used: string;
    let ext: string;
    let contentType: string;

    if (voiceKey && voiceKey.provider.toLowerCase() === "elevenlabs") {
      const secret = await decryptSecret(voiceKey.encrypted_key);
      audio = await requestElevenLabsSpeech(secret, text, data.voice);
      used = "ElevenLabs (your key)";
      ext = "mp3";
      contentType = "audio/mpeg";
    } else {
      audio = await requestGatewaySpeech(text, mapGatewayVoice(data.voice));
      used = "Lovable AI (built-in)";
      ext = "wav";
      contentType = "audio/wav";
    }

    if (!audio.ok) {
      const detail = (await audio.text()).slice(0, 300);
      throw new Error(`Voice generation failed (${audio.status}): ${detail}`);
    }
    const bytes = new Uint8Array(await audio.arrayBuffer());

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${userId}/${data.videoId}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(ASSET_BUCKET)
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) throw new Error(`Could not store the voiceover: ${upErr.message}`);

    const { error: updErr } = await supabase
      .from("videos")
      .update({ voice_url: path })
      .eq("id", data.videoId)
      .eq("user_id", userId);
    if (updErr) throw new Error(updErr.message);

    if (voiceKey) {
      await supabase
        .from("provider_keys")
        .update({
          usage_count: voiceKey.usage_count + 1,
          last_used_at: new Date().toISOString(),
          status: "active",
        })
        .eq("id", voiceKey.id);
      await supabase.from("usage_log").insert({
        user_id: userId,
        key_id: voiceKey.id,
        category: "voice",
        provider: voiceKey.provider,
        amount: 1,
      });
    } else {
      await supabase.from("usage_log").insert({
        user_id: userId,
        category: "voice",
        provider: "Lovable AI",
        amount: 1,
      });
    }

    return { used, voicePath: path };
  });

export const getAssetUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input) =>
      z.object({ path: z.string().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/`)) throw new Error("Forbidden path");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(ASSET_BUCKET)
      .createSignedUrl(data.path, 3600);
    if (error || !signed) throw new Error("Could not open the audio file");
    return { url: signed.signedUrl };
  });
