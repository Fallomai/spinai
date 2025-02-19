import { createAction } from "spinai";
import type { SpinAiContext } from "spinai";

export const minus = createAction({
  id: "minus",
  description:
    "Subtracts two numbers. Extract the numbers from the user's request and provide them as parameters 'a' and 'b'. Example: For 'what is 5 minus 3', use a=5 and b=3.",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "Number to subtract from" },
      b: { type: "number", description: "Number to subtract" },
    },
    required: ["a", "b"],
  },
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ): Promise<SpinAiContext> {
    const { a, b } = parameters || {};
    console.log({ a, b });

    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("Both a and b must be numbers");
    }

    const result = a - b;
    context.state.result = result;

    return context;
  },
});
