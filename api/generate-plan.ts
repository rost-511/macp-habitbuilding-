/// <reference types="node" />

import { verifyToken } from "@clerk/backend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Upper bound on accepted prompt size (characters). The app's own prompts are
// only a few KB; this purely blocks abusive oversized payloads.
const MAX_PROMPT_LENGTH = 16000;

const OPENAI_MODEL = "gpt-4.1-mini";

// Only these AI call types are recognized; anything else is normalized below.
const ALLOWED_EVENT_TYPES = ["plan_generation", "weekly_review"] as const;
type EventType = (typeof ALLOWED_EVENT_TYPES)[number];

// Temporary per-user daily cap until full entitlements land (UTC day window).
function dailyLimit(): number {
  const parsed = Number.parseInt(process.env.AI_DAILY_LIMIT ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

// Start of the current UTC day and the next UTC midnight (quota reset point).
function utcDayWindow(): { startOfDay: string; resetsAt: string } {
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const start = new Date(`${dayKey}T00:00:00.000Z`);
  const reset = new Date(start);
  reset.setUTCDate(reset.getUTCDate() + 1);
  return { startOfDay: start.toISOString(), resetsAt: reset.toISOString() };
}

// Service-role client for usage logging + quota counts. It bypasses RLS, so it
// is created only on the server and its key is never sent to the browser.
// Returns null when env is unconfigured so logging/quota degrade gracefully.
function getServiceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(
      "generate-plan: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; skipping usage logging + quota"
    );
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Best-effort usage logging. A logging failure must never break generation.
// Stores only metadata — never the prompt body or the generated AI text.
async function logUsage(
  supabase: SupabaseClient | null,
  row: {
    clerk_user_id: string;
    event_type: EventType;
    status: "success" | "error" | "blocked_quota";
    model?: string | null;
    prompt_chars?: number | null;
    input_tokens?: number | null;
    output_tokens?: number | null;
    total_tokens?: number | null;
    request_id?: string | null;
    error_code?: string | null;
  }
) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("ai_usage_events").insert(row);
    if (error) {
      console.warn("generate-plan: usage log insert failed:", error.message);
    }
  } catch (e) {
    console.warn(
      "generate-plan: usage log threw:",
      e instanceof Error ? e.message : String(e)
    );
  }
}

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

  let clerkUserId = "";
  try {
    const claims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    clerkUserId = typeof claims?.sub === "string" ? claims.sub : "";
  } catch (authError) {
    console.error(
      "generate-plan: token verification failed:",
      authError instanceof Error ? authError.message : String(authError)
    );
    return res.status(401).json({ error: "Unauthorized" });
  }

  // A verified token without a subject cannot be attributed to a user.
  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = getServiceClient();
  let eventType: EventType = "plan_generation";

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const prompt = body.prompt;

    // Normalize the caller-supplied event type; default invalid/missing values.
    if (ALLOWED_EVENT_TYPES.includes(body.event_type)) {
      eventType = body.event_type;
    }

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

    // --- Temporary daily cap: count only this user's successful calls today,
    // enforced before any OpenAI spend. Counting issues fail open. ---
    if (supabase) {
      const limit = dailyLimit();
      const { startOfDay, resetsAt } = utcDayWindow();
      try {
        const { count, error: countError } = await supabase
          .from("ai_usage_events")
          .select("id", { count: "exact", head: true })
          .eq("clerk_user_id", clerkUserId)
          .eq("status", "success")
          .gte("created_at", startOfDay);

        if (countError) {
          console.warn(
            "generate-plan: quota count failed, allowing request:",
            countError.message
          );
        } else if ((count ?? 0) >= limit) {
          await logUsage(supabase, {
            clerk_user_id: clerkUserId,
            event_type: eventType,
            status: "blocked_quota",
          });
          return res.status(429).json({
            error: `You've reached today's limit of ${limit} AI generations. Please try again tomorrow.`,
            code: "quota_exceeded",
            limit,
            used: count ?? 0,
            resetsAt,
          });
        }
      } catch (quotaError) {
        console.warn(
          "generate-plan: quota check threw, allowing request:",
          quotaError instanceof Error ? quotaError.message : String(quotaError)
        );
      }
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
        model: OPENAI_MODEL,
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
      await logUsage(supabase, {
        clerk_user_id: clerkUserId,
        event_type: eventType,
        status: "error",
        model: OPENAI_MODEL,
        prompt_chars: prompt.length,
        error_code: `openai_${openaiResponse.status}`,
      });
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
      await logUsage(supabase, {
        clerk_user_id: clerkUserId,
        event_type: eventType,
        status: "error",
        model: OPENAI_MODEL,
        prompt_chars: prompt.length,
        error_code: "empty_response",
      });
      return res.status(502).json({
        error: "Plan generation failed",
      });
    }

    // Token counts come from the OpenAI Responses API usage block when present.
    const usage = (data && typeof data.usage === "object" && data.usage) || {};
    await logUsage(supabase, {
      clerk_user_id: clerkUserId,
      event_type: eventType,
      status: "success",
      model: OPENAI_MODEL,
      prompt_chars: prompt.length,
      input_tokens: usage.input_tokens ?? usage.prompt_tokens ?? null,
      output_tokens: usage.output_tokens ?? usage.completion_tokens ?? null,
      total_tokens: usage.total_tokens ?? null,
      request_id: typeof data.id === "string" ? data.id : null,
    });

    return res.status(200).json({
      text,
    });
  } catch (error) {
    // Log the real error server-side; return a generic message to the browser.
    console.error(
      "generate-plan: server error:",
      error instanceof Error ? error.stack || error.message : String(error)
    );
    await logUsage(supabase, {
      clerk_user_id: clerkUserId,
      event_type: eventType,
      status: "error",
      error_code: "server_error",
    });
    return res.status(500).json({
      error: "Server error",
    });
  }
}
