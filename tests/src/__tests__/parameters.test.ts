import { createAgent } from "spinai";
import { parameterSum } from "../actions/calculator/parameterSum";
import { minus } from "../actions/calculator/minus";
import { describe, test, expect, jest } from "@jest/globals";
import { testLLM } from "../llms";

interface ExecutedAction {
  id: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status: "success" | "error";
  errorMessage?: string;
}

// Disable timeouts for all tests in this file since we're making LLM API calls
jest.setTimeout(300000);

describe("Parameter handling in agents", () => {
  const parameterAgent = createAgent<number>({
    instructions: `You are a calculator agent that helps users perform mathematical calculations.`,
    actions: [parameterSum, minus],
    llm: testLLM,
    debug: "verbose",
  });

  test.concurrent("should handle the number 10 rule correctly", async () => {
    // Test when 10 is the first number
    const { state: state1 } = await parameterAgent({
      input: "What is 10 plus 15?",
      state: {},
    });

    const { executedActions: actions1 } = state1 as {
      executedActions: ExecutedAction[];
    };

    expect(actions1[0]).toMatchObject({
      id: "parameterSum",
      parameters: {
        a: 15, // Larger number should be a
        b: 10, // 10 must be b
        condiment: "mustard", // First sum gets mustard
      },
      status: "success",
    });

    // Test when 10 is the second number
    const { state: state2 } = await parameterAgent({
      input: "What is 3 plus 10?",
      state: {},
    });

    const { executedActions: actions2 } = state2 as {
      executedActions: ExecutedAction[];
    };

    expect(actions2[0]).toMatchObject({
      id: "parameterSum",
      parameters: {
        a: 3,
        b: 10, // 10 must be b
        condiment: "mustard",
      },
      status: "success",
    });
  });

  test.concurrent(
    "should put larger number in parameter a when neither is 10",
    async () => {
      const { state } = await parameterAgent({
        input: "What is 3 plus 7?",
        state: {},
      });

      const { executedActions } = state as {
        executedActions: ExecutedAction[];
      };

      expect(executedActions[0]).toMatchObject({
        id: "parameterSum",
        parameters: {
          a: 7, // Larger number should be a
          b: 3, // Smaller number should be b
          condiment: "mustard",
        },
        status: "success",
      });
    }
  );

  test.concurrent(
    "should handle condiment parameter correctly in sequence",
    async () => {
      const { state } = await parameterAgent({
        input: "What is 5 plus 3 plus 2?",
        state: {},
      });

      const { executedActions } = state as {
        executedActions: ExecutedAction[];
      };

      // First sum should use mustard
      expect(executedActions[0]).toMatchObject({
        id: "parameterSum",
        parameters: {
          a: 5,
          b: 3,
          condiment: "mustard",
        },
        status: "success",
      });

      // Second sum should use ketchup
      expect(executedActions[1]).toMatchObject({
        id: "parameterSum",
        parameters: {
          a: 8,
          b: 2,
          condiment: "ketchup",
        },
        status: "success",
      });
    }
  );

  test.concurrent("should handle complex sequence with all rules", async () => {
    const { state } = await parameterAgent({
      input: "What is 7 plus 10 plus 15 plus 3?",
      state: {},
    });

    const { executedActions } = state as {
      executedActions: ExecutedAction[];
    };

    // First sum: 7 + 10
    expect(executedActions[0]).toMatchObject({
      id: "parameterSum",
      parameters: {
        a: 7,
        b: 10, // 10 must be b
        condiment: "mustard",
      },
      status: "success",
    });

    // Second sum: 17 + 15
    expect(executedActions[1]).toMatchObject({
      id: "parameterSum",
      parameters: {
        a: 17, // Larger number
        b: 15, // Smaller number
        condiment: "ketchup",
      },
      status: "success",
    });

    // Third sum: 32 + 3
    expect(executedActions[2]).toMatchObject({
      id: "parameterSum",
      parameters: {
        a: 32, // Larger number
        b: 3, // Smaller number
        condiment: "ketchup",
      },
      status: "success",
    });
  });
});
