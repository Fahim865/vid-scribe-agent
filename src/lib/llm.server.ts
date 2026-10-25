// Server-only: call the user's own LLM provider (BYOK) with a stored key.

export type UserLlmKey = {
  provider: string;
  endpoint?: string | null;
  secret: string;
};

type ChatTurn = { role: "system" | "user"; content: string };

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model response contained no JSON object");
  return JSON.parse(candidate.slice(start, end + 1));
}

export function parseModelJson(text: string): unknown {
  return extractJson(text);
}

/** OpenAI-compatible chat completions (OpenAI, Groq, Together, any custom endpoint). */
async function callOpenAiCompatible(
  base: string,
  secret: string,
  model: string,
  turns: ChatTurn[],
): Promise<string> {
  const res = await fetch(`${base.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: turns,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Provider returned ${res.status}: ${detail}`);
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(secret: string, turns: ChatTurn[]): Promise<string> {
  const system = turns.filter((t) => t.role === "system").map((t) => t.content).join("\n\n");
  const messages = turns
    .filter((t) => t.role !== "system")
    .map((t) => ({ role: "user" as const, content: t.content }));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": secret,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Provider returned ${res.status}: ${detail}`);
  }
  const body = (await res.json()) as { content?: { text?: string }[] };
  return body.content?.map((c) => c.text ?? "").join("") ?? "";
}

async function callGemini(secret: string, turns: ChatTurn[]): Promise<string> {
  const prompt = turns.map((t) => `${t.role}: ${t.content}`).join("\n\n");
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": secret, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    },
  );
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Provider returned ${res.status}: ${detail}`);
  }
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

/**
 * Route the call through the user's own key. `endpoint` covers any
 * OpenAI-compatible REST API ("Custom endpoint" in the Providers page).
 */
export async function callUserLlm(
  key: UserLlmKey,
  turns: ChatTurn[],
  opts: { jsonExpected: boolean },
): Promise<string> {
  const provider = key.provider.toLowerCase();
  if (provider === "openai" || provider === "custom endpoint" || key.endpoint) {
    const base = key.endpoint || "https://api.openai.com/v1";
    const model = provider === "openai" && !key.endpoint ? "gpt-4o-mini" : "gpt-4o-mini";
    return callOpenAiCompatible(base, key.secret, model, turns);
  }
  if (provider === "anthropic") return callAnthropic(key.secret, turns);
  if (provider === "google gemini" || provider === "gemini") return callGemini(key.secret, turns);
  throw new Error(
    `No direct integration for "${key.provider}" — add a Custom endpoint (OpenAI-compatible) or let ReelPilot use its built-in AI.`,
  );
}
