import { v4 as uuidv4 } from "uuid";
import type { Action } from "../types/action";
import type { SpinAiContext } from "../types/context";
import type {
  AgentConfig,
  AgentResponse,
  ResponseFormat,
} from "../types/agent";
import { log, setDebugEnabled } from "./debugLogger";
import { LoggingService } from "./logging";
import { ActionPlanner } from "../decisions/action-planner";
import { ParameterPlanner } from "../decisions/parameter-planner";
import { ResponsePlanner } from "../decisions/response-planner";
import { LLM } from "../llms/base";
import { ActionPlannerState } from "../types/planner";
import { DebugMode } from "../types/debug";

export async function runTaskLoop<T = string>(params: {
  actions: Action[];
  context: SpinAiContext;
  model: LLM;
  instructions: string;
  training?: AgentConfig["training"];
  responseFormat?: ResponseFormat;
  agentId?: string;
  spinApiKey?: string;
  debug?: DebugMode;
}): Promise<AgentResponse<T>> {
  const { actions, model } = params;
  let context = { ...params.context };

  // Set debug logging based on parameter
  setDebugEnabled(params.debug ?? "default");

  // Track total cost
  let totalCostCents = 0;

  log(`Starting interaction with ${params.debug ?? "default"} logging`, {
    type: "summary",
  });

  // Initialize session tracking
  const sessionId = context.sessionId || uuidv4();
  const interactionId = uuidv4();
  context.sessionId = sessionId;
  context.interactionId = interactionId;

  // Initialize logging service
  const taskStartTime = Date.now();
  const logger = new LoggingService({
    agentId: params.agentId,
    spinApiKey: params.spinApiKey,
    sessionId,
    interactionId,
    llmModel: model.modelName,
    externalCustomerId: context.externalCustomerId,
    isRerun: context.isRerun ?? false,
  });

  // Initialize planners
  const actionPlanner = new ActionPlanner(logger, params.instructions);
  const parameterPlanner = new ParameterPlanner(logger, params.instructions);
  const responsePlanner = new ResponsePlanner(logger, params.instructions);

  const plannerState: ActionPlannerState = {
    input: context.input,
    state: context.state,
    executedActions: [],
  };

  if (context?.isRerun && context?.state?.executedActions) {
    plannerState.previousInteractionsActions = context.state.executedActions;
  }

  // Track retry attempts for each action
  const actionRetries = new Map<string, number>();

  try {
    // Log interaction start
    await logger.logInteractionStart(context.input);

    while (true) {
      // Plan next actions
      const planResult = await actionPlanner.planNextActions({
        llm: model,
        input: context.input,
        plannerState,
        availableActions: actions,
        isRerun: context.isRerun ?? false,
      });
      totalCostCents += actionPlanner.getTotalCost();
      actionPlanner.resetCost();

      // If no actions planned, format final response and return
      if (planResult.actions.length === 0) {
        log("Generating final response...", { type: "action" });

        const responseResult = await responsePlanner.formatResponse({
          llm: model,
          input: context.input,
          plannerState,
          responseFormat: params.responseFormat,
        });
        totalCostCents += responsePlanner.getTotalCost();

        log(responseResult.response as string, { type: "response" });

        const totalDuration = Date.now() - taskStartTime;

        // Create interaction summary
        const interactionSummary = {
          interactionId,
          originalInput: context.input,
          executedActions: plannerState.executedActions,
          finalResponse: responseResult.response,
          finalState: context.state.finalState || context.state,
          ...(context.isRerun && context.state.previousInteraction
            ? {
                previousInteraction: {
                  interactionId:
                    context.state.previousInteraction.interactionId,
                  originalInput:
                    context.state.previousInteraction.originalInput,
                  executedActions:
                    context.state.previousInteraction.executedActions,
                  finalResponse:
                    context.state.previousInteraction.finalResponse,
                },
              }
            : {}),
        };

        // If this is a re-run, store current interaction as previous before updating
        if (context.isRerun) {
          context.state.previousInteraction = {
            interactionId: context.state.interactionId,
            originalInput: context.state.originalInput,
            executedActions: context.state.executedActions || [],
            finalResponse: context.state.finalResponse,
          };
        }

        // Store minimal interaction info in state
        context.state.interactionId = interactionId;
        context.state.originalInput = context.input;
        context.state.executedActions = plannerState.executedActions;
        context.state.finalResponse = responseResult.response;

        log("Interaction complete", {
          type: "summary",
          data: {
            durationMs: totalDuration,
            costCents: totalCostCents,
            interactionState: interactionSummary,
          },
        });

        await logger.logInteractionComplete(
          responseResult.response,
          totalDuration,
          undefined,
          interactionSummary
        );

        return {
          response: responseResult.response as T,
          sessionId,
          interactionId,
          totalDurationMs: totalDuration,
          totalCostCents: totalCostCents,
          state: context.state,
        };
      }

      // Execute each planned action in dependency order
      for (const plannedActionId of planResult.actions) {
        const action = actions.find((a) => a.id === plannedActionId);
        if (!action) {
          const errorMessage = `Action ${plannedActionId} not found`;
          log(errorMessage, { type: "action" });
          plannerState.executedActions.push({
            id: plannedActionId,
            status: "error",
            errorMessage,
          });
          continue;
        }

        const maxRetries = action.retries ?? 2; // Default to 2 retries if not specified
        let currentRetries = actionRetries.get(plannedActionId) ?? 0;
        let lastError: Error | undefined;
        let parameters: Record<string, unknown> | undefined;

        // Keep retrying until success or max retries exceeded
        while (currentRetries <= maxRetries) {
          const entireActionStartTime = Date.now();

          try {
            // Only get parameters on first try or if they're undefined
            if (!parameters && action.parameters) {
              const paramResult = await parameterPlanner.getActionParameters({
                llm: model,
                action: action.id,
                input: context.input,
                plannerState,
                availableActions: actions,
              });
              parameters = paramResult.parameters;
              totalCostCents += parameterPlanner.getTotalCost();
              parameterPlanner.resetCost();
            }

            const actionStartTime = Date.now();
            // Execute the action
            context = await action.run(context, parameters);
            const actionDuration = Date.now() - actionStartTime;
            log(`Finished executing ${action.id}`, {
              type: "action",
              data: {
                durationMs: actionDuration,
              },
            });

            // Reset retry count on success
            actionRetries.delete(plannedActionId);

            // Add successful execution to state
            plannerState.executedActions.push({
              id: action.id,
              parameters,
              result: context.state[action.id],
              status: "success",
            });

            // Log success
            logger.logActionComplete(
              action.id,
              context.state,
              actionDuration,
              context.state[action.id]
            );

            // Break out of retry loop on success
            break;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error(String(error));
            const errorMessage = lastError.message;
            const actionErrorDuration = Date.now() - entireActionStartTime;

            // Increment retry count
            currentRetries++;
            actionRetries.set(plannedActionId, currentRetries);

            // Log the error with retry information
            if (currentRetries <= maxRetries) {
              log(
                `Action error: ${errorMessage} (Retry ${currentRetries}/${maxRetries})`,
                {
                  type: "action",
                  data: error,
                }
              );

              // Log error but don't add to plannerState yet
              logger.logActionComplete(
                action.id,
                context.state,
                actionErrorDuration,
                undefined,
                { message: errorMessage }
              );

              // Continue to next retry attempt
              continue;
            }

            // If we've exhausted all retries, mark as permanently failed
            log(
              `Action error: ${errorMessage} (Max retries ${maxRetries} exceeded)`,
              {
                type: "action",
                data: error,
              }
            );

            // Only add to plannerState after all retries are exhausted
            plannerState.executedActions.push({
              id: action.id,
              parameters,
              status: "error",
              errorMessage: `${errorMessage} (Max retries ${maxRetries} exceeded)`,
            });

            // Log final error
            logger.logActionComplete(
              action.id,
              context.state,
              actionErrorDuration,
              undefined,
              { message: errorMessage }
            );
          }
        }
      }
    }
  } catch (error) {
    const errorDuration = Date.now() - taskStartTime;
    logger.logActionError(
      "task_loop_error",
      error,
      context.state,
      errorDuration
    );
    await logger.logInteractionComplete(null, errorDuration, error as Error);
    throw error;
  }
}
