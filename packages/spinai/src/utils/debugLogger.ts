import { DebugMode, LogOptions } from "../types/debug";

let debugMode: DebugMode = "default";

export function setDebugEnabled(mode: DebugMode = "default") {
  debugMode = mode;
}

function formatDuration(ms: number): string {
  return `${ms}ms`;
}

function formatCost(cents: number): string {
  return `${cents}¢`;
}

function getLogIcon(type: LogOptions["type"] = "action"): string {
  switch (type) {
    case "llm":
      return "🤖";
    case "action":
      return "⚡";
    case "summary":
      return "📊";
    case "response":
      return "💬";
    default:
      return "⚡";
  }
}

// Basic metrics for actions (just duration)
function formatBasicMetrics(data?: Record<string, unknown>): string {
  if (!data?.durationMs) return "";
  return ` (took ${formatDuration(data.durationMs as number)})`;
}

// Full metrics for LLM operations
function formatLLMMetrics(data?: Record<string, unknown>): string {
  if (!data) return "";
  const parts = [];
  if (data.durationMs)
    parts.push(`took ${formatDuration(data.durationMs as number)}`);
  if (data.costCents)
    parts.push(`cost ${formatCost(data.costCents as number)}`);
  if (data.inputTokens) parts.push(`input tokens: ${data.inputTokens}`);
  if (data.outputTokens) parts.push(`output tokens: ${data.outputTokens}`);
  return parts.length ? ` (${parts.join(", ")})` : "";
}

// Summary metrics with executed actions
function formatSummaryMetrics(data?: Record<string, unknown>): string {
  if (!data) return "";
  const parts = [];
  if (data.durationMs)
    parts.push(`took ${formatDuration(data.durationMs as number)}`);
  if (data.costCents)
    parts.push(`cost ${formatCost(data.costCents as number)}`);
  if (
    debugMode !== "default" &&
    data.executedActions &&
    Array.isArray(data.executedActions) &&
    data.executedActions.length > 0
  ) {
    parts.push(`\n   Actions: ${data.executedActions.join(" → ")}`);
  }
  return parts.length ? ` (${parts.join(", ")})` : "";
}

// Default level: Basic one-line logs
function formatDefaultLog(message: string, options: LogOptions): string | null {
  const { type = "action", data } = options;

  // Only show essential logs in default mode
  if (
    type !== "summary" &&
    type !== "response" &&
    type !== "llm" &&
    type !== "action"
  ) {
    return null;
  }

  const icon = getLogIcon(type);
  let metrics = "";

  if (type === "llm") {
    metrics = formatLLMMetrics(data as Record<string, unknown>);
  } else if (type === "action") {
    metrics = formatBasicMetrics(data as Record<string, unknown>);
  } else if (type === "summary") {
    metrics = formatSummaryMetrics(data as Record<string, unknown>);
  }

  return `${icon} ${message}${metrics}`;
}

// Verbose level: Adds reasoning and parameters
function formatVerboseLog(message: string, options: LogOptions): string | null {
  const defaultLog = formatDefaultLog(message, options);
  if (!defaultLog) return null;

  const { data } = options;
  if (data && typeof data === "object") {
    const details = data as Record<string, unknown>;
    const extraInfo = [];

    if (details.reasoning) extraInfo.push(`Reasoning: ${details.reasoning}`);
    if (details.parameters)
      extraInfo.push(`Parameters: ${JSON.stringify(details.parameters)}`);

    if (extraInfo.length > 0) {
      return `${defaultLog}\n   ${extraInfo.join("\n   ")}`;
    }
  }

  return defaultLog;
}

// All level: Adds prompts
function formatAllLog(message: string, options: LogOptions): string | null {
  const verboseLog = formatVerboseLog(message, options);
  if (!verboseLog) return null;

  const { data } = options;
  if (data && typeof data === "object") {
    const details = data as Record<string, unknown>;
    if (details.prompt) {
      return `${verboseLog}\n📝 Prompt:\n${details.prompt}`;
    }
  }

  return verboseLog;
}

export function log(message: string, options: LogOptions = {}): void {
  if (debugMode === "none") return;

  let formattedLog: string | null = null;

  switch (debugMode) {
    case "default":
      formattedLog = formatDefaultLog(message, options);
      break;
    case "verbose":
      formattedLog = formatVerboseLog(message, options);
      break;
    case "all":
      formattedLog = formatAllLog(message, options);
      break;
  }

  if (formattedLog) {
    if (options.level === "error") {
      console.error(`❌ ${formattedLog}`);
    } else {
      console.log(formattedLog);
    }
  }
}
