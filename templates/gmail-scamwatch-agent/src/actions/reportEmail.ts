import { createAction, SpinAiContext } from "spinai";
import { gmailClient } from "../lib/gmailClient";
import { ReportPhishingParameters } from "../types/actions";

export const reportEmail = createAction({
  id: "reportEmail",
  description: "Reports an email as phishing to Google.",
  parameters: {
    type: "object",
    properties: {
      messageId: { type: "string", description: "The messageId ID to report." },
    },
    required: ["messageId"],
  },
  async run(
    context: SpinAiContext,
    parameters?: Record<string, unknown>,
  ): Promise<SpinAiContext> {
    await gmailClient.reportPhishing(<ReportPhishingParameters>{
      messageId: parameters?.messageId,
    });
    return context;
  },
});
