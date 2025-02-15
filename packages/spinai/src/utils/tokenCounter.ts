// Cost per 1M tokens in USD
const MODEL_COSTS = {
  // GPT-4 Models
  "gpt-4-0125-preview": { input: 10, output: 30 },
  "gpt-4-1106-preview": { input: 10, output: 30 },
  "gpt-4-vision-preview": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-4-32k": { input: 60, output: 120 },
  "gpt-4o": { input: 250, output: 1000 },
  "gpt-4o-mini": { input: 15, output: 60 },

  // GPT-3.5 Models
  "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-instruct": { input: 1.5, output: 2 },
  "gpt-3.5-turbo-16k": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },

  // Claude Models
  "claude-3-opus-20240229": { input: 15, output: 75 },
  "claude-3-sonnet-20240229": { input: 3, output: 15 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  "claude-2.1": { input: 8, output: 24 },
  "claude-2.0": { input: 8, output: 24 },
  "claude-instant-1.2": { input: 0.8, output: 2.4 },

  // Cloudflare AI Models
  "@cf/meta/llama-2-7b-chat-int8": { input: 0.2, output: 0.4 },
  "@cf/meta/llama-2-13b-chat-int8": { input: 0.4, output: 0.8 },
  "@cf/meta/llama-2-70b-chat-int8": { input: 1.0, output: 2.0 },
  "@cf/mistral/mistral-7b-instruct-v0.1": { input: 0.2, output: 0.4 },
  "@cf/tiiuae/falcon-7b-instruct": { input: 0.2, output: 0.4 },
  "@cf/anthropic/claude-instant-1.2": { input: 0.8, output: 2.4 },
  "@cf/anthropic/claude-2.1": { input: 8.0, output: 24.0 },
  "custom-http-model": { input: 0.5, output: 1.5 },
} as const;

type ModelId = keyof typeof MODEL_COSTS;

function isKnownModel(model: string): model is ModelId {
  return model in MODEL_COSTS;
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  if (!isKnownModel(model)) {
    // Default to GPT-3.5 Turbo pricing if unknown
    model = "gpt-3.5-turbo";
  }

  const costs = MODEL_COSTS[model as ModelId];
  // Costs are in USD per 1M tokens
  const inputCost = (inputTokens / 1000000) * costs.input;
  const outputCost = (outputTokens / 1000000) * costs.output;

  // Round to 6 decimal places for fractional cents
  return Number((inputCost + outputCost).toFixed(6));
}
