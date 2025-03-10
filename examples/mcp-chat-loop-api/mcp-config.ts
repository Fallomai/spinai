interface McpConfig {
  [key: string]: {
    command: string;
    args: string[];
    env: Record<string, string>;
    envMapping: Record<string, string>;
  };
}

const config: McpConfig = {
  smithery_ai_github: {
    command: "npx",
    args: ["-y", "@smithery/cli@latest", "run", "@smithery-ai/github"],
    env: {},
    envMapping: {
      githubPersonalAccessToken: "GITHUB_TOKEN",
    },
  },
};

export default config;
