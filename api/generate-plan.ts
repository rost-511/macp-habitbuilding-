export default async function handler(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  
    try {
      const body = await request.json();
      const prompt = body?.prompt;
  
      if (!prompt || typeof prompt !== "string") {
        return Response.json(
          { error: "Missing prompt" },
          { status: 400 }
        );
      }
  
      if (!process.env.OPENAI_API_KEY) {
        return Response.json(
          { error: "Missing OPENAI_API_KEY on server" },
          { status: 500 }
        );
      }
  
      const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt,
          temperature: 0.7,
        }),
      });
  
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
  
        return Response.json(
          {
            error: "OpenAI request failed",
            details: errorText,
          },
          { status: openaiResponse.status }
        );
      }
  
      const data = await openaiResponse.json();
  
      const text =
        data.output_text ||
        data.output?.[0]?.content?.[0]?.text ||
        "";
  
      return Response.json({ text });
    } catch (error) {
      return Response.json(
        {
          error: "Server error",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }