import { LLM } from "../llms/base";
import { Action } from "../types/action";
import { ActionPlannerState, PlanNextActionsResult } from "../types/planner";
import { PLAN_NEXT_ACTIONS_SCHEMA } from "../types/schemas";
import {
  PLAN_NEXT_ACTIONS_PROMPT,
  PLAN_NEXT_ACTIONS_RERUN_PROMPT,
} from "../types/prompts";
import { log } from "../utils/debugLogger";
import { BasePlanner } from "./base-planner";

export class ActionPlanner extends BasePlanner {
  async planNextActions({
    llm,
    input,
    plannerState,
    availableActions,
    isRerun,
  }: {
    llm: LLM;
    input: string;
    plannerState: ActionPlannerState;
    availableActions: Action[];
    isRerun: boolean;
  }): Promise<PlanNextActionsResult> {
    const promptTemplate = isRerun
      ? PLAN_NEXT_ACTIONS_RERUN_PROMPT
      : PLAN_NEXT_ACTIONS_PROMPT;

    const { state, previousInteractionsActions, executedActions } =
      plannerState;

    const prompt = promptTemplate
      .replace("{{instructions}}", this.instructions)
      .replace("{{input}}", input)
      .replace(
        "{{availableActions}}",
        this.formatAvailableActions(availableActions)
      )
      .replace(
        "{{state.context}}",
        JSON.stringify(
          Object.fromEntries(
            Object.entries(state).filter(
              ([key]) =>
                !["executedActions", "previousInteractionsActions"].includes(
                  key
                )
            )
          ),
          null,
          2
        )
      )
      .replace(
        "{{state.previousInteractionsActions}}",
        JSON.stringify(previousInteractionsActions || [], null, 2)
      )
      .replace(
        "{{state.executedActions}}",
        JSON.stringify(executedActions || [], null, 2)
      )
      .replace("{{plannerState}}", this.formatPlannerState(plannerState));

    const startTime = Date.now();
    const result = await llm.complete<PlanNextActionsResult>({
      prompt,
      schema: PLAN_NEXT_ACTIONS_SCHEMA,
    });
    const durationMs = Date.now() - startTime;

    this.trackCost(result.costCents);

    log(
      `Next actions: ${result.content.actions.length === 0 ? "none" : result.content.actions.join(", ")}`,
      {
        type: "llm",
        data: {
          durationMs,
          costCents: result.costCents,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          reasoning: result.content.reasoning,
          prompt,
        },
      }
    );

    if (this.loggingService) {
      this.loggingService.logPlanNextActions(
        plannerState,
        result.content.reasoning,
        result.content.actions,
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
