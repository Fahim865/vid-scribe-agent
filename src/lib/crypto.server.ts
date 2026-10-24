// Server-only helpers: AES-GCM encryption for user API keys.
// Uses WebCrypto so it runs on the edge/worker runtime and Node alike.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SECRET_NAME = "REELPILOT_ENCRYPTION_KEY";

let cryptoKeyPromise: Promise<CryptoKey> | undefined;

function getKeyMaterial(): string {
  const raw = process.env[SECRET_NAME];
  if (!raw) throw new Error(`Missing environment variable: ${SECRET_NAME}`);
  return raw;
}

async function getCryptoKey(): Promise<CryptoKey> {
  if (!cryptoKeyPromise) {
    cryptoKeyPromise = (async () => {
      const material = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(getKeyMaterial()),
      );
      return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt",
      ]);
    })();
  }
  return cryptoKeyPromise;
}

function toB64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromB64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);
  return toB64(combined);
}

export async function decryptSecret(payload: string): Promise<string> {
  const key = await getCryptoKey();
  const combined = fromB64(payload);
  const iv = combined.slice(0, 12);
  const cipher = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

export function maskKey(secret: string): string {
  const s = secret.trim();
  if (s.length <= 7) return `${s.slice(0, 2)}••••`;
  return `${s.slice(0, 3)}••••••••${s.slice(-4)}`;
}

/**
 * Authenticated middleware identical to requireSupabaseAuth but also exposing a
 * service-role client for privileged operations (after the caller is verified).
 */
export const requireSupabaseAuthAdmin = createMiddleware({ type: "function" }).server(
  async (ctx) => {
    const request = getRequest();
    const authHeader = request?.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) throw new Error("Unauthorized: No token provided");

    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SERVICE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing Supabase environment variables for admin client");
    }

    // Verify the caller first with the user-scoped middleware.
    const result = await requireSupabaseAuth({ ...ctx, next: async (inner: unknown) => inner });
    void result;

    const admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    return ctx.next({ context: { supabaseAdmin: admin } });
  },
);
