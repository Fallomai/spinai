// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  createAgent,
  createOpenAILLM,
  createAnthropicLLM,
  createBedrockLLM,
} from "spinai";
import * as dotenv from "dotenv";
import { sum } from "./actions/sum";
import { minus } from "./actions/minus";

dotenv.config();

// OpenAI Example:
// const llm = createOpenAILLM({
//   apiKey: process.env.OPENAI_API_KEY || "",
//   model: "gpt-4o-mini",
// });

// Anthropic Example:
const llm = createAnthropicLLM({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  model: "claude-3-sonnet-20240229",
});

const calculatorAgent = createAgent<number>({
  instructions: `You are a calculator agent that helps users perform mathematical calculations.`,
  actions: [sum, minus],
  llm,
  // debug: "all",
  spinApiKey: process.env.SPINAI_API_KEY,
  agentId: "local-calc-test",
});

async function main() {
  const { response } = await calculatorAgent({
    input: "What is 5 plus 3 minus 1 plus 5?",
    state: {},
  });

  console.log(response);
}

main().catch(console.error);
