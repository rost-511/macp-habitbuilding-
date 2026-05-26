/// <reference types="node" />

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Missing prompt",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY on server",
      });
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

      return res.status(openaiResponse.status).json({
        error: "OpenAI request failed",
        details: errorText,
      });
    }

    const data = await openaiResponse.json();

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";

    if (!text) {
      return res.status(500).json({
        error: "No text returned from OpenAI",
        details: data,
      });
    }

    return res.status(200).json({
      text,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}