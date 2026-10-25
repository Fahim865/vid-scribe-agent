// Server-only helpers: AES-GCM encryption for user API keys.
// Uses WebCrypto so it runs on the worker runtime and Node alike.
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
