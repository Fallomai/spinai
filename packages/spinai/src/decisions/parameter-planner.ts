import { LLM } from "../llms/base";
import { Action } from "../types/action";
import { ActionPlannerState, ActionParametersResult } from "../types/planner";
import { ACTION_PARAMETERS_SCHEMA } from "../types/schemas";
import { GET_ACTION_PARAMETERS_PROMPT } from "../types/prompts";
import { log } from "../utils/debugLogger";
import { BasePlanner } from "./base-planner";
import Ajv from "ajv";

export class ParameterPlanner extends BasePlanner {
  private ajv: Ajv;

  constructor(loggingService?: any, instructions: string = "") {
    super(loggingService, instructions);
    this.ajv = new Ajv();
  }

  async getActionParameters({
    llm,
    action,
    input,
    plannerState,
    availableActions,
  }: {
    llm: LLM;
    action: string;
    input: string;
    plannerState: ActionPlannerState;
    availableActions: Action[];
  }): Promise<ActionParametersResult> {
    const actionDef = availableActions.find((a) => a.id === action);
    if (!actionDef?.parameters) {
      throw new Error(`Action ${action} has no parameter schema defined`);
    }

    const validate = this.ajv.compile(actionDef.parameters);
    if (!validate.schema) {
      throw new Error(
        `Invalid JSON schema for action ${action}: ${this.ajv.errorsText(validate.errors)}`
      );
    }

    const prompt = GET_ACTION_PARAMETERS_PROMPT.replace("{{action}}", action)
      .replace("{{instructions}}", this.instructions)
      .replace("{{input}}", input)
      .replace("{{actionDescription}}", actionDef.description)
      .replace(
        "{{parameterSchema}}",
        JSON.stringify(actionDef.parameters, null, 2)
      )
      .replace("{{plannerState}}", this.formatPlannerState(plannerState));

    const startTime = Date.now();
    const result = await llm.complete<ActionParametersResult>({
      prompt,
      schema: {
        ...ACTION_PARAMETERS_SCHEMA,
        properties: {
          ...ACTION_PARAMETERS_SCHEMA.properties,
          parameters: actionDef.parameters,
        },
      },
    });
    const durationMs = Date.now() - startTime;

    this.trackCost(result.costCents);

    log(`Generated parameters for ${action}`, {
      type: "llm",
      data: {
        durationMs,
        costCents: result.costCents,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        reasoning: result.content.reasoning,
        parameters: result.content.parameters,
        prompt,
      },
    });

    if (this.loggingService) {
      this.loggingService.logPlanActionParameters(
        action,
        result.content.parameters,
        plannerState,
        result.content.reasoning,
        llm.modelName,
        result.inputTokens,
        result.outputTokens,
        result.costCents,
        durationMs,
        result.content,
        prompt,
        result.rawOutput
      );
    }

    return result.content;
  }
}
