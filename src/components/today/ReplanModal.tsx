import { useEffect, useRef, useState } from "react";
import type { HabitRow } from "./todayLogic";

export interface ReplanChange {
  type: "add" | "update" | "remove";
  id?: string;
  habit?: any;
  reason?: string;
}

interface QuotaInfo {
  limit: number;
  used: number;
  resetsAt: string;
}

interface Props {
  habits: HabitRow[];
  buildPrompt: () => Promise<string>;
  streamClaude: (
    prompt: string,
    eventType: string,
    getToken: unknown,
    onChunk: (t: string) => void,
    onDone: (t: string) => void,
    onError: (msg: string, quota?: QuotaInfo) => void,
    promptVersion?: string
  ) => void;
  getToken: unknown;
  promptVersion: string;
  onApply: (changes: ReplanChange[]) => Promise<void>;
  onClose: () => void;
}

function parseChanges(raw: string): { summary: string; changes: ReplanChange[] } {
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object found in response");
  const cleaned = stripped.slice(first, last + 1);
  const parsed = JSON.parse(cleaned);
  const changes = Array.isArray(parsed.changes)
    ? parsed.changes.filter((c: any) => ["add", "update", "remove"].includes(c?.type))
    : [];
  return { summary: String(parsed.summary || ""), changes };
}

export function ReplanModal({
  habits,
  buildPrompt,
  streamClaude,
  getToken,
  promptVersion,
  onApply,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<"loading" | "review" | "applying" | "error" | "apply_error">("loading");
  const [summary, setSummary] = useState("");
  const [changes, setChanges] = useState<ReplanChange[]>([]);
  const [accepted, setAccepted] = useState<boolean[]>([]);
  const [err, setErr] = useState("");
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const started = useRef(false);

  const habitName = (id?: string) => habits.find((h) => h.id === id)?.name ?? "(unknown habit)";

  const run = async () => {
    setPhase("loading");
    setErr("");
    setQuota(null);
    try {
      const prompt = await buildPrompt();
      streamClaude(
        prompt,
        "replan",
        getToken,
        () => {},
        (full) => {
          try {
            const { summary: s, changes: c } = parseChanges(full);
            setSummary(s || (c.length === 0 ? "Your current system looks good — no changes proposed." : ""));
            setChanges(c);
            setAccepted(c.map(() => true));
            setPhase("review");
          } catch {
            setErr("The AI returned an unreadable plan. Try again.");
            setPhase("error");
          }
        },
        (msg, q) => {
          setErr(msg);
          setQuota(q ?? null);
          setPhase("error");
        },
        promptVersion
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape key closes the modal (except while applying)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "applying") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const apply = async () => {
    setPhase("applying");
    try {
      await onApply(changes.filter((_, i) => accepted[i]));
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setPhase("apply_error");
    }
  };

  return (
    <div
      className="td-modal-veil"
      onClick={(e) => e.target === e.currentTarget && phase !== "applying" && onClose()}
    >
      <div className="td-modal">
        <h3>✦ Replan proposal</h3>

        {phase === "loading" && (
          <p className="td-replan-summary">
            <span className="td-spinner" />
            Reviewing your schedule, habits, and the last 14 days…
          </p>
        )}

        {phase === "error" && (
          <>
            <p className="td-replan-err">
              {quota
                ? `Daily AI limit reached (${quota.used}/${quota.limit}). Try again after the reset.`
                : err}
            </p>
            <div className="td-modal-actions">
              <button className="td-btn-ghost" onClick={onClose}>
                Close
              </button>
              {!quota && (
                <button className="td-btn" onClick={run}>
                  Retry
                </button>
              )}
            </div>
          </>
        )}

        {phase === "apply_error" && (
          <>
            <p className="td-replan-err">{err}</p>
            <div className="td-modal-actions">
              <button className="td-btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}

        {(phase === "review" || phase === "applying") && (
          <>
            {summary && <p className="td-replan-summary">{summary}</p>}
            {changes.length > 0 && (
              <div className="td-diff">
                {changes.map((c, i) => (
                  <div key={i} className={`td-diff-row ${accepted[i] ? "" : "off"}`}>
                    <button
                      className={`td-check ${accepted[i] ? "on" : ""}`}
                      aria-label={accepted[i] ? "Reject this change" : "Accept this change"}
                      onClick={() => setAccepted((a) => a.map((v, j) => (j === i ? !v : v)))}
                    >
                      ✓
                    </button>
                    <span className={`td-diff-type ${c.type}`}>{c.type.toUpperCase()}</span>
                    <div className="td-diff-body">
                      <div className="td-diff-name">
                        {c.type === "add" ? c.habit?.name : habitName(c.id)}
                        {c.type === "update" && c.habit?.name && c.habit.name !== habitName(c.id)
                          ? ` → ${c.habit.name}`
                          : ""}
                      </div>
                      {c.reason && <div className="td-diff-reason">{c.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="td-modal-actions">
              <button className="td-btn-ghost" onClick={onClose}>
                {changes.length === 0 ? "Close" : "Cancel"}
              </button>
              {changes.length > 0 && (
                <button
                  className="td-btn"
                  disabled={phase === "applying" || accepted.every((a) => !a)}
                  onClick={apply}
                >
                  {phase === "applying" ? "Applying…" : `Apply selected (${accepted.filter(Boolean).length})`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
