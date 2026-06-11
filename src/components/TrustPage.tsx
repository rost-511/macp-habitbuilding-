import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   TRUST PAGES (Project 14C)
   Public Privacy / Terms / Support / AI Disclaimer pages. Each owns its own
   header + footer and renders inside the app's `.page` scroll container (same
   model as PublicLanding — no router). Warm-black MACP styling, tp-* namespace;
   own .tp-wordmark for the mark. MVP trust content — honest and concise.
───────────────────────────────────────────────────────────────────────────── */

export type TrustPageKey = "privacy" | "terms" | "support" | "ai-disclaimer";

const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const ShieldInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v5c0 4.4-3 7.4-7 8.5C8 16.4 5 13.4 5 9V6z" /><line x1="12" y1="10" x2="12" y2="14" /><line x1="12" y1="7.5" x2="12" y2="7.6" />
  </svg>
);

// The advice boundary — stated verbatim wherever it matters.
const ADVICE_NOTE = (
  <>
    <strong>MACP provides AI-generated habit and productivity guidance only.</strong> It is
    not medical, legal, financial, mental-health, or other professional advice. For decisions
    that matter, use your own judgment and consult a qualified professional.
  </>
);

const SUPPORT_EMAIL = "support@usemacp.com";

type Section = { h: string; body: React.ReactNode };
type PageData = {
  eyebrow: string;
  title: string;
  updated?: string;
  intro: string;
  note?: React.ReactNode;
  sections: Section[];
};

const UPDATED = "Last updated June 2026";

const PAGES: Record<TrustPageKey, PageData> = {
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    updated: UPDATED,
    intro:
      "MACP is a habit-building tool. We keep data collection lean — only what's needed to build your plan, track your progress, and run the service.",
    sections: [
      {
        h: "What we collect",
        body: (
          <ul>
            <li>Account details from our sign-in provider (Clerk) — typically your email address.</li>
            <li>Your onboarding answers (goals, schedule, and preferences).</li>
            <li>Your plans, daily progress, weekly reviews, and settings.</li>
          </ul>
        ),
      },
      {
        h: "How we use it",
        body: (
          <p>
            We use your information to generate and adapt your habit plans, show your progress and
            streaks, and operate and improve the service. We don't sell your personal data.
          </p>
        ),
      },
      {
        h: "AI processing",
        body: (
          <p>
            To create plans and reviews, the answers you provide are sent to our AI provider for
            processing. Please don't enter sensitive personal information (such as health, financial,
            or identity details) into your plan inputs.
          </p>
        ),
      },
      {
        h: "Storage & security",
        body: (
          <p>
            Your data is stored with reputable infrastructure providers and scoped to your account, so
            only you can access your own records. No method of storage is ever perfectly secure, but we
            use industry-standard safeguards.
          </p>
        ),
      },
      {
        h: "Your control",
        body: (
          <p>
            You can reset and erase your in-app data at any time from Settings → “Start Over.” That
            removes your MACP plans and progress; your sign-in account is managed separately by Clerk.
          </p>
        ),
      },
      {
        h: "Contact",
        body: (
          <p>
            Questions about privacy? Reach us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{" "}
            <span className="tp-placeholder">(placeholder)</span>.
          </p>
        ),
      },
    ],
  },

  terms: {
    eyebrow: "Legal",
    title: "Terms of Service",
    updated: UPDATED,
    intro:
      "Plain-language terms for using MACP. By creating an account or using the app, you agree to the points below.",
    note: ADVICE_NOTE,
    sections: [
      {
        h: "What MACP is",
        body: (
          <p>
            MACP is an AI-powered habit and productivity tool. It turns your goals into a daily system
            and helps you stay consistent. It is a self-improvement aid, not a substitute for
            professional advice.
          </p>
        ),
      },
      {
        h: "Your responsibilities",
        body: (
          <ul>
            <li>Provide accurate information so your plan is useful.</li>
            <li>Use MACP lawfully and for your own personal habit-building.</li>
            <li>You're responsible for the actions and decisions you take based on your plan.</li>
          </ul>
        ),
      },
      {
        h: "AI-generated content",
        body: (
          <p>
            Plans, reviews, and suggestions are generated by AI and may be incomplete or inaccurate.
            Treat them as a starting point and apply your own judgment.
          </p>
        ),
      },
      {
        h: "Accounts",
        body: (
          <p>
            Sign-in is handled by our authentication provider. Keep your credentials secure — you're
            responsible for activity under your account.
          </p>
        ),
      },
      {
        h: "Service availability",
        body: (
          <p>
            MACP is provided “as is,” without warranties, and is actively evolving. Features may change
            or be unavailable from time to time.
          </p>
        ),
      },
      {
        h: "Limitation of liability",
        body: (
          <p>
            To the extent permitted by law, MACP and its makers aren't liable for losses resulting from
            your use of the app or reliance on AI-generated content.
          </p>
        ),
      },
      {
        h: "Changes & contact",
        body: (
          <p>
            We may update these terms as the product grows. Questions? Email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{" "}
            <span className="tp-placeholder">(placeholder)</span>.
          </p>
        ),
      },
    ],
  },

  support: {
    eyebrow: "Help",
    title: "Support",
    intro:
      "Need a hand? MACP is an early-stage product and we read every message. Here's how to get help and what to expect.",
    sections: [
      {
        h: "Contact us",
        body: (
          <p>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{" "}
            <span className="tp-placeholder">(placeholder address)</span> with your question. A short
            description of what you were doing helps us help you faster.
          </p>
        ),
      },
      {
        h: "Common topics",
        body: (
          <ul>
            <li><strong>Getting started:</strong> finish the short assessment to generate your first plan.</li>
            <li><strong>Resetting your plan:</strong> use Settings → “Start Over” to begin fresh.</li>
            <li><strong>Account & sign-in:</strong> managed through our secure auth provider.</li>
          </ul>
        ),
      },
      {
        h: "Response times",
        body: (
          <p>
            We're a small team and reply on a best-effort basis. There's no guaranteed response window
            yet, but we aim to get back to you quickly.
          </p>
        ),
      },
      {
        h: "Feedback",
        body: (
          <p>
            Ideas and bug reports are genuinely welcome — they shape what we build next. Send them to the
            same address above.
          </p>
        ),
      },
    ],
  },

  "ai-disclaimer": {
    eyebrow: "Important",
    title: "AI Disclaimer",
    intro:
      "MACP uses AI to help you build habits. Here's an honest picture of what that does — and doesn't — mean.",
    note: ADVICE_NOTE,
    sections: [
      {
        h: "What MACP's AI does",
        body: (
          <p>
            MACP uses AI to generate personalized habit plans, daily priorities, and weekly reviews from
            the information you provide. It's designed to give you structure and momentum.
          </p>
        ),
      },
      {
        h: "Not professional advice",
        body: (
          <p>
            MACP's guidance is for general habit-building and productivity only. It is not a substitute
            for medical, mental-health, legal, financial, or other professional advice, diagnosis, or
            treatment.
          </p>
        ),
      },
      {
        h: "AI can be wrong",
        body: (
          <p>
            AI-generated suggestions can be inaccurate, incomplete, or not right for your situation.
            Always apply your own judgment, and verify anything important before acting on it.
          </p>
        ),
      },
      {
        h: "Not a crisis service",
        body: (
          <p>
            MACP can't help in an emergency. If you're in crisis or may be a danger to yourself or
            others, contact your local emergency services or a qualified professional right away.
          </p>
        ),
      },
      {
        h: "You're in control",
        body: (
          <p>
            You decide what to act on. MACP is a tool to support your decisions, not to make them for
            you.
          </p>
        ),
      },
    ],
  },
};

