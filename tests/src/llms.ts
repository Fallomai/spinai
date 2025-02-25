import { createOpenAILLM, type LLM } from "spinai";

// this is the LLM all the tests will use - swap this out with different providers to test that they work

export const testLLM: LLM = createOpenAILLM({
  apiKey: process.env.OPENAI_API_KEY || "",
  model: "gpt-4o-mini",
});
