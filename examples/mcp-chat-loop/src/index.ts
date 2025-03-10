import { createAgent, createActionsFromMcpConfig } from "spinai";
import * as dotenv from "dotenv";
import { openai } from "@ai-sdk/openai";
import * as readline from "readline";
// @ts-ignore
import mcpConfig from "../mcp-config.ts";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function chat() {
  console.log("Setting up...");
  const mcpActions = await createActionsFromMcpConfig({
    config: mcpConfig,
    envMapping: {
      githubPersonalAccessToken: process.env.GITHUB_TOKEN,
    },
    // excludedActions: ["smithery_ai_github_get_issue"],
    includedActions: [
      "smithery_ai_github_create_or_update_file",
      "smithery_ai_github_create_repository",
    ],
  });

  console.log("\n🤖 Ready! Type your message (or 'exit' to quit)\n");

  const agent = createAgent({
    instructions: `You are a GitHub assistant that can help with repository management.
    Use the available GitHub actions to help users with their requests.`,
    actions: [...mcpActions],
    model: openai("gpt-4o-mini"),
  });

  let messageHistory: any[] = [];

  function getInput() {
    rl.question("> ", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      try {
        const { messages, response } = await agent({
          input,
          messages: messageHistory,
        });

        // Update message history
        messageHistory = messages;

        // Show any tool calls

        console.log(`Assistant: ${response}\n`);
      } catch (error) {
        console.error("\nError:", error, "\n");
      }
      ``;
      getInput();
    });
  }

  getInput();
}

chat().catch(console.error);

// Handle clean exit
rl.on("close", () => {
  console.log("\nGoodbye!");
  process.exit(0);
});
