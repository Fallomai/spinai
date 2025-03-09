import { createAgent, createActionsFromMcpConfig } from "spinai";
import * as dotenv from "dotenv";
import { openai } from "@ai-sdk/openai";
// @ts-ignore
import mcpConfig from "../mcp-config.js";

dotenv.config();

async function main() {
  // Create actions from MCP configuration
  console.log("Setting up MCP actions...");
  const mcpActions = await createActionsFromMcpConfig(mcpConfig);

  const agent = createAgent({
    instructions: `You are a GitHub assistant that can help with repository management.
    Use the available GitHub actions to help users with their requests.`,
    actions: [...mcpActions],
    model: openai("gpt-4o"),
  });

  const { response } = await agent({
    input: "Create a github repo called 'GlubGlub' please",
  });

  console.log("Response:", response);
}

main().catch(console.error);
