import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { calculateCost } from "../utils/tokenCounter";
import { LLM, CompletionOptions, CompletionResult } from "../types/llms";

export interface xAIConfig {
  apiKey: string;
  model?: string;
}

export function createXAILLM(config: xAIConfig): LLM {
  if (!config.apiKey) {
    throw new Error("xAI API key is required");
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: "https://api.x.ai/v1",
  });

  const defaultModel = "grok-2-1212";
  const model = config.model || defaultModel;

  return {
    modelName: model,
    async complete<T>({
      prompt,
      schema,
      temperature,
      maxTokens,
    }: CompletionOptions): Promise<CompletionResult<T>> {
      try {
        const messages: ChatCompletionMessageParam[] = [
          ...(schema
            ? [
                {
                  role: "system" as const,
                  content: `Respond with a JSON object matching this schema: ${JSON.stringify(
                    schema,
                    null,
                    2
                  )}`,
                },
              ]
            : []),
          { role: "user" as const, content: prompt },
        ];

        const response = await client.chat.completions.create({
          model,
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens,
          response_format: schema ? { type: "json_object" } : undefined,
        });

        const choice = response.choices[0];
        const rawOutput = choice.message.content || "";
        let content: T;

        if (schema) {
          try {
            content = JSON.parse(rawOutput);
          } catch (e) {
            throw new Error(
              `Failed to parse JSON response: ${rawOutput} error: ${e}`
            );
          }
        } else {
          content = rawOutput as T;
        }

        return {
          content,
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          costCents: calculateCost(
            response.usage?.prompt_tokens || 0,
            response.usage?.completion_tokens || 0,
            model
          ),
          rawInput: prompt,
          rawOutput,
        };
      } catch (error) {
        console.error("xAI completion error:", error);
        throw error;
      }
    },
  };
}
