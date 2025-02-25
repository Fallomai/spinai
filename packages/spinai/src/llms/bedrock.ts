import {
  BedrockRuntimeClient,
  ConverseCommand,
  ToolChoice,
} from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";
import { LLM, CompletionOptions, CompletionResult } from "../types/llms";
import { calculateCost } from "../utils/tokenCounter";

export interface BedrockConfig {
  region?: string;
  access_key?: string;
  secret_key?: string;
  profile?: string;
  model?: string;
}

export function createBedrockLLM(config: BedrockConfig): LLM {
  const credentials =
    config.access_key && config.secret_key
      ? {
          accessKeyId: config.access_key,
          secretAccessKey: config.secret_key,
        }
      : config.profile
        ? fromIni({ profile: config.profile })
        : undefined;

  const bedrock = new BedrockRuntimeClient({
    region: config.region,
    profile: config.profile,
    credentials,
  });

  const defaultModel = "anthropic.claude-3-5-sonnet-20240620-v1:0";
  const model = config.model || defaultModel;

  return {
    modelName: model,
    async complete<T>({
      prompt,
      schema,
      temperature,
      maxTokens,
    }: CompletionOptions): Promise<CompletionResult<T>> {
      const response = await bedrock.send(
        new ConverseCommand({
          modelId: model,
          messages: [{ role: "user", content: [{ text: prompt }] }],
          inferenceConfig: {
            // InferenceConfiguration
            maxTokens: maxTokens ?? 1024, // Ensure maxTokens is always a number
            temperature: temperature ?? 0.7,
          },
          ...(schema && {
            system: [
              {
                text: `Respond only with a JSON object matching this schema:\n${JSON.stringify(schema, null, 2)}`,
              },
            ],
          }),
        })
      );

      // Ensure response.output and response.output.message exist before accessing them
      const rawOutput = response.output?.message?.content?.[0]?.text ?? null;

      if (!rawOutput) {
        throw new Error("Expected text response from Bedrock");
      }

      let content: T = rawOutput as T;
      if (schema) {
        content = JSON.parse(rawOutput);
      }

      // Ensure response.usage exists and assign default values if undefined
      const inputTokens = response.usage?.inputTokens ?? 0;
      const outputTokens = response.usage?.outputTokens ?? 0;

      return {
        content,
        inputTokens,
        outputTokens,
        costCents: calculateCost(inputTokens, outputTokens, model),
        rawInput: prompt,
        rawOutput,
      };
    },
  };
}
