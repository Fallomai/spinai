import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAgent, createActionsFromMcpConfig } from "spinai";
import { openai } from "@ai-sdk/openai";
import * as dotenv from "dotenv";
// @ts-ignore
import mcpConfig from "../mcp-config.js";

dotenv.config();

const app = new Hono();

// Enable CORS
app.use("/*", cors());

// Initialize agent (reuse across requests)
let agentPromise = initializeAgent();

async function initializeAgent() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  console.log("Setting up MCP actions...");
  const mcpActions = await createActionsFromMcpConfig(mcpConfig);

  return createAgent({
    instructions: `You are a GitHub assistant that can help with repository management.
    Use the available GitHub actions to help users with their requests.`,
    actions: [...mcpActions],
    model: openai("gpt-4o-mini"),
  });
}

// Chat endpoint
app.post("/api/chat", async (c) => {
  try {
    const { messages } = await c.req.json();

    // Get the last message (current user input)
    const lastMessage = messages[messages.length - 1];

    // Convert previous messages to the format expected by the agent
    const convertedMessages = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));

    const agent = await agentPromise;
    const { messages: agentMessages, response } = await agent({
      input:
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content),
      messages: convertedMessages,
    });

    // Extract tool calls for display
    const toolCalls = agentMessages
      .filter((m) => m.role === "tool")
      .map((call) => {
        if (Array.isArray(call.content) && call.content[0]?.toolName) {
          return call.content[0].toolName;
        }
        return null;
      })
      .filter(Boolean);

    return c.json({
      response,
      toolCalls,
      messages: agentMessages,
    });
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: "Failed to process request" }, 500);
  }
});

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Start the server
const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
