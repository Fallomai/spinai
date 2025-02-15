import { LLM, CompletionOptions, CompletionResult } from "./base";
import { calculateCost } from "../utils/tokenCounter";

export interface HttpLLMConfig {
  endpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
  transformRequest?: (body: unknown) => unknown;
  transformResponse?: (response: unknown) => string;
}

export function createHttpLLM(config: HttpLLMConfig): LLM {
  if (!config.endpoint) {
    throw new Error("HTTP endpoint is required");
  }

  const model = "custom-http-model";

  return {
    modelName: model,
    async complete<T>({
      prompt,
      schema,
      temperature,
      maxTokens,
    }: CompletionOptions): Promise<CompletionResult<T>> {
      const defaultBody = {
        messages: [
          ...(schema
            ? [
                {
                  role: "system",
                  content: `Respond only with a JSON object matching this schema:\n${JSON.stringify(
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
      };

      const requestBody = config.transformRequest
        ? config.transformRequest(defaultBody)
        : defaultBody;

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
          ...config.headers,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP LLM request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      const rawOutput = config.transformResponse
        ? config.transformResponse(result)
        : result.response ||
          result.choices?.[0]?.message?.content ||
          result.text;

      let content: T = rawOutput as T;
      if (schema) {
        content = JSON.parse(rawOutput);
      }

      // Estimate tokens since custom endpoints might not provide them
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
