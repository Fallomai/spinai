import { LLM } from "../llms/base";
import { Action } from "../types/action";
import { ActionPlannerState } from "../types/planner";
import { log } from "../utils/debugLogger";

export abstract class BasePlanner {
  protected totalCostCents = 0;
  protected instructions: string;

  constructor(
    protected loggingService?: any,
    instructions: string = ""
  ) {
    this.instructions = instructions;
  }

  getTotalCost(): number {
    return this.totalCostCents;
  }

  resetCost(): void {
    this.totalCostCents = 0;
  }

  protected trackCost(costCents: number) {
    this.totalCostCents += costCents;
  }

  protected formatPlannerState(state: ActionPlannerState): string {
    return JSON.stringify(state, null, 2);
  }

  protected formatAvailableActions(actions: Action[]): string {
    return actions
      .map(
        (a) => `
      ${a.id}:
        description: ${a.description}
        dependencies: ${a.dependsOn ? JSON.stringify(a.dependsOn) : "[]"}
    `
      )
      .join("\n");
  }
}
