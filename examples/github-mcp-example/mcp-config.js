export default {
  smithery_ai_github: {
    command: "npx",
    args: ["-y", "@smithery/cli@latest", "run", "@smithery-ai/github"],
    envMapping: {
      GITHUB_TOKEN: "githubPersonalAccessToken",
    },
  },
};
