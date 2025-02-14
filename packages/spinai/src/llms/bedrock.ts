import { BedrockRuntimeClient, ConverseCommand, ToolChoice } from "@aws-sdk/client-bedrock-runtime";
import { LLM, CompletionOptions, CompletionResult } from "./base";
import { calculateCost } from "../utils/tokenCounter";
import { json } from "stream/consumers";

export interface BedrockConfig {
  region?: string;
  access_key?: string;
  secret_key?: string;
  profile?: string;
  model?: string;
}

export function createBedrockLLM(config: BedrockConfig): LLM {
  const bedrock = new BedrockRuntimeClient({
    region: config.region,
    profile: config.profile,
    credentials: {
      accessKeyId: config.access_key,
      secretAccessKey: config.secret_key
    },
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

      const toolChoice: ToolChoice = model.startsWith("anthropic.claude-3")
        ? {
          tool: {
            name: "json_output", // When  using Claude 3
          },
        }
        : {
          auto: {}, // Default behavior when not using Claude 3
        };

      const response = await bedrock.send(new ConverseCommand({
        modelId: model,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { // InferenceConfiguration
          maxTokens: maxTokens || 1024,
          temperature: temperature ?? 0.7,
        },
        toolConfig: {
          tools: [
            {
              toolSpec: {
                name: "json_output", // required
                description: `Respond only with a JSON object matching this schema:\n${JSON.stringify(schema, null, 2)}`,
                inputSchema: {
                  json: JSON.stringify(schema),
                },
              },
            },
          ],
          toolChoice
        }
      }));

      const rawOutput = response.output.message?.content?.[0]?.text || "";

      if (!rawOutput) {
        throw new Error("Expected text response from Bedrock");
      }

      let content: T = rawOutput as T;
      if (schema) {
        content = JSON.parse(rawOutput);
      }

      return {
        content,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        costCents: calculateCost(
          response.usage.inputTokens,
          response.usage.outputTokens,
          model
        ),
        rawInput: prompt,
        rawOutput,
      };
    },
  };
}
