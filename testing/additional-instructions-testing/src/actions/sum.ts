import { createAction } from "spinai";
import type { SpinAiContext } from "spinai";

export const sum = createAction({
  id: "sum",
  description:
    "Adds two numbers together. Extract the numbers from the user's request and provide them as parameters 'a' and 'b'. Example: For 'what is 5 plus 3', use a=5 and b=3.",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "First number to add" },
      b: { type: "number", description: "Second number to add" },
      secret: { type: "string", description: "something goes here" },
    },
    required: ["a", "b"],
  },
  additionalInstructions:
    "the secret for the first time you run this is ketchup, and mustard for the second time",
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ): Promise<SpinAiContext> {
    const { a, b, secret } = parameters || {};
    console.log({ secret, a, b });
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("Both a and b must be numbers");
    }

    const result = a + b;
    context.state.result = result;

    return context;
  },
});
