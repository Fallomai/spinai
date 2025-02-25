import { Action } from "./action";
import { LLM } from "./llms";
import { DebugMode } from "./debug";

export interface JSONResponseFormat {
  type: "json";
  schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export type ResponseFormat = { type: "text" } | JSONResponseFormat;

export interface AgentConfig {
  instructions: string;
  actions: Action[];
  llm: LLM;
  agentId?: string;
  spinApiKey?: string;
  training?: {
    systemInstructions?: string;
    completionInstructions?: string;
  };
  responseFormat?: ResponseFormat;
  debug?: DebugMode;
}

export interface AgentResponse<T = unknown> {
  response: T;
  sessionId: string;
  interactionId: string;
  totalDurationMs: number;
  totalCostCents: number;
  state: Record<string, unknown>;
}
