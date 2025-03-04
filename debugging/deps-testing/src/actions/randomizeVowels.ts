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
        description: "The word to randomize vowels for",
      },
    },
    required: ["word"],
  },
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>
  ): Promise<SpinAiContext> {
    const word = parameters?.word as string;
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

    context.state.generatedWord = randomizedWord;
    return context;
  },
});
