/// <reference types="node" />

import { verifyToken } from "@clerk/backend";

// Upper bound on accepted prompt size (characters). The app's own prompts are
// only a few KB; this purely blocks abusive oversized payloads.
const MAX_PROMPT_LENGTH = 16000;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  // --- Require an authenticated Clerk user (protects OpenAI spend) ---
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("generate-plan: missing CLERK_SECRET_KEY on server");
    return res.status(500).json({ error: "Server auth not configured" });
  }

  const authHeader =
    (typeof req.headers?.authorization === "string" && req.headers.authorization) ||
    (typeof req.headers?.Authorization === "string" && req.headers.Authorization) ||
    "";

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (authError) {
    console.error(
      "generate-plan: token verification failed:",
      authError instanceof Error ? authError.message : String(authError)
    );
    return res.status(401).json({ error: "Unauthorized" });
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

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: "Prompt too large",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("generate-plan: missing OPENAI_API_KEY on server");
      return res.status(500).json({
        error: "Server not configured",
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
      // Log full upstream detail server-side; never leak it to the client.
      console.error(
        "generate-plan: OpenAI request failed:",
        openaiResponse.status,
        errorText
      );
      return res.status(502).json({
        error: "Plan generation failed",
      });
    }

    const data = await openaiResponse.json();

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";

    if (!text) {
      console.error(
        "generate-plan: no text returned from OpenAI:",
        JSON.stringify(data).slice(0, 1000)
      );
      return res.status(502).json({
        error: "Plan generation failed",
      });
    }

    return res.status(200).json({
      text,
    });
  } catch (error) {
    // Log the real error server-side; return a generic message to the browser.
    console.error(
      "generate-plan: server error:",
      error instanceof Error ? error.stack || error.message : String(error)
    );
    return res.status(500).json({
      error: "Server error",
    });
  }
}
