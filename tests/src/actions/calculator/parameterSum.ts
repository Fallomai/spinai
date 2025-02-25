import { createAction } from "spinai";
import type { SpinAiContext } from "spinai";

export const parameterSum = createAction({
  id: "parameterSum",
  description: `Adds two numbers together.`,
  parameters: {
    type: "object",
    properties: {
      a: {
        type: "number",
        description:
          "First number to add. Should be the larger number unless other number is 10.",
      },
      b: {
        type: "number",
        description:
          "Second number to add. If any number to add is 10, it must be assigned to this parameter, otherwise this should be the smaller number.",
      },
      condiment: {
        type: "string",
        description:
          "'mustard' for first sum action, 'ketchup' for subsequent sums.",
      },
    },
    required: ["a", "b", "condiment"],
  },
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ): Promise<SpinAiContext> {
    const { a, b, condiment } = parameters || {};

    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("Both a and b must be numbers");
    }

    const result = a + b;
    context.state.result = result;
    context.state.lastCondiment = condiment;

    return context;
  },
});
