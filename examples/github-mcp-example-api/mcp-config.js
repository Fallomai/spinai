// SpinAI MCP Configuration
export default {
  smithery_ai_github: {
    command: "npx",
    args: ["-y", "@smithery/cli@latest", "run", "@smithery-ai/github"],
    env: {},
    envMapping: {
      GITHUB_TOKEN: "githubPersonalAccessToken",
    },
  },
};
