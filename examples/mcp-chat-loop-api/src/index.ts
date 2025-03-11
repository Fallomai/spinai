import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { createAgent, createActionsFromMcpConfig } from "spinai";
import { openai } from "@ai-sdk/openai";
import mcpConfig from "../mcp-config";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize agent
let agent: any = null;

async function initializeAgent() {
  if (agent) return agent;

  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  const mcpActions = await createActionsFromMcpConfig({
    config: mcpConfig,
    envMapping: {
      githubPersonalAccessToken: process.env.GITHUB_TOKEN,
    },
  });

  agent = createAgent({
    instructions: `You are a GitHub assistant that can help with repository management.
    Use the available GitHub actions to help users with their requests.`,
    actions: [...mcpActions],
    model: openai("gpt-4o-mini"),
  });

  return agent;
}

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const chatAgent = await initializeAgent();
    const { messages, response } = await chatAgent({
      input: message,
      messages: history,
    });

    // Get tool calls from messages
    const toolCalls = messages
      .filter((m: { role: string }) => m.role === "tool")
      .map((m: { content: Array<{ toolName: string }> }) => ({
        toolName: m.content[0].toolName,
      }));

    res.json({
      response,
      toolCalls,
      messages,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
