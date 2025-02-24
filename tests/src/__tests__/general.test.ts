import { createAgent } from "spinai";
import { sum } from "../actions/calculator/sum";
import { minus } from "../actions/calculator/minus";
import { describe, test, expect, jest } from "@jest/globals";
import { testLLM } from "src/llms";

interface ExecutedAction {
  id: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status: "success" | "error";
  errorMessage?: string;
}

// Increase timeout for all tests in this file
jest.setTimeout(30000); // 30 seconds

describe("A basic calculator agent", () => {
  const calculatorAgent = createAgent<number>({
    instructions: `You are a calculator agent that helps users perform mathematical calculations.`,
    actions: [sum, minus],
    llm: testLLM,
    debug: "none", // Disable debug logging for tests
  });

  test.concurrent(
    "should execute correct sequence of actions for compound operations",
    async () => {
      const { state } = await calculatorAgent({
        input: "What is 5 plus 3 minus 1?",
        state: {},
      });

      const { executedActions } = state as {
        executedActions: ExecutedAction[];
      };

      // Verify action sequence
      expect(executedActions).toHaveLength(2);
      expect(executedActions.map((a) => a.id)).toEqual(["sum", "minus"]);

      // Verify all actions succeeded
      expect(executedActions.every((a) => a.status === "success")).toBe(true);

      // Verify first action (sum) parameters and result
      expect(executedActions[0]).toMatchObject({
        id: "sum",
        parameters: { a: 5, b: 3 },
        status: "success",
      });

      // Verify second action (minus) used result from first action
      expect(executedActions[1]).toMatchObject({
        id: "minus",
        parameters: { a: 8, b: 1 }, // Should use result from previous sum
        status: "success",
      });
    }
  );

  test.concurrent(
    "should execute single addition action with correct parameters",
    async () => {
      const { state } = await calculatorAgent({
        input: "What is 10 plus 5?",
        state: {},
      });

      const { executedActions } = state as {
        executedActions: ExecutedAction[];
      };

      // Verify only one action was executed
      expect(executedActions).toHaveLength(1);
      expect(executedActions[0].id).toBe("sum");

      // Verify action succeeded
      expect(executedActions[0].status).toBe("success");

      // Verify parameters and result
      expect(executedActions[0]).toMatchObject({
        parameters: { a: 10, b: 5 },
      });
    }
  );

  test.concurrent(
    "should execute single subtraction action with correct parameters",
    async () => {
      const { state } = await calculatorAgent({
        input: "What is 20 minus 7?",
        state: {},
      });

      const { executedActions } = state as {
        executedActions: ExecutedAction[];
      };

      // Verify only one action was executed
      expect(executedActions).toHaveLength(1);
      expect(executedActions[0].id).toBe("minus");

      // Verify action succeeded
      expect(executedActions[0].status).toBe("success");

      // Verify parameters and result
      expect(executedActions[0]).toMatchObject({
        parameters: { a: 20, b: 7 },
      });
    }
  );

  test.concurrent(
    "should maintain correct execution order with multiple operations",
    async () => {
      const { state } = await calculatorAgent({
        input:
          "What is 10 plus 5 minus 3 plus 2? Do each operation one at a time in order.",
        state: {},
      });

      const { executedActions } = state as {
        executedActions: ExecutedAction[];
      };

      // Verify three actions were executed in correct sequence
      expect(executedActions).toHaveLength(3);
      expect(executedActions.map((a) => a.id)).toEqual(["sum", "minus", "sum"]);

      // Verify all actions succeeded
      expect(executedActions.every((a) => a.status === "success")).toBe(true);

      // Verify each action used the result from previous action
      expect(executedActions[0]).toMatchObject({
        id: "sum",
        parameters: { a: 10, b: 5 },
      });

      expect(executedActions[1]).toMatchObject({
        id: "minus",
        parameters: { a: 15, b: 3 },
      });

      expect(executedActions[2]).toMatchObject({
        id: "sum",
        parameters: { a: 12, b: 2 },
      });
    }
  );
});
