import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { useSupabase } from "../lib/useSupabase";
import { getMyProfile } from "../lib/userData";

/* ─────────────────────────────────────────────────────────────────────────────
   PUBLIC LANDING (Project 14B)
   Presentational marketing page. Owns its own sticky header. The scroll
   container is the app's `.page` element (NOT the window) — every scroll read,
   the reveal IntersectionObserver root, and smooth-scroll target `.page`.
   Styles live in App.tsx's STYLES block under the `.pl-*` namespace.
───────────────────────────────────────────────────────────────────────────── */

// small helper: custom CSS property for staggered reveal delay
const rd = (d: string) => ({ "--d": d } as React.CSSProperties);

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function PublicLanding({
  onStart,
  onDashboard = () => {},
  onAuth,
  onTrust = () => {},
}: {
  onStart: () => void;
  onDashboard?: () => void;
  onAuth: (mode: "sign-in" | "sign-up") => void;
  onTrust?: (page: "privacy" | "terms" | "support" | "ai-disclaimer") => void;
}) {
  const { isSignedIn, userId } = useAuth();
  const supabase = useSupabase();
  const [ctaLoading, setCtaLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // KEEP VERBATIM — routing brain of every primary CTA.
  const handleAssessmentClick = async () => {
    if (!isSignedIn || !userId) {
      onAuth("sign-up"); // signed-out primary CTA → auth (sign-up intent)
      return;
    }
    setCtaLoading(true);
    try {
      const profile = await getMyProfile(supabase, userId);
      if (profile?.onboarding_completed) {
        onDashboard();
        return;
      }
      onStart();
    } catch (error) {
      console.error("Failed to check profile:", error);
      onStart(); // fail open to assessment
    } finally {
      setCtaLoading(false);
    }
  };

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Smooth-scroll the `.page` container (NOT window / scrollIntoView) to a section.
  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const root = rootRef.current;
    if (!root) return;
    const pageEl = document.querySelector(".page") as HTMLElement | null;
    const target = root.querySelector<HTMLElement>(`#${id}`);
    if (!pageEl || !target) return;
    // Clear the sticky header; phones use a taller gap so titles land cleanly
    // (mobile header is shorter but the section title needs breathing room).
    const headerOffset = window.innerWidth <= 600 ? 84 : 70;
    const top =
      target.getBoundingClientRect().top -
      pageEl.getBoundingClientRect().top +
      pageEl.scrollTop -
      headerOffset;
    pageEl.scrollTo({ top: Math.max(0, top), behavior: prefersReduced() ? "auto" : "smooth" });
  };

  const scrollToTop = () => {
    setMenuOpen(false);
    const pageEl = rootRef.current?.closest(".page") as HTMLElement | null;
    pageEl?.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
  };

  // Header scroll state + scroll-reveal + count-up + momentum bars — all on `.page`.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pageEl = document.querySelector(".page") as HTMLElement | null;
const reduce = prefersReduced();

const onScroll = () => {
  const pageTop = pageEl?.scrollTop ?? 0;
  const windowTop = window.scrollY || 0;
  setScrolled(Math.max(pageTop, windowTop) > 12);
};

onScroll();
pageEl?.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("scroll", onScroll, { passive: true });

    const revealables = Array.from(root.querySelectorAll<HTMLElement>(".pl-reveal"));

    // Count a number element from 0 up to its printed value, once.
    const countUp = (el: HTMLElement) => {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      const target = parseFloat((el.textContent || "").replace(/[^\d.]/g, "")) || 0;
      if (reduce || target === 0) return;
      const dur = 900;
      const t0 = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = String(Math.round(ease(p) * target));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = String(target);
      };
      requestAnimationFrame(tick);
    };

    const fire = (el: HTMLElement) => {
      if (el.classList.contains("pl-in")) return;
      el.classList.add("pl-in");
      el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
      if (el.classList.contains("pl-dash-wide-wrap")) {
        const bars = el.querySelector<HTMLElement>(".pl-bars");
        if (bars) {
          bars.querySelectorAll<HTMLElement>("i").forEach((b, i) =>
            b.style.setProperty("--bd", i * 70 + "ms")
          );
          bars.classList.add("pl-in");
        }
      }
    };

    // Reduced motion (or no IO support): render final state immediately.
    if (reduce || !("IntersectionObserver" in window)) {
      revealables.forEach((el) => el.classList.add("pl-in"));
      root.querySelectorAll<HTMLElement>(".pl-bars").forEach((b) => b.classList.add("pl-in"));
      return () => {
  pageEl?.removeEventListener("scroll", onScroll);
  window.removeEventListener("scroll", onScroll);
};
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          fire(entry.target as HTMLElement);
          io.unobserve(entry.target);
        });
      },
      { root: pageEl ?? null, threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => io.observe(el));

    // Above-the-fold must never depend solely on IO (it can be delayed or never
    // fire in non-painting/capture contexts → blank hero). Reveal anything already
    // in view on the first frame + on load, then force-reveal stragglers after ~1.4s.
    const revealInView = () => {
      const vTop = pageEl ? pageEl.getBoundingClientRect().top : 0;
      const vh = pageEl ? pageEl.clientHeight : window.innerHeight;
      revealables.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vTop + vh * 0.92 && r.bottom > vTop) {
          fire(el);
          io.unobserve(el);
        }
      });
    };
    const raf = requestAnimationFrame(revealInView);
    window.addEventListener("load", revealInView);

    return () => {
  pageEl?.removeEventListener("scroll", onScroll);
  window.removeEventListener("scroll", onScroll);
  io.disconnect();
  window.removeEventListener("load", revealInView);
  cancelAnimationFrame(raf);
};
  }, []);

  const Wordmark = ({ mk = "24px", sy = "10px" }: { mk?: string; sy?: string }) => (
    <button className="pl-wordmark" onClick={scrollToTop} aria-label="MACP system — back to top">
      <span className="mk" style={{ fontSize: mk }}>MACP</span>
      <span className="sy" style={{ fontSize: sy }}>system</span>
    </button>
  );

  const PrimaryCTA = ({ className = "" }: { className?: string }) => (
    <button
      className={`pl-btn-amber ${className}`}
      onClick={handleAssessmentClick}
      disabled={ctaLoading}
    >
      {ctaLoading ? (
        <><span className="pl-spin" />Checking…</>
      ) : (
        <>Build your system<ArrowRight /></>
      )}
    </button>
  );

  return (
    <div className="pl-root" ref={rootRef}>
      <span id="top" />

      {/* ============================ HEADER ============================ */}
      <header className={`pl-header ${scrolled ? "scrolled" : ""}`}>
        <div className="pl-wrap pl-nav">
          <Wordmark />
          <nav className="pl-links">
            <a onClick={() => scrollToSection("how")}>How it works</a>
            <a onClick={() => scrollToSection("features")}>Features</a>
            <a onClick={() => scrollToSection("progress")}>Progress</a>
          </nav>
          <div className="pl-actions">
            <SignedOut>
              <button className="pl-signin" onClick={() => onAuth("sign-in")}>Sign in</button>
            </SignedOut>
            <SignedIn>
              {/* .pl-user wrapper lets the landing header hide the avatar on mobile */}
              <span className="pl-user">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{ elements: { userButtonAvatarBox: { width: "30px", height: "30px" } } }}
                />
              </span>
            </SignedIn>
            <PrimaryCTA className="pl-header-cta" />
            <button
              className="pl-menu-toggle"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="pl-mobile-menu">
            <a onClick={() => scrollToSection("how")}>How it works</a>
            <a onClick={() => scrollToSection("features")}>Features</a>
            <a onClick={() => scrollToSection("progress")}>Progress</a>
            <SignedOut>
              <button onClick={() => { setMenuOpen(false); onAuth("sign-in"); }}>Sign in</button>
            </SignedOut>
          </div>
        )}
      </header>

      {/* ============================ HERO ============================ */}
      <section className="pl-hero">
        <div className="pl-wrap pl-hero-grid">
          <div className="pl-hero-copy">
            <div className="pl-eyebrow pl-reveal" style={rd("60ms")}>Modular AI Coaching Platform</div>
            <h1 className="pl-h1 pl-reveal" style={rd("140ms")}>
              Build the system you actually <span className="pl-accent">return to.</span>
            </h1>
            <p className="pl-hero-sub pl-reveal" style={rd("220ms")}>
              MACP turns your goals into a daily operating system — AI-built plans, today's frog,
              progress signals, recovery when life happens, and weekly reviews that adapt the plan.
            </p>
            <div className="pl-cta-row pl-reveal" style={rd("300ms")}>
              <PrimaryCTA />
              <button className="pl-btn-ghost" onClick={() => scrollToSection("how")}>
                See how it works<ChevronDown />
              </button>
            </div>
            <div className="pl-trust pl-reveal" style={rd("380ms")}>
              <div className="pl-trust-item"><span className="pl-trust-dot" /><span className="pl-trust-t">Built around daily execution</span></div>
              <div className="pl-trust-item"><span className="pl-trust-dot" /><span className="pl-trust-t">Adapts when you miss days</span></div>
              <div className="pl-trust-item"><span className="pl-trust-dot" /><span className="pl-trust-t">Made for long-term consistency</span></div>
            </div>
          </div>

          {/* dashboard preview — reuses the auth screen's apv-* classes (preview amber/green) */}
          <div className="pl-dash-float pl-reveal" style={rd("240ms")}>
            <div className="pl-pv">
              <div className="auth-pv" role="img" aria-label="MACP dashboard preview">
                <div className="apv-bar">
                  <div className="apv-logo">MACP<span> system</span></div>
                  <div className="apv-nav">
                    <span className="on">DASHBOARD</span><span>CALENDAR</span><span>WEEKLY REVIEW</span>
                  </div>
                </div>
                <div className="apv-body">
                  <div className="apv-greetrow">
                    <div>
                      <div className="apv-greet">Good afternoon, <em>Jarvis</em></div>
                      <div className="apv-date">MONDAY, JUNE 1, 2026</div>
                    </div>
                    <div className="apv-tier"><span />TIER 1 · FOUNDATION</div>
                  </div>
                  <div className="apv-plan">
                    <div className="apv-plan-top">
                      <div className="apv-kicker">CURRENT PLAN</div>
                      <div className="apv-badge">INITIAL</div>
                    </div>
                    <div className="apv-plan-name">Plan v1</div>
                    <div className="apv-plan-meta">Tier 1 · Foundation · Working professional</div>
                  </div>
                  <div className="apv-stats">
                    <div className="apv-stat">
                      <div className="apv-stat-lbl">Habits Today</div>
                      <div className="apv-stat-val"><span data-count>3</span><small> /5</small></div>
                      <div className="apv-stat-foot g">On track</div>
                    </div>
                    <div className="apv-stat">
                      <div className="apv-stat-lbl">Streak</div>
                      <div className="apv-stat-val"><span data-count>6</span><small> days</small></div>
                      <div className="apv-stat-foot a">Keep going</div>
                    </div>
                    <div className="apv-stat">
                      <div className="apv-stat-lbl">This Week</div>
                      <div className="apv-stat-val"><span data-count>72</span><small> %</small></div>
                      <div className="apv-stat-foot">+12% vs last</div>
                    </div>
                  </div>
                  <div className="apv-frog">
                    <div className="apv-frog-lbl">🐸 EAT THE FROG · HIGHEST LEVERAGE</div>
                    <div className="apv-frog-name">Practice a new skill for 5 minutes</div>
                    <div className="apv-frog-row">
                      <span className="apv-frog-cta">Mark Complete</span>
                      <span className="apv-frog-ghost">Focus Mode · 25 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TRUST STRIP ============================ */}
      <div className="pl-strip">
        <div className="pl-wrap pl-strip-grid">
          <div className="pl-strip-item pl-reveal" style={rd("0ms")}><div className="pl-label">01 — Generate</div><div className="pl-strip-t">AI plan generation</div></div>
          <div className="pl-strip-item pl-reveal" style={rd("80ms")}><div className="pl-label">02 — Execute</div><div className="pl-strip-t">Daily frog priority</div></div>
          <div className="pl-strip-item pl-reveal" style={rd("160ms")}><div className="pl-label">03 — Adapt</div><div className="pl-strip-t">Weekly review loop</div></div>
          <div className="pl-strip-item pl-reveal" style={rd("240ms")}><div className="pl-label">04 — Recover</div><div className="pl-strip-t">Built-in recovery</div></div>
        </div>
      </div>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="pl-block" id="how">
        <div className="pl-wrap">
          <div className="pl-section-head pl-reveal">
            <div className="pl-eyebrow">How it works</div>
            <h2>From a few questions to a system that <span className="pl-accent">runs your day.</span></h2>
            <p>No blank slate, no endless setup. MACP builds the structure, then keeps it realistic as your weeks change.</p>
          </div>
          <div className="pl-steps">
            <div className="pl-step pl-reveal" style={rd("0ms")}>
              <div className="pl-num">STEP 01</div><div className="pl-line" />
              <h3>Answer a few questions</h3>
              <p>Goals, schedule, friction, intensity, and the constraints you're actually working with.</p>
            </div>
            <div className="pl-step pl-reveal" style={rd("90ms")}>
              <div className="pl-num">STEP 02</div><div className="pl-line" />
              <h3>Get your AI system</h3>
              <p>Habits, milestones, tiers, today's frog, and a weekly focus — built around your real life.</p>
            </div>
            <div className="pl-step pl-reveal" style={rd("180ms")}>
              <div className="pl-num">STEP 03</div><div className="pl-line" />
              <h3>Execute today's frog</h3>
              <p>One highest-leverage action gets priority. Do that first; the rest follows.</p>
            </div>
            <div className="pl-step pl-reveal" style={rd("270ms")}>
              <div className="pl-num">STEP 04</div><div className="pl-line" />
              <h3>Review and adapt weekly</h3>
              <p>Momentum, misses, and recovery feed the next adjustment. The plan stays honest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className="pl-block" id="features">
        <div className="pl-wrap">
          <div className="pl-feature-grid">
            <div className="pl-section-head pl-reveal">
              <div className="pl-eyebrow">What's inside the system</div>
              <h2>A command surface for the person you're <span className="pl-accent">becoming.</span></h2>
              <p>Five working parts, one calm surface. Amber signals what's live; green marks what's done or recovered.</p>
            </div>

            {/* The five real working parts of MACP, shown as premium stacked
                modules (NOT a fake app screen). This is the main feature visual. */}
            <div className="pl-modules-wrap pl-reveal">
              <div className="pl-modules" role="img" aria-label="The five MACP system modules: AI Plan, Today's Frog, Weekly Review, Recovery, and Progress History">
                <div className="pl-modules-cap">
                  <span className="pl-modules-cap-lbl">The MACP system</span>
                  <span className="pl-modules-cap-meta">5 connected modules</span>
                </div>

                <div className="pl-module">
                  <div className="pl-module-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5 10.1 7.6z" /><path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>
                  </div>
                  <div className="pl-module-main">
                    <div className="pl-module-name">AI Plan</div>
                    <div className="pl-module-desc">Personalized habits, tiers and milestones, generated from your goals.</div>
                  </div>
                  <div className="pl-module-tag">Generate</div>
                </div>

                <div className="pl-module green">
                  <div className="pl-module-icon"><span className="pl-frog-emoji">🐸</span></div>
                  <div className="pl-module-main">
                    <div className="pl-module-name">Today's Frog</div>
                    <div className="pl-module-desc">Your single highest-leverage action, prioritized for the day.</div>
                  </div>
                  <div className="pl-module-tag">Daily</div>
                </div>

                <div className="pl-module">
                  <div className="pl-module-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" /><polyline points="12 7 12 12 15 14" /></svg>
                  </div>
                  <div className="pl-module-main">
                    <div className="pl-module-name">Weekly Review</div>
                    <div className="pl-module-desc">Reflect, score the week, and re-tune the plan on schedule.</div>
                  </div>
                  <div className="pl-module-tag">Weekly</div>
                </div>

                <div className="pl-module green">
                  <div className="pl-module-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9z" /><polyline points="3 4.5 3 9 7.5 9" /><path d="m9 12 2 2 4-4" /></svg>
                  </div>
                  <div className="pl-module-main">
                    <div className="pl-module-name">Recovery</div>
                    <div className="pl-module-desc">Miss a day and the plan rebalances — resume without restarting.</div>
                  </div>
                  <div className="pl-module-tag">Adaptive</div>
                </div>

                <div className="pl-module">
                  <div className="pl-module-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></svg>
                  </div>
                  <div className="pl-module-main">
                    <div className="pl-module-name">Progress History</div>
                    <div className="pl-module-desc">Streaks, consistency and momentum tracked over time.</div>
                  </div>
                  <div className="pl-module-tag">Trend</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ COMMAND SURFACE PROOF ============================ */}
      <section className="pl-block" id="progress">
        <div className="pl-wrap">
          <div className="pl-surface-grid">
            {/* Reserved visual slot for a future product preview — intentionally
                minimal dark space with a soft glow (no fake dashboard, no
                placeholder text). Hidden on mobile so it never leaves a blank gap. */}
            <div className="pl-future-slot pl-reveal" aria-hidden="true" />

            <div className="pl-callouts">
              <div className="pl-section-head pl-reveal" style={{ marginBottom: 14 }}>
                <div className="pl-eyebrow">The command surface</div>
                <h2 className="pl-h2-sm">Your whole system, on one <span className="pl-accent">surface.</span></h2>
              </div>
              <div className="pl-callout pl-reveal" style={rd("0ms")}><div className="pl-label">Current plan</div><h4>Your tier, at a glance</h4><p>Plan version, tier, and focus — always the first thing you see.</p></div>
              <div className="pl-callout pl-reveal" style={rd("80ms")}><div className="pl-label">Consistency</div><h4>Momentum you can read</h4><p>Daily completion charted across the week, amber for live, green for done.</p></div>
              <div className="pl-callout pl-reveal" style={rd("160ms")}><div className="pl-label">Weekly review</div><h4>A standing appointment</h4><p>Reflect and re-tune on schedule, so the plan never drifts from reality.</p></div>
              <div className="pl-callout pl-reveal" style={rd("240ms")}><div className="pl-label">Recovery signal</div><h4>One bad day isn't a reset</h4><p>Miss a day and the system rebalances — you resume, you don't restart.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="pl-final">
        <div className="pl-wrap">
          <div className="pl-final-inner pl-reveal">
            <div className="pl-eyebrow">Set your standard</div>
            <h2>Your system is built when you <span className="pl-accent">start.</span></h2>
            <p>Answer a few questions. Get your first AI plan in minutes.</p>
            <PrimaryCTA />
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="pl-footer">
        {/* top row — wordmark · nav · tagline */}
        <div className="pl-wrap pl-foot-top">
          <Wordmark mk="20px" sy="9px" />
          <nav className="pl-foot-nav">
            <a onClick={() => scrollToSection("how")}>How it works</a>
            <a onClick={() => scrollToSection("features")}>Features</a>
            <a onClick={() => scrollToSection("progress")}>Progress</a>
            <SignedOut><a onClick={() => onAuth("sign-in")}>Sign in</a></SignedOut>
          </nav>
          <span className="pl-foot-tagline">Build a system that compounds</span>
        </div>
        {/* bottom row — copyright · trust links · AI note */}
        <div className="pl-wrap pl-foot-bottom">
          <span className="pl-foot-copy">© 2026 MACP</span>
          <div className="pl-foot-trust">
            <a onClick={() => onTrust("privacy")}>Privacy</a>
            <a onClick={() => onTrust("terms")}>Terms</a>
            <a onClick={() => onTrust("support")}>Support</a>
            <a onClick={() => onTrust("ai-disclaimer")}>AI Disclaimer</a>
          </div>
          <span className="pl-foot-note">AI habit guidance only. Not professional advice.</span>
        </div>
      </footer>
    </div>
  );
}
