import { LLM } from "../llms/base";
import { Action } from "./action";
import { ResponseFormat } from "./agent";

export interface ExecutedAction {
  id: string;
  parameters: Record<string, unknown>;
  status: "success" | "error" | "max_retries_exceeded";
  result?: unknown;
  errorMessage?: string;
  retryCount?: number;
  timestamp: number;
}

export interface ActionPlannerState {
  input: string;
  context: Record<string, unknown>;
  executedActions: ExecutedAction[];
}

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

export interface ActionPlanner {
  planNextActions(params: {
    llm: LLM;
    input: string;
    state: ActionPlannerState;
    availableActions: Action[];
    isRerun: boolean;
  }): Promise<PlanNextActionsResult>;

  getActionParameters(params: {
    llm: LLM;
    action: string;
    input: string;
    state: ActionPlannerState;
    availableActions: Action[];
  }): Promise<ActionParametersResult>;

  formatResponse(params: {
    llm: LLM;
    input: string;
    state: ActionPlannerState;
    responseFormat?: ResponseFormat;
  }): Promise<FormatResponseResult>;

  getTotalCost(): number;
  resetCost(): void;
}

export interface ActionPlannerConstructor {
  new (loggingService?: any, instructions?: string): ActionPlanner;
}
