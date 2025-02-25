import { LLM } from "./llms";
import { Action } from "./action";
import { ResponseFormat } from "./agent";

export interface PlanNextActionsResult {
  actions: string[];
  reasoning?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ActionParametersResult {
  parameters: Record<string, unknown>;
  reasoning: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface FormatResponseResult {
  response: unknown;
  reasoning: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ExecutedAction {
  id: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status: "success" | "error";
  errorMessage?: string;
}
export interface ActionPlannerState {
  input: string;
  state: Record<string, unknown>;
  executedActions: Array<ExecutedAction>;
  previousInteractionsActions?: Array<ExecutedAction>;
}

export interface ActionPlanner {
  planNextActions(params: {
    llm: LLM;
    input: string;
    plannerState: ActionPlannerState;
    availableActions: Action[];
    isRerun: boolean;
  }): Promise<PlanNextActionsResult>;

  getActionParameters(params: {
    llm: LLM;
    action: string;
    input: string;
    plannerState: ActionPlannerState;
    availableActions: Action[];
  }): Promise<ActionParametersResult>;

  formatResponse(params: {
    llm: LLM;
    input: string;
    plannerState: ActionPlannerState;
    responseFormat?: ResponseFormat;
  }): Promise<FormatResponseResult>;

  getTotalCost(): number;
  resetCost(): void;
}

export interface ActionPlannerConstructor {
  new (loggingService?: any, instructions?: string): ActionPlanner;
}
