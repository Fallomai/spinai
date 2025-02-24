import { google } from "googleapis";
import dotenv from "dotenv";
import {
  MoveEmailParameters,
  ReportPhishingParameters,
} from "../types/actions";
import { recentEmails } from "../types";

dotenv.config();

const auth = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI,
);
auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth });

export const gmailClient = {
  async getRecentEmails(): Promise<recentEmails[]> {
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    if (!res.data.messages) return [];

    return Promise.all(
      res.data.messages.map(async (msg) => {
        if (!msg.id) return null;

        const email = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        return {
          id: msg.id,
          sender:
            email.data.payload?.headers?.find((h) => h.name === "From")
              ?.value || "",
          headers: email.data.payload?.headers || [],
          body: email.data.snippet || "",
        };
      }),
    ).then((emails) => emails.filter((email) => email !== null) as any);
  },

  async moveEmail({ messageId, folder }: MoveEmailParameters): Promise<void> {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: { addLabelIds: [folder], removeLabelIds: ["INBOX"] },
    });
  },

  async reportPhishing({ messageId }: ReportPhishingParameters): Promise<void> {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: { addLabelIds: ["SPAM"], removeLabelIds: ["INBOX"] },
    });
  },
};
