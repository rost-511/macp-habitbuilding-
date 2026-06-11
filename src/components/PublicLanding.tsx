import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { useSupabase } from "../lib/useSupabase";
import { getMyProfile } from "../lib/userData";
import { LANDING_STYLES } from "../styles/landingStyles";

/* ─────────────────────────────────────────────────────────────────────────────
   PUBLIC LANDING (2026-06 redesign)
   Presentational marketing page. Owns its own sticky header. The scroll
   container is the app's `.page` element (NOT the window) — every scroll read,
   the reveal IntersectionObserver root, and smooth-scroll target `.page`.
   Styles: src/styles/landingStyles.ts (`.lp-*` namespace), injected below.
   Spec: docs/superpowers/specs/2026-06-11-landing-redesign-design.md
───────────────────────────────────────────────────────────────────────────── */

// custom CSS property for staggered reveal/load delay
const rd = (d: string) => ({ "--d": d } as React.CSSProperties);
// bar helper: height + grow-delay custom properties for the recovery chart
const rd2 = (h: string, bd: string) => ({ "--h": h, "--bd": bd } as React.CSSProperties);

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

/* Footer column. Static open column on desktop; on mobile the heading becomes a
   tappable accordion row (CSS handles show/hide + chevron rotation purely from
   aria-expanded). Module scope so landing re-renders never remount it. */
