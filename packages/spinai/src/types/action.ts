import { SpinAiContext } from "./context";

export interface Action {
  id: string;
  description: string;
  additionalInstructions?: string;
  parameters?: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  run: (
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ) => Promise<SpinAiContext>;
  dependsOn?: string[];
  retries?: number;
}

export interface ActionContext {
  input: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>;
}
