import { createAction, SpinAiContext } from "spinai";
import { gmailClient } from "../lib/gmailClient";
import { MoveEmailParameters } from "../types/actions";

export const moveEmail = createAction({
  id: "moveEmail",
  description:
    "Moves an email to a specific folder (e.g., SPAM), uppercasing the folder name.",
  parameters: {
    type: "object",
    properties: {
      messageId: {
        type: "string",
        description: "The messageId (email message) ID to move.",
      },
      folder: {
        type: "string",
        description: "The folder to move the email to.",
      },
    },
    required: ["messageId", "folder"],
  },
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>,
  ): Promise<SpinAiContext> {
    await gmailClient.moveEmail(<MoveEmailParameters>{
      messageId: parameters?.messageId,
      folder: parameters?.folder,
    });
    return context;
  },
});
