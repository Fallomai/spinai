export interface CompletionUsage {
  inputTokens: number;
  outputTokens: number;
  costCents: number;
}

export interface CompletionResult<T> {
  content: T;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  rawInput: string;
  rawOutput: string;
}

export interface CompletionOptions {
  prompt: string;
  schema?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
}

export interface LLM {
  readonly modelName: string;
  complete<T = unknown>(
    options: CompletionOptions
  ): Promise<CompletionResult<T>>;
}
