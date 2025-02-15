import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateCost } from "../utils/tokenCounter";
import { CompletionOptions, CompletionResult, LLM } from "./base";

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

export function createGeminiLLM(config: GeminiConfig): LLM {
  const client = new GoogleGenerativeAI(config.apiKey);
  const defaultModel = "gemini-2.0-flash";
  const model = config.model || defaultModel;

  return {
    modelName: model,
    async complete<T>({
      prompt,
      schema,
      temperature,
      maxTokens,
    }: CompletionOptions): Promise<CompletionResult<T>> {
      const generativeModel = client.getGenerativeModel({ model });

      const data = await generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: temperature ?? 0.7,
          maxOutputTokens: maxTokens,
        },
      });

      const candidate = data.response.candidates?.[0];
      if (!candidate) throw new Error("No response from Gemini");

      let rawOutput: string = candidate.content?.parts?.[0]?.text || "";

      rawOutput = rawOutput.replace(/^\s*```(?:json)?|```\s*$/g, "").trim();

      let content: T;
      if (schema) {
        try {
          const parsedOutput = JSON.parse(rawOutput);

          if (
            typeof parsedOutput !== "object" ||
            !parsedOutput ||
            !("response" in parsedOutput) ||
            !("reasoning" in parsedOutput)
          ) {
            // Ignore Warning: 'throw' of exception caught locally
            throw new Error("Parsed response does not match schema");
          }

          content = parsedOutput;
        } catch {
          content = {
            response: rawOutput,
            reasoning: "Fallback: AI returned invalid JSON.",
            actions: [],
          } as T;
          rawOutput = JSON.stringify(content);
        }
      } else {
        content = rawOutput as T;
      }

      return {
        content,
        inputTokens: data.response.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.response.usageMetadata?.candidatesTokenCount || 0,
        costCents: calculateCost(
          data.response.usageMetadata?.promptTokenCount || 0,
          data.response.usageMetadata?.candidatesTokenCount || 0,
          model,
        ),
        rawInput: prompt,
        rawOutput,
      };
    },
  };
}