function FootCol({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-foot-col">
      <button
        type="button"
        className="lp-foot-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className="lp-foot-chev" aria-hidden="true"><ChevronDown /></span>
      </button>
      <div className="lp-foot-links-wrap">
        <div className="lp-foot-links">{children}</div>
      </div>
    </div>
  );
}

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
    // Clear the sticky header; phones use a slightly taller gap.
    const headerOffset = window.innerWidth <= 600 ? 80 : 72;
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

  // Header scroll state + hero preview rise + scroll reveals — all on `.page`.
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

    // Hero preview rise: starts tilted (CSS), flattens to face-on over the
    // first ~420px of scroll. Transform-only; no-ops on mobile/reduced motion.
    const pv = root.querySelector<HTMLElement>(".lp-preview-wrap");
    let riseRaf = 0;
    const onRise = () => {
      if (!pv || reduce || window.innerWidth <= 600 || riseRaf) return;
      riseRaf = requestAnimationFrame(() => {
        riseRaf = 0;
        const t = pageEl?.scrollTop ?? 0;
        const p = Math.min(1, t / 420);
        pv.style.transform = `perspective(1200px) rotateX(${(1 - p) * 6}deg) translateY(${(1 - p) * -8}px)`;
      });
    };
    pageEl?.addEventListener("scroll", onRise, { passive: true });
    onRise();

    const revealables = Array.from(root.querySelectorAll<HTMLElement>(".lp-reveal"));
    const fire = (el: HTMLElement) => el.classList.add("lp-in");

    // Reduced motion (or no IO support): render final state immediately.
    if (reduce || !("IntersectionObserver" in window)) {
      revealables.forEach(fire);
      return () => {
        pageEl?.removeEventListener("scroll", onScroll);
        window.removeEventListener("scroll", onScroll);
        pageEl?.removeEventListener("scroll", onRise);
        if (riseRaf) cancelAnimationFrame(riseRaf);
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

    // Safety net: above-the-fold must never depend solely on IO (it can be
    // delayed in non-painting contexts → blank sections). Reveal anything
    // already in view on the first frame + on window load.
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
      pageEl?.removeEventListener("scroll", onRise);
      if (riseRaf) cancelAnimationFrame(riseRaf);
      io.disconnect();
      window.removeEventListener("load", revealInView);
      cancelAnimationFrame(raf);
    };
  }, []);

  const Wordmark = () => (
    <button className="lp-wordmark" onClick={scrollToTop} aria-label="MACP system — back to top">
      MACP<span>system</span>
    </button>
  );

  const PrimaryCTA = ({ className = "" }: { className?: string }) => (
    <button
      className={`lp-btn-amber ${className}`}
      onClick={handleAssessmentClick}
      disabled={ctaLoading}
    >
      {ctaLoading ? (
        <><span className="lp-spin" />Checking…</>
      ) : (
        <>Build your system<ArrowRight /></>
      )}
    </button>
  );

  return (
    <div className="lp-root" ref={rootRef}>
      <style>{LANDING_STYLES}</style>
      <span id="top" />

      {/* ============================ HEADER ============================ */}
      <header className={`lp-header ${scrolled ? "lp-scrolled" : ""}`}>
        <div className="lp-wrap lp-nav">
          <Wordmark />
          <nav className="lp-links">
            <a onClick={() => scrollToSection("how")}>How it works</a>
            <a onClick={() => scrollToSection("features")}>Features</a>
          </nav>
          <div className="lp-actions">
            <SignedOut>
              <button className="lp-signin" onClick={() => onAuth("sign-in")}>Sign in</button>
            </SignedOut>
            <SignedIn>
              {/* .lp-user wrapper lets the landing header hide the avatar on mobile */}
              <span className="lp-user">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{ elements: { userButtonAvatarBox: { width: "30px", height: "30px" } } }}
                />
              </span>
            </SignedIn>
            <PrimaryCTA className="lp-header-cta" />
            <button
              className="lp-menu-toggle"
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
          <div className="lp-mobile-menu">
            <a onClick={() => scrollToSection("how")}>How it works</a>
            <a onClick={() => scrollToSection("features")}>Features</a>
            <SignedOut>
              <button onClick={() => { setMenuOpen(false); onAuth("sign-in"); }}>Sign in</button>
            </SignedOut>
          </div>
        )}
      </header>

      {/* ============================ HERO ============================ */}
      <section className="lp-hero">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-wrap">
          <div className="lp-badge lp-load" style={rd("60ms")}>
            <span className="lp-dot" aria-hidden="true" />
            Adapts every week — even the bad ones
          </div>
          <h1 className="lp-h1 lp-load" style={rd("120ms")}>
            Consistency,<br />engineered.
          </h1>
          <p className="lp-hero-sub lp-load" style={rd("180ms")}>
            MACP turns your goals into a daily operating system — one priority a
            day, and a plan that rebalances when life happens.
          </p>
          <div className="lp-cta-row lp-load" style={rd("240ms")}>
            <PrimaryCTA />
            <button className="lp-btn-ghost" onClick={() => scrollToSection("how")}>
              See how it works<ChevronDown />
            </button>
          </div>

          {/* dashboard preview — rises/flattens on scroll (handler in useEffect) */}
          <div className="lp-preview-wrap lp-load-fade" style={rd("320ms")}>
            <div
              className="lp-preview"
              role="img"
              aria-label="MACP dashboard preview: today's frog, habit stats, streak and weekly consistency"
            >
              <div className="lp-pv-top">
                <div>
                  <div className="lp-pv-greet">Good morning, Sam</div>
                  <div className="lp-pv-date">THURSDAY, JUNE 11</div>
                </div>
                <span className="lp-pv-tier">TIER 1 · FOUNDATION</span>
              </div>
              <div className="lp-pv-frog">
                <div>
                  <div className="lp-pv-frog-lbl">🐸 TODAY'S FROG · HIGHEST LEVERAGE</div>
                  <div className="lp-pv-frog-name">Deep work on the proposal — 25 minutes</div>
                </div>
                <span className="lp-pv-frog-btn">Mark complete</span>
              </div>
              <div className="lp-pv-stats">
                <div className="lp-pv-stat">
                  <div className="lp-pv-stat-lbl">HABITS TODAY</div>
                  <div className="lp-pv-stat-val">3<small> / 5</small></div>
                  <div className="lp-pv-stat-foot g">On track</div>
                </div>
                <div className="lp-pv-stat">
                  <div className="lp-pv-stat-lbl">STREAK</div>
                  <div className="lp-pv-stat-val">6<small> days</small></div>
                  <div className="lp-pv-stat-foot a">Keep going</div>
                </div>
                <div className="lp-pv-stat">
                  <div className="lp-pv-stat-lbl">THIS WEEK</div>
                  <div className="lp-pv-stat-val">72<small> %</small></div>
                  <div className="lp-pv-bars" aria-hidden="true">
                    <span style={{ height: "60%" }} />
                    <span style={{ height: "85%" }} />
                    <span style={{ height: "45%" }} />
                    <span className="hi" style={{ height: "100%" }} />
                    <span className="am" style={{ height: "70%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="lp-block" id="how">
        <div className="lp-wrap">
          <div className="lp-eyebrow lp-reveal">How it works</div>
          <h2 className="lp-h2 lp-reveal" style={rd("60ms")}>
            Three steps. Then the system runs.
          </h2>
          {/* row is a reveal only as the .lp-in hook for the line-draw ::before */}
          <div className="lp-steps lp-reveal">
            <div className="lp-step lp-reveal" style={rd("0ms")}>
              <div className="lp-step-num">01</div>
              <h3>Answer a few questions</h3>
              <p>Your goals, your schedule, and the constraints you're actually working with.</p>
            </div>
            <div className="lp-step lp-reveal" style={rd("120ms")}>
              <div className="lp-step-num">02</div>
              <h3>Get your system</h3>
              <p>AI builds the plan: habits, milestones, tiers, and your first frog.</p>
            </div>
            <div className="lp-step lp-reveal" style={rd("240ms")}>
              <div className="lp-step-num lp-amber">03</div>
              <h3>Run your day</h3>
              <p>One priority a day, a review every week — and recovery built in when you miss.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className="lp-block" id="features">
        <div className="lp-wrap">
          <div className="lp-eyebrow lp-reveal">What's inside</div>
          <h2 className="lp-h2 lp-reveal" style={rd("60ms")}>
            Five parts, one calm surface.
          </h2>
          <div className="lp-bento">
            <div className="lp-cell lp-reveal" style={rd("0ms")}>
              <h3>AI Plan</h3>
              <p>Personalized habits, tiers and milestones, generated from your goals — not a template.</p>
              <div className="lp-mini-plan" aria-hidden="true">
                <div className="lp-mini-plan-top">
                  <span>CURRENT PLAN</span>
                  <span className="lp-mini-badge">v1 · INITIAL</span>
                </div>
                <div className="lp-mini-plan-name">Ship the side project</div>
                <div className="lp-mini-plan-meta">Tier 1 · Foundation · 5 habits</div>
                <div className="lp-mini-plan-segs"><span className="on" /><span /><span /></div>
              </div>
            </div>

            <div className="lp-cell lp-reveal" style={rd("70ms")}>
              <div className="lp-cell-emoji" aria-hidden="true">🐸</div>
              <h3>Today's Frog</h3>
              <p>Your single highest-leverage action, chosen daily. Do it first — the rest follows.</p>
              <div className="lp-mini-frog" aria-hidden="true">
                <div className="lp-mini-frog-name">Deep work — 25 min</div>
                <div className="lp-mini-frog-done">✓ Completed 8:42 AM</div>
              </div>
            </div>

            <div className="lp-cell lp-cell-green lp-reveal" style={rd("140ms")}>
              <div className="lp-badge lp-badge-sm">
                <span className="lp-dot" aria-hidden="true" />Recovery
              </div>
              <h3>One bad day isn't a reset.</h3>
              <p>Miss a day and the plan rebalances around it. You resume — you don't restart. This is what most habit apps get wrong.</p>
              <div
                className="lp-rbars"
                role="img"
                aria-label="Weekly chart showing a missed Wednesday recovering to full consistency by Friday"
              >
                <span style={rd2("70%", "0ms")} />
                <span style={rd2("85%", "60ms")} />
                <span className="miss" style={rd2("20%", "120ms")} />
                <span className="rec" style={rd2("55%", "180ms")} />
                <span className="rec2" style={rd2("75%", "240ms")} />
                <span className="full" style={rd2("90%", "300ms")} />
              </div>
              <div className="lp-rbars-cap" aria-hidden="true">missed wednesday → recovered by friday</div>
            </div>

            <div className="lp-cell-stack">
              <div className="lp-cell lp-reveal" style={rd("210ms")}>
                <h3>Weekly Review</h3>
                <p>Score the week, reflect, and let the plan re-tune itself on schedule.</p>
              </div>
              <div className="lp-cell lp-reveal" style={rd("280ms")}>
                <h3>Progress History</h3>
                <p>Streaks, consistency and momentum, tracked over months — not just today.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="lp-final">
        <div className="lp-final-glow" aria-hidden="true" />
        <div className="lp-wrap lp-reveal">
          <h2 className="lp-h2">Your system is built<br />the moment you start.</h2>
          <p>A few questions. Your first AI plan in minutes. Free to begin.</p>
          <PrimaryCTA />
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-foot-main">
          <div className="lp-foot-brand">
            <Wordmark />
            <p className="lp-foot-sub">
              AI habit systems, built for execution. One priority a day,
              recovery when life happens.
            </p>
          </div>
          <div className="lp-foot-cols">
            <FootCol title="Product">
              <a onClick={() => scrollToSection("how")}>How it works</a>
              <a onClick={() => scrollToSection("features")}>Features</a>
            </FootCol>
            <FootCol title="Account">
              <SignedOut><a onClick={() => onAuth("sign-in")}>Sign in</a></SignedOut>
              <a onClick={handleAssessmentClick}>Build your system</a>
            </FootCol>
            <FootCol title="Legal">
              <a onClick={() => onTrust("privacy")}>Privacy</a>
              <a onClick={() => onTrust("terms")}>Terms</a>
              <a onClick={() => onTrust("support")}>Support</a>
              <a onClick={() => onTrust("ai-disclaimer")}>AI Disclaimer</a>
            </FootCol>
          </div>
        </div>
        <div className="lp-wrap lp-foot-base">
          <span>© 2026 MACP</span>
          <span>AI habit guidance · Use your judgment</span>
        </div>
      </footer>
    </div>
  );
}
