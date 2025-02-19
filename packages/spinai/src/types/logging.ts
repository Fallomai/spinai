export interface ExecutedActionSummary {
  id: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status: "success" | "error" | "max_retries_exceeded";
  errorMessage?: string;
  retryCount?: number;
  timestamp: number;
}

export interface InteractionSummary {
  interactionId: string;
  originalInput: string;
  executedActions: ExecutedActionSummary[];
  finalResponse: unknown;
  finalState: unknown;
  previousInteraction?: {
    interactionId: string;
    originalInput: string;
    executedActions: ExecutedActionSummary[];
    finalResponse: unknown;
  };
}

export interface StepLogEntry {
  id: string;
  stepType:
    | "interaction_start"
    | "plan_next_actions"
    | "plan_action_parameters"
    | "execute_action"
    | "plan_final_response"
    | "interaction_complete";
  timestamp: string;
  sessionId: string;
  interactionId: string;
  context: Record<string, unknown>;
  reasoning?: string;
  // For action planning
  plannedActions?: string[];
  // For parameter planning
  targetActionId?: string;
  actionParameters?: Record<string, unknown>;
  // For action execution
  executedActionId?: string;
  actionResult?: unknown;
  // Common fields
  status?: "started" | "completed" | "failed";
  durationMs?: number;
  costCents?: number;
  modelUsed?: string;
  errorMessage?: string;
  errorSeverity?: "info" | "warning" | "critical";
  errorContext?: Record<string, unknown>;
  inputTokens?: number;
  outputTokens?: number;
  response?: unknown;
  interactionState?: InteractionSummary;
  rawInput?: string;
  rawOutput?: string;
}

export interface InteractionLogEntry {
  id: string;
  sessionId: string;
  inputText: string;
  response?: unknown;
  modelUsed?: string;
  costCents?: number;
  durationMs?: number;
  status?: "success" | "failed";
  errorMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  timestamp: string;
  isRerun: boolean;
  interactionState?: InteractionSummary;
}

export interface LogPayload {
  timestamp: string;
  agentId: string;
  sessionId: string;
  interactionId: string;
  type: "interaction" | "step";
  data: StepLogEntry | InteractionLogEntry;
  spinApiKey: string;
  externalCustomerId?: string;
}
