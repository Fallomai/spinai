import { VercelClient } from "@vercel/ai";
import { calculateCost } from "../utils/tokenCounter";
import { LLM, CompletionOptions, CompletionResult } from "../types/llms";

export interface VercelConfig {
  apiKey: string;
  model?: string;
}

export function createVercelLLM(config: VercelConfig): LLM {
  const client = new VercelClient({ apiKey: config.apiKey });
  const defaultModel = "openai/gpt-4-turbo-preview";
  const model = config.model || defaultModel;

  return {
    modelName: model,
    async complete<T>({
      prompt,
      schema,
      temperature,
      maxTokens,
    }: CompletionOptions): Promise<CompletionResult<T>> {
      const response = await client.generate({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens,
        ...(schema && {
          format: "json",
          schema: schema,
        }),
      });

      let content: T;
      let rawOutput: string;

      if (schema) {
        content = response.data as T;
        rawOutput = JSON.stringify(response.data);
      } else {
        content = response.text as T;
        rawOutput = response.text;
      }

      return {
        content,
        inputTokens: response.usage?.promptTokens || 0,
        outputTokens: response.usage?.completionTokens || 0,
        costCents: calculateCost(
          response.usage?.promptTokens || 0,
          response.usage?.completionTokens || 0,
          model
        ),
        rawInput: prompt,
        rawOutput,
      };
    },
  };
}
