#!/usr/bin/env node
import { Command } from "commander";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import * as path from "path";
import chalk from "chalk";

// Remove punycode deprecation warning
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (
    warning.name === "DeprecationWarning" &&
    warning.message.includes("punycode")
  ) {
    return;
  }
  console.warn(warning);
});

const program = new Command();

program
  .name("spinai-mcp")
  .version("1.0.0")
  .description("MCP package manager for SpinAI");

// Define providers with their command structures
interface Provider {
  getCommand: () => string;
  getArgs: (pkg: string) => string[];
}

const providers: Record<string, Provider> = {
  smithery: {
    getCommand: () => "npx",
    getArgs: (pkg: string) => ["-y", "@smithery/cli@latest", "run", pkg],
  },
  // Add other providers as needed
};

program
  .command("install")
  .description("Install one or more MCP packages")
  .argument(
    "<packages...>",
    "MCP packages to install (e.g., @smithery-ai/github)"
  )
  .option(
    "--provider <provider>",
    "Provider to use (e.g., smithery)",
    "smithery"
  )
  .option("--config <json>", "JSON string with environment variables")
  .action(async (packages: string[], options) => {
    console.log(chalk.bold("\n🤖 Installing MCP packages...\n"));

    try {
      // Validate provider
      const provider = options.provider;
      if (!providers[provider]) {
        console.error(chalk.red(`\n✖ Unknown provider: ${provider}`));
        console.log(
          chalk.yellow(
            `Available providers: ${Object.keys(providers).join(", ")}`
          )
        );
        process.exit(1);
      }

      // Parse config if provided
      let envMapping = {};
      if (options.config) {
        try {
          envMapping = JSON.parse(options.config);
          console.log(
            chalk.yellow(`📝 Using provided configuration: ${options.config}`)
          );
        } catch (error) {
          console.error(chalk.red("❌ Invalid JSON configuration"));
          process.exit(1);
        }
      }

      // Create or update mcp-config.ts
      const mcpConfigPath = path.join(process.cwd(), "mcp-config.ts");
      let configContent = "";

      if (existsSync(mcpConfigPath)) {
        console.log(
          chalk.yellow("\n📝 Updating existing MCP configuration...")
        );
      } else {
        console.log(chalk.yellow("\n📝 Creating new MCP configuration..."));
        configContent = `// SpinAI MCP Configuration
export default {
`;
      }

      // Add new package configurations
      for (const pkg of packages) {
        const pkgId = pkg.replace("@", "").replace("/", "_").replace("-", "_");
        const providerObj = providers[provider];

        // Create the config object for this package
        interface ConfigObject {
          command: string;
          args: string[];
          envMapping?: Record<string, string>;
        }

        const configObj: ConfigObject = {
          command: providerObj.getCommand(),
          args: providerObj.getArgs(pkg),
        };

        // Add envMapping if provided
        if (Object.keys(envMapping).length > 0) {
          configObj.envMapping = envMapping as Record<string, string>;
        }

        // Convert config object to string (pretty-printed)
        const configString = JSON.stringify(configObj, null, 2)
          .replace(/"([^"]+)":/g, "$1:") // Remove quotes from property names
          .replace(/"/g, "'") // Replace double quotes with single quotes
          .replace(/\n/g, "\n  "); // Add indentation for each line

        // Format the new config entry
        const newConfig = `  ${pkgId}: ${configString},\n`;

        if (existsSync(mcpConfigPath)) {
          // Read existing config and append new package if not present
          const existingConfig = await fs.readFile(mcpConfigPath, "utf8");
          if (!existingConfig.includes(pkgId)) {
            const insertPoint = existingConfig.lastIndexOf("}");
            configContent =
              existingConfig.slice(0, insertPoint) +
              newConfig +
              existingConfig.slice(insertPoint);
            await fs.writeFile(mcpConfigPath, configContent);
          } else {
            // Update existing package config if it exists
            const packageRegex = new RegExp(`(\\s+${pkgId}:)[^}]*(},?)`, "s");
            const updatedConfig = existingConfig.replace(
              packageRegex,
              `$1 ${configString}$2`
            );
            await fs.writeFile(mcpConfigPath, updatedConfig);
          }
        } else {
          // Add to new config
          configContent += newConfig;
        }
      }

      // Close the config object if it's a new file
      if (!existsSync(mcpConfigPath)) {
        configContent += "};\n";
        await fs.writeFile(mcpConfigPath, configContent);
      }

      console.log(chalk.green("\n✨ MCP packages configured successfully!\n"));

      // Show next steps
      console.log(chalk.bold("Next steps:"));

      // Add warning about keeping tokens out of mcp-config.ts
      if (options.config) {
        console.log(chalk.red.bold("\n⚠️  SECURITY WARNING ⚠️"));
        console.log(
          chalk.red("We've added your tokens directly to mcp-config.ts")
        );
        console.log(
          chalk.red(
            "It's recommended to move sensitive tokens to a .env file instead."
          )
        );
        console.log(
          chalk.red(
            "This prevents accidental exposure if you commit your config to version control."
          )
        );
        console.log(
          chalk.red(
            "\nSee: https://docs.spinai.dev/mcp/overview for secure configuration\n"
          )
        );
      }

      console.log(chalk.cyan("To use your MCP:"));
      console.log(
        chalk.cyan(
          '   import mcpConfig from "./mcp-config.ts";\n   const actions = await createActionsFromMcpConfig({ config: mcpConfig });\n'
        )
      );

      console.log(
        chalk.cyan("3. Learn more at: https://docs.spinai.dev/mcp/overview")
      );

      console.log(chalk.bold("Configured MCPs:"));
      for (const pkg of packages) {
        console.log(chalk.cyan(`  • ${pkg}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red("\n✖ Failed to configure MCP packages:"), error);
      process.exit(1);
    }
  });

program.parse();
