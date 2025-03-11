"use client";

import { useState } from "react";

interface Message {
  role: string;
  content: string;
  toolCalls?: { toolName: string }[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      // Add the assistant's response to messages
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          toolCalls: data.toolCalls,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="py-8">
          <h1 className="text-2xl font-bold text-center">GitHub Assistant</h1>
        </div>

        <div className="border-t border-gray-200 mb-24">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`py-8 -mx-4 px-4 ${
                message.role === "user" ? "bg-white" : "bg-gray-50"
              }`}
            >
              <div className="max-w-3xl mx-auto flex gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    message.role === "user" ? "bg-blue-500" : "bg-black"
                  }`}
                >
                  {message.role === "user" ? "U" : "A"}
                </div>
                <div className="flex-1 space-y-4">
                  <p className="prose">{message.content}</p>
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 font-medium">
                        Actions:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {message.toolCalls.map((call, i) => (
                          <li key={i} className="text-sm text-gray-600">
                            {call.toolName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              Start a conversation by typing a message below.
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex gap-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
