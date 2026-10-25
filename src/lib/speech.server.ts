// Server-only: text-to-speech through Lovable AI (gateway) or the user's own
// ElevenLabs key (BYOK).

const GATEWAY_URL = "https://ai.gateway.lovable.dev";
export const DEFAULT_TTS_MODEL = "google/gemini-3.1-flash-tts-preview";

export function speechBody(model: string, text: string, voice: string, download: boolean) {
  return {
    model,
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
    stream_format: download ? "audio" : "sse",
  };
}

export async function requestGatewaySpeech(
  text: string,
  voice: string,
  signal?: AbortSignal,
): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY for the AI Gateway");
  return fetch(`${GATEWAY_URL}/v1/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(
      speechBody(DEFAULT_TTS_MODEL, text, voice, true),
    ),
    ...(signal ? { signal } : {}),
  });
}

const ELEVENLABS_VOICES: Record<string, string> = {
  "nova — warm female": "21m00Tcm4TlvDq8ikWAM",
  "atlas — deep male": "pNInz6obpgDGw3ZCucB",
  "kai — energetic": "TX3LPaxmHKxFdv7VOQHJ",
  "mira — calm narrator": "EXAVITQu4vr4xnSDxMaL",
};

export async function requestElevenLabsSpeech(
  secret: string,
  text: string,
  voiceLabel: string,
): Promise<Response> {
  const voiceId = ELEVENLABS_VOICES[voiceLabel.toLowerCase()] ?? ELEVENLABS_VOICES["nova — warm female"];
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": secret, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    }),
  });
}

/** Map the friendly voice selector to a gateway prebuilt voice name. */
export function mapGatewayVoice(voiceLabel: string): string {
  const v = voiceLabel.toLowerCase();
  if (v.includes("atlas")) return "Puck";
  if (v.includes("kai")) return "Fenrir";
  if (v.includes("mira")) return "Aoede";
  return "Kore";
}
