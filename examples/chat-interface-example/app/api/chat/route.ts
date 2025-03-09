export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  // Forward the request to the local GitHub endpoint
  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  // Get the response data
  const data = await response.json();

  // Create the response in the expected format
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send the frame start
      controller.enqueue(
        encoder.encode(`f:{"messageId":"msg-${Date.now()}"}\n`)
      );

      // Split the response into chunks and send them
      const chunks = data.response.split(" ");
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`0:"${chunk}"\n`));
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          controller.enqueue(encoder.encode(`0:" "\n`));
        }
      }

      // Send the completion events
      controller.enqueue(
        encoder.encode(
          `e:{"finishReason":"stop","usage":{"promptTokens":8,"completionTokens":10},"isContinued":false}\n`
        )
      );
      controller.enqueue(
        encoder.encode(
          `d:{"finishReason":"stop","usage":{"promptTokens":8,"completionTokens":10}}\n`
        )
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