const FOOTER_LINKS: { key: TrustPageKey; label: string }[] = [
  { key: "privacy", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "support", label: "Support" },
  { key: "ai-disclaimer", label: "AI Disclaimer" },
];

export default function TrustPage({
  page,
  onHome,
  onTrust = () => {},
}: {
  page: TrustPageKey;
  onHome: () => void;
  onTrust?: (page: TrustPageKey) => void;
}) {
  const data = PAGES[page];
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Each page should open at the top (the `.page` element is the scroll container).
  useEffect(() => {
    const pageEl = rootRef.current?.closest(".page") as HTMLElement | null;
    pageEl?.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="tp-root" ref={rootRef}>
      <header className="tp-header">
        <div className="tp-wrap tp-header-inner">
          <button className="tp-wordmark" onClick={onHome} aria-label="MACP system — back to home">
            <span className="mk" style={{ fontSize: "22px" }}>MACP</span>
            <span className="sy" style={{ fontSize: "9px" }}>system</span>
          </button>
          <button className="tp-back" onClick={onHome}>
            <ArrowLeft />Back to home
          </button>
        </div>
      </header>

      <main className="tp-wrap tp-main">
        <div className="tp-hero">
          <div className="tp-eyebrow">{data.eyebrow}</div>
          <h1 className="tp-title">{data.title}</h1>
          {data.updated && <div className="tp-updated">{data.updated}</div>}
          <p className="tp-intro">{data.intro}</p>
        </div>

        {data.note && (
          <div className="tp-note" role="note">
            <ShieldInfo />
            <p>{data.note}</p>
          </div>
        )}

        <div className="tp-sections">
          {data.sections.map((s) => (
            <section className="tp-section" key={s.h}>
              <h2 className="tp-h2">{s.h}</h2>
              <div className="tp-body">{s.body}</div>
            </section>
          ))}
        </div>

        <footer className="tp-foot">
          <div className="tp-foot-links">
            {FOOTER_LINKS.map((l) => (
              <a
                key={l.key}
                className={l.key === page ? "on" : ""}
                onClick={() => (l.key === page ? undefined : onTrust(l.key))}
              >
                {l.label}
              </a>
            ))}
          </div>
          <button className="tp-foot-home" onClick={onHome}>← Back to home</button>
        </footer>
      </main>
    </div>
  );
}
