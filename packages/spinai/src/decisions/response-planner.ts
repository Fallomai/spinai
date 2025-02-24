import { LLM } from "../llms/base";
import { ActionPlannerState, FormatResponseResult } from "../types/planner";
import { ResponseFormat } from "../types/agent";
import { FORMAT_RESPONSE_SCHEMA } from "../types/schemas";
import { FORMAT_RESPONSE_PROMPT } from "../types/prompts";
import { log } from "../utils/debugLogger";
import { BasePlanner } from "./base-planner";

export class ResponsePlanner extends BasePlanner {
  async formatResponse({
    llm,
    input,
    plannerState,
    responseFormat,
  }: {
    llm: LLM;
    input: string;
    plannerState: ActionPlannerState;
    responseFormat?: ResponseFormat;
  }): Promise<FormatResponseResult> {
    const formatInstructions =
      responseFormat?.type === "json"
        ? `Format the response as JSON matching this schema:\n${JSON.stringify(responseFormat.schema, null, 2)}`
        : "Format the response as a clear text summary of what was done and their outcomes";

    const prompt = FORMAT_RESPONSE_PROMPT.replace(
      "{{instructions}}",
      this.instructions
    )
      .replace("{{input}}", input)
      .replace("{{plannerState}}", this.formatPlannerState(plannerState))
      .replace("{{responseFormat}}", formatInstructions);

    const startTime = Date.now();

    if (responseFormat?.type === "json") {
      const result = await llm.complete<unknown>({
        prompt,
        schema: responseFormat.schema,
      });
      const durationMs = Date.now() - startTime;
      this.trackCost(result.costCents);

      const formattedResult = {
        response: result.content,
        reasoning: "Response formatted as JSON according to specified schema",
      };

      log("Generated response", {
        type: "llm",
        data: {
          durationMs,
          costCents: result.costCents,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          reasoning: formattedResult.reasoning,
          prompt,
        },
      });

      if (this.loggingService) {
        this.loggingService.logPlanFinalResponse(
          plannerState,
          formattedResult.reasoning,
          llm.modelName,
          result.inputTokens,
          result.outputTokens,
          result.costCents,
          durationMs,
          formattedResult.response,
          prompt,
          result.rawOutput
        );
      }

      return formattedResult;
    } else {
      const result = await llm.complete<FormatResponseResult>({
        prompt,
        schema: FORMAT_RESPONSE_SCHEMA,
      });
      const durationMs = Date.now() - startTime;
      this.trackCost(result.costCents);

      log("Generated response", {
        type: "llm",
        data: {
          durationMs,
          costCents: result.costCents,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          reasoning: result.content.reasoning,
          prompt,
        },
      });

      if (this.loggingService) {
        this.loggingService.logPlanFinalResponse(
          plannerState,
          result.content.reasoning,
          llm.modelName,
          result.inputTokens,
          result.outputTokens,
          result.costCents,
          durationMs,
          result.content.response,
          prompt,
          result.rawOutput
        );
      }

      return result.content;
    }
  }
}
