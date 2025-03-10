export interface McpConfig {
  [key: string]: {
    command: string;
    args: string[];
    /**
     * Environment variable mapping for this MCP.
     * Format: { "MCP_VAR_NAME": "value_or_env_var_name" }
     * If the value is an environment variable name, its value will be used.
     * Otherwise, the literal value will be used.
     */
    envMapping?: Record<string, string | undefined>;
  };
}
