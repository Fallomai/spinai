// Please install OpenAI SDK first: `npm install openai`

import OpenAI from "openai";
import { calculateCost } from "../utils/tokenCounter";
import { LLM, CompletionOptions, CompletionResult } from "../types/llms";

export interface DeepSeekAIConfig {
  apiKey: string;
  model?: string;
}

export function createDeepSeekAILLM(config: DeepSeekAIConfig): LLM {
  const client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: config.apiKey,
  });
  const defaultModel = "deepseek-chat";
  const model = config.model || defaultModel;
  return {
    modelName: model,
    async complete<T>({
      prompt,
      schema,
      temperature,
      maxTokens,
    }: CompletionOptions): Promise<CompletionResult<T>> {
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens,
        ...(schema && {
          response_format: { type: "json_object" },
          functions: [
            {
              name: "format_response",
              description: "Format the response according to schema",
              parameters: schema,
            },
          ],
          function_call: { name: "format_response" },
        }),
      });

      const choice = response.choices[0];
      let content: T;
      let rawOutput: string;
      if (schema) {
        const functionCall = choice?.message?.tool_calls?.[0];
        if (!functionCall || !functionCall.function) {
          throw new Error("Expected function call response");
        }
        content = JSON.parse(functionCall.function.arguments);
        rawOutput = functionCall.function.arguments;
      } else {
        content = choice.message.content as T;
        rawOutput = choice.message.content || "";
      }

      if (!response.usage) {
        throw new Error("No usage data in Deepseek response");
      }

      return {
        content,
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        costCents: calculateCost(
          response.usage.prompt_tokens,
          response.usage.completion_tokens,
          model
        ),
        rawInput: prompt,
        rawOutput,
      };
    },
  };
}
