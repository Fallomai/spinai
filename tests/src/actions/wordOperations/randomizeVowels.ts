import { createAction } from "spinai";
import type { SpinAiContext } from "spinai";

const vowels = ["a", "e", "i", "o", "u"];

export const randomizeVowels = createAction({
  id: "randomizeVowels",
  description: "Takes the input word and randomizes its vowels.",
  parameters: {
    type: "object",
    properties: {
      word: {
        type: "string",
        description: "The current word thus far to randomize vowels for",
      },
    },
  },
  dependsOn: ["addExclamation"],
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ): Promise<SpinAiContext> {
    const word = parameters?.word as string;
    console.log({ word });
    if (!word) {
      throw new Error("No word parameter provided");
    }

    const randomizedWord = word
      .split("")
      .map((char) => {
        if (vowels.includes(char.toLowerCase())) {
          const randomIndex = Math.floor(Math.random() * vowels.length);
          return vowels[randomIndex];
        }
        return char;
      })
      .join("");

    context.state.word = randomizedWord;
    return context;
  },
});
