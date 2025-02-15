import { LLM, CompletionOptions, CompletionResult } from "./base";
import { calculateCost } from "../utils/tokenCounter";

export interface CloudflareConfig {
  apiToken: string;
  accountId: string;
  model?: string;
}

export function createCloudflareAILLM(config: CloudflareConfig): LLM {
  if (!config.apiToken) {
    throw new Error(
      "Cloudflare API token is required. Please set CLOUDFLARE_API_TOKEN in your environment variables."
    );
  }

  if (!config.accountId) {
    throw new Error(
      "Cloudflare Account ID is required. Please set CLOUDFLARE_ACCOUNT_ID in your environment variables."
    );
  }

  const defaultModel = "@cf/meta/llama-2-7b-chat-int8";
  const model = config.model || defaultModel;

  return {
    modelName: model,
    async complete<T>({
      prompt,
      schema,
      temperature,
      maxTokens,
    }: CompletionOptions): Promise<CompletionResult<T>> {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            messages: [
              ...(schema
                ? [
                    {
                      role: "system",
                      content: `Do not include any explanation or text at the end and only respond with a JSON object matching this schema:\n${JSON.stringify(
                        schema,
                        null,
                        2
                      )}`,
                    },
                  ]
                : []),
              { role: "user", content: prompt },
            ],
            temperature: temperature ?? 0.7,
            max_tokens: maxTokens || 1024,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Cloudflare AI request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      const rawOutput = result.result.response;
      let content: T = rawOutput as T;

      if (schema) {
        content = JSON.parse(rawOutput);
      }

      // Cloudflare AI doesn't provide token counts directly
      // We're estimating based on character count
      const inputChars = prompt.length;
      const outputChars = JSON.stringify(content).length;
      const estimatedInputTokens = Math.ceil(inputChars / 4);
      const estimatedOutputTokens = Math.ceil(outputChars / 4);

      return {
        content,
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        costCents: calculateCost(
          estimatedInputTokens,
          estimatedOutputTokens,
          model
        ),
        rawInput: prompt,
        rawOutput,
      };
    },
  };
}
