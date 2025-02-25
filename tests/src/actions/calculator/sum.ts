import { createAction } from "spinai";
import type { SpinAiContext } from "spinai";

export const sum = createAction({
  id: "sum",
  description: "Adds two numbers together.",
  parameters: {
    type: "object",
    properties: {
      a: {
        type: "number",
        description: "First number to add. Always put the bigger number here.",
      },
      b: { type: "number", description: "Second number to add" },
    },
    required: ["a", "b"],
  },
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ): Promise<SpinAiContext> {
    const { a, b } = parameters || {};

    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("Both a and b must be numbers");
    }

    const result = a + b;
    context.state.result = result;

    return context;
  },
});
