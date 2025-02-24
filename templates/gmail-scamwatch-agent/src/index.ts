import { createAgent, createGeminiLLM } from "spinai";
import { moveEmail } from "./actions/moveEmail";
import { reportEmail } from "./actions/reportEmail";
import { gmailClient } from "./lib/gmailClient";

const llm = createGeminiLLM({
  apiKey: process.env.GEMINI_API_KEY as string | "",
  model: "gemini-2.0-flash-exp",
});

const scamWatchAgent = createAgent({
  instructions: `
    You are Sparky, a highly advanced scam detection assistant for Gmail. 
    Your job is to analyze emails, detect scams, and take appropriate actions.

    **Rules:**
    1. Analyze email metadata (headers, sender reputation, SPF/DKIM/DMARC status).  
    2. Scan the email body for phishing attempts, social engineering, or fraudulent content.  
    3. If an email is **highly suspicious**, move it to Spam.  
    4. If it is **confirmed phishing**, report it and move it to spam.  
    5. If unsure, do not take any action.
    6. **Do NOT Flag** emails containing **source code, invoices, or internal communications** unless absolutely necessary.  
    7. **Do NOT Flag** emails from **trusted sources**.
    8. **Do NOT Flag** emails related to OAuth, API keys, TOP, or other related, unless you suspect is a phishing attempt.
    9. Get the scam email from "From" Field only.
    10. To improve performance and cost efficiency, give short responses (max 5 words).
   
    Proceed with extreme caution to avoid false positives.
  `,
  actions: [moveEmail, reportEmail],
  llm,
  ...(process.env.NODE_ENV === "development" && {
    debug: "verbose",
  }),
  ...(process.env.SPINAI_API_KEY && {
    apiKey: process.env.SPINAI_API_KEY,
    agentId: "gmail-scamwatch-agent",
  }),
});

async function main() {
  const recentEmails = await gmailClient.getRecentEmails();

  await scamWatchAgent({
    input: `
        {
            "recentEmails": ${JSON.stringify(
              recentEmails.map((email) => ({
                id: email.id,
                sender: email.sender,
                headers: email.headers,
                body: email.body,
              })),
            )}
        }
    `,
    state: {},
  });
}

main().catch(console.error);
