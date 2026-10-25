// Server-only Lovable AI Gateway Responses helper (TanStack Start).
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayRunIdFetch } from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export function createGatewayResponsesCall(
  config: { model?: string; reasoningEffort?: "low" | "medium" | "high" },
  messages: ModelMessage[],
  instructions?: string,
) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY for the AI Gateway");

  const model = config.model ?? "openai/gpt-6-astra";
  const runIdFetch = createLovableAiGatewayRunIdFetch(undefined);
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(model),
    ...(instructions ? { instructions } : {}),
    messages,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: config.reasoningEffort ?? "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return result;
}
