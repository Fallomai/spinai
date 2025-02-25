import OpenAI from "openai";
import { calculateCost } from "../utils/tokenCounter";
import { LLM, CompletionOptions, CompletionResult } from "../types/llms";

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

export function createOpenAILLM(config: OpenAIConfig): LLM {
  const client = new OpenAI({ apiKey: config.apiKey });
  const defaultModel = "gpt-4-turbo-preview";
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
        const functionCall = choice.message.function_call;
        if (!functionCall?.arguments) {
          throw new Error("Expected function call response");
        }
        content = JSON.parse(functionCall.arguments);
        rawOutput = functionCall.arguments;
      } else {
        content = choice.message.content as T;
        rawOutput = choice.message.content || "";
      }

      if (!response.usage) {
        throw new Error("No usage data in OpenAI response");
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
