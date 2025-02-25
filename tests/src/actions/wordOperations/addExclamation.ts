import { createAction } from "spinai";
import type { SpinAiContext } from "spinai";

export const addExclamation = createAction({
  id: "addExclamation",
  description: "Takes the capitalized word and adds exclamation marks to it.",
  parameters: {
    type: "object",
    properties: {
      word: {
        type: "string",
        description:
          "The current word up to this point to add exclamation marks to",
      },
    },
    required: ["word"],
  },
  dependsOn: ["capitalizeWord"],
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ): Promise<SpinAiContext> {
    const word = parameters?.word as string;
    console.log({ word });
    if (!word) {
      throw new Error("No word parameter provided");
    }

    const withExclamation = `!!!${word}!!!`;
    context.state.word = withExclamation;
    console.log({ new: context.state.word });

    return context;
  },
});
