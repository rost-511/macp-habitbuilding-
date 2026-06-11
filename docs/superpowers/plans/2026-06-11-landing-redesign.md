# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current landing page (`PublicLanding.tsx`, `.pl-*` styles) with the approved Linear-style redesign per `docs/superpowers/specs/2026-06-11-landing-redesign-design.md`.

**Architecture:** `PublicLanding.tsx` is rewritten in place keeping its props and CTA routing verbatim; all new CSS lives in a new `src/styles/landingStyles.ts` under the `.lp-*` namespace, injected by the component itself, so `App.tsx` is untouched. The old `.pl-*` block is then deleted from `appStyles.ts`.

**Tech Stack:** React 19 + Vite + TypeScript. No new dependencies. Animations: CSS + IntersectionObserver + one rAF scroll handler.

**Project rules (override defaults):**
- **NEVER run `git commit` or `git push`.** The user commits between tasks themselves. Each task ends with a STOP checkpoint for the user.
- This repo has **no test runner** (no test script, no testing libs). This is a presentational rewrite, so do not add a test framework (YAGNI). Verification per task = `npm run build` + `npm run lint` + visual check in the dev server (`npm run dev`, http://localhost:5173).
- The landing page scrolls inside the app's `.page` element (`App.tsx:1233`), **not** the window. All scroll reads, the IntersectionObserver root, and smooth-scroll targets must use `.page`. This is preserved in the code below — do not "simplify" it to window scrolling.

**Key existing facts:**
- `PublicLanding` is rendered at `App.tsx:1235` with props `onStart`, `onDashboard`, `onAuth`, `onTrust`.
- `appStyles.ts` exports `STYLES` (one big template string) injected via `<style>{STYLES}</style>` in `App.tsx`. Its Public Landing block starts at the comment `/* ── Public Landing (Project 14B)` (line 119) and ends right before `/* ── Trust / legal pages (Project 14C)` (line 925). All `.pl-` selectors live only in that block.
- The auth screen's `apv-*` / `auth-pv` styles (in the AUTH SHELL section and later) are used by the auth page and **must not be touched**.

---

### Task 1: Stylesheet + component shell (header works, sections empty)

**Files:**
- Create: `src/styles/landingStyles.ts`
- Rewrite: `src/components/PublicLanding.tsx`

- [ ] **Step 1: Create `src/styles/landingStyles.ts`**

Create the file with the complete stylesheet (CSS for all sections is included now; it is inert until the matching JSX lands in Tasks 2–5):

```ts
/* ─────────────────────────────────────────────────────────────────────────────
   PUBLIC LANDING STYLES (2026-06 redesign)
   Namespace: .lp-* — injected by PublicLanding.tsx via <style>{LANDING_STYLES}</style>.
   The landing scrolls inside the app's `.page` element (NOT the window).
   Spec: docs/superpowers/specs/2026-06-11-landing-redesign-design.md
───────────────────────────────────────────────────────────────────────────── */
export const LANDING_STYLES = `
.lp-root{
  --lp-bg:#0a0a0b;
  --lp-card:#121315;
  --lp-card2:#17181b;
  --lp-line:rgba(255,255,255,0.06);
  --lp-cline:#222428;
  --lp-cline2:#26282c;
  --lp-text:#f4f3f0;
  --lp-text2:#9a9ba0;
  --lp-mut:#86878a;
  --lp-faint:#5b5d61;
  --lp-amber:#f5a524;
  --lp-amber-ink:#161104;
  --lp-green:#4ade80;
  --lp-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  position:relative;
  min-height:100%;
  background:var(--lp-bg);
  color:var(--lp-text);
  font-family:var(--lp-font);
  -webkit-font-smoothing:antialiased;
}
.lp-wrap{max-width:1080px;margin:0 auto;padding:0 24px}

/* ── Buttons ── */
.lp-btn-amber{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--lp-amber);color:var(--lp-amber-ink);
  border:none;border-radius:8px;cursor:pointer;
  font-family:var(--lp-font);font-size:.9rem;font-weight:600;
  padding:11px 22px;
  box-shadow:0 4px 24px rgba(245,165,36,0.25);
  transition:transform .18s ease,box-shadow .18s ease,background .18s ease;
}
.lp-btn-amber:hover{background:#ffb437;box-shadow:0 6px 28px rgba(245,165,36,0.32);transform:translateY(-1px)}
.lp-btn-amber:active{transform:translateY(0)}
.lp-btn-amber:disabled{opacity:.7;cursor:default;transform:none}
.lp-btn-amber svg{width:16px;height:16px}
.lp-btn-ghost{
  display:inline-flex;align-items:center;gap:8px;
  background:transparent;color:#c9cacc;
  border:1px solid #2a2c30;border-radius:8px;cursor:pointer;
  font-family:var(--lp-font);font-size:.9rem;font-weight:500;
  padding:11px 20px;
  transition:border-color .18s ease,color .18s ease,background .18s ease;
}
.lp-btn-ghost:hover{border-color:#3a3d42;color:var(--lp-text);background:rgba(255,255,255,0.03)}
.lp-btn-ghost svg{width:15px;height:15px}
.lp-spin{
  width:14px;height:14px;border-radius:50%;
  border:2px solid rgba(22,17,4,0.3);border-top-color:var(--lp-amber-ink);
  animation:lpSpin .7s linear infinite;
}
@keyframes lpSpin{to{transform:rotate(360deg)}}

/* ── Header ── */
.lp-header{
  position:sticky;top:0;z-index:40;
  background:transparent;border-bottom:1px solid transparent;
  transition:background .25s ease,border-color .25s ease;
}
.lp-header.lp-scrolled{
  background:rgba(10,10,11,0.72);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border-bottom-color:var(--lp-line);
}
.lp-nav{display:flex;align-items:center;justify-content:space-between;height:64px}
.lp-wordmark{
  background:none;border:none;cursor:pointer;padding:0;
  font-family:var(--lp-font);color:var(--lp-text);
  font-size:1rem;font-weight:700;letter-spacing:.02em;
}
.lp-wordmark span{color:var(--lp-faint);font-weight:400;font-size:.72rem;margin-left:4px}
.lp-links{display:flex;gap:28px}
.lp-links a{color:var(--lp-text2);font-size:.85rem;cursor:pointer;transition:color .18s}
.lp-links a:hover{color:var(--lp-text)}
.lp-actions{display:flex;align-items:center;gap:10px}
.lp-signin{
  background:none;border:1px solid #2a2c30;border-radius:7px;cursor:pointer;
  color:#e6e5e2;font-family:var(--lp-font);font-size:.85rem;font-weight:500;
  padding:8px 16px;transition:border-color .18s,background .18s;
}
.lp-signin:hover{border-color:#3a3d42;background:rgba(255,255,255,0.03)}
.lp-header .lp-btn-amber{padding:9px 18px;font-size:.85rem}
.lp-menu-toggle{display:none;background:none;border:none;color:var(--lp-text);cursor:pointer;padding:6px}
.lp-mobile-menu{
  display:flex;flex-direction:column;gap:4px;
  padding:10px 24px 18px;
  background:rgba(10,10,11,0.95);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--lp-line);
}
.lp-mobile-menu a,.lp-mobile-menu button{
  text-align:left;background:none;border:none;cursor:pointer;
  color:var(--lp-text2);font-family:var(--lp-font);font-size:.95rem;padding:10px 0;
}
.lp-mobile-menu a:hover,.lp-mobile-menu button:hover{color:var(--lp-text)}

/* ── Hero ── */
.lp-hero{position:relative;overflow:hidden;padding:84px 0 0;text-align:center}
.lp-hero-glow{
  position:absolute;left:50%;top:58%;transform:translateX(-50%);
  width:640px;height:240px;pointer-events:none;
  background:radial-gradient(ellipse,rgba(245,165,36,0.10),transparent 70%);
}
.lp-badge{
  display:inline-flex;align-items:center;gap:8px;
  border:1px solid rgba(74,222,128,0.25);background:rgba(74,222,128,0.06);
  color:var(--lp-green);font-size:.74rem;letter-spacing:.04em;
  padding:5px 14px;border-radius:999px;margin-bottom:24px;
}
.lp-dot{width:5px;height:5px;border-radius:50%;background:var(--lp-green);flex:none}
.lp-h1{
  margin:0;font-size:clamp(2.6rem,6vw,4rem);font-weight:700;
  line-height:1.04;letter-spacing:-.035em;color:var(--lp-text);
}
.lp-hero-sub{
  margin:20px auto 0;max-width:480px;
  color:var(--lp-text2);font-size:1.02rem;line-height:1.6;
}
.lp-cta-row{display:flex;gap:12px;justify-content:center;margin-top:30px}

/* hero product preview — JS drives the rise/flatten transform on scroll */
.lp-preview-wrap{
  margin:56px auto -46px;max-width:760px;position:relative;
  transform:perspective(1200px) rotateX(6deg) translateY(-8px);
  transform-origin:top center;
  will-change:transform;
}
.lp-preview{
  background:var(--lp-card);border:1px solid var(--lp-cline2);
  border-radius:14px 14px 0 0;
  box-shadow:0 -20px 80px rgba(245,165,36,0.07),0 30px 60px rgba(0,0,0,0.6);
  padding:22px 24px;text-align:left;
}
.lp-pv-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.lp-pv-greet{color:var(--lp-text);font-size:1rem;font-weight:600}
.lp-pv-date{color:var(--lp-faint);font-size:.62rem;letter-spacing:.14em;margin-top:2px}
.lp-pv-tier{
  color:var(--lp-green);font-size:.62rem;letter-spacing:.06em;
  border:1px solid rgba(74,222,128,0.3);padding:4px 12px;border-radius:999px;
}
.lp-pv-frog{
  display:flex;justify-content:space-between;align-items:center;gap:14px;
  background:var(--lp-card2);border:1px solid var(--lp-cline);
  border-left:3px solid var(--lp-amber);border-radius:9px;
  padding:14px 16px;margin-bottom:12px;
}
.lp-pv-frog-lbl{color:var(--lp-mut);font-size:.58rem;letter-spacing:.14em}
.lp-pv-frog-name{color:var(--lp-text);font-size:.88rem;font-weight:600;margin-top:4px}
.lp-pv-frog-btn{
  flex:none;background:var(--lp-amber);color:var(--lp-amber-ink);
  font-size:.64rem;font-weight:700;padding:7px 14px;border-radius:6px;
}
.lp-pv-stats{display:flex;gap:10px}
.lp-pv-stat{
  flex:1;background:var(--lp-card2);border:1px solid var(--lp-cline);
  border-radius:9px;padding:12px;
}
.lp-pv-stat-lbl{color:var(--lp-mut);font-size:.58rem;letter-spacing:.1em}
.lp-pv-stat-val{color:var(--lp-text);font-size:1.25rem;font-weight:700;margin-top:3px}
.lp-pv-stat-val small{color:var(--lp-faint);font-size:.68rem;font-weight:400}
.lp-pv-stat-foot{color:var(--lp-mut);font-size:.6rem;margin-top:2px}
.lp-pv-stat-foot.g{color:var(--lp-green)}
.lp-pv-stat-foot.a{color:var(--lp-amber)}
.lp-pv-bars{display:flex;gap:3px;align-items:flex-end;height:14px;margin-top:4px}
.lp-pv-bars span{flex:1;background:#2a2c30;border-radius:2px}
.lp-pv-bars span.hi{background:var(--lp-green)}
.lp-pv-bars span.am{background:var(--lp-amber)}

/* ── Section shared ── */
.lp-block{padding:96px 0;border-top:1px solid var(--lp-line)}
.lp-eyebrow{
  color:var(--lp-amber);font-size:.72rem;font-weight:600;
  letter-spacing:.18em;text-transform:uppercase;
}
.lp-h2{
  margin:10px 0 0;font-size:clamp(1.6rem,3.4vw,2.1rem);font-weight:700;
  letter-spacing:-.025em;line-height:1.15;color:var(--lp-text);max-width:460px;
}

/* ── How it works ── */
.lp-steps{display:flex;margin-top:44px;border-top:1px solid var(--lp-line);position:relative}
/* the row itself is a .lp-reveal only as an .lp-in hook for the line draw —
   it must never hide/translate like normal reveals */
.lp-steps.lp-reveal{opacity:1;transform:none;transition:none}
.lp-steps::before{
  content:"";position:absolute;top:-1px;left:0;height:1px;width:100%;
  background:linear-gradient(90deg,rgba(245,165,36,0.5),rgba(255,255,255,0.12));
  transform:scaleX(0);transform-origin:left;
  transition:transform .9s cubic-bezier(.22,.61,.36,1);
}
.lp-steps.lp-in::before{transform:scaleX(1)}
.lp-step{flex:1;padding:28px 28px 0 0;border-right:1px solid var(--lp-line)}
.lp-step + .lp-step{padding-left:28px}
.lp-step:last-child{border-right:none;padding-right:0}
.lp-step-num{font-size:1.5rem;font-weight:700;letter-spacing:-.03em;color:var(--lp-faint)}
.lp-step-num.lp-amber{color:var(--lp-amber)}
.lp-step h3{margin:12px 0 0;font-size:1rem;font-weight:600;color:var(--lp-text)}
.lp-step p{margin:8px 0 0;font-size:.88rem;line-height:1.65;color:var(--lp-text2)}

/* ── Features bento ── */
.lp-bento{display:grid;grid-template-columns:3fr 2fr;gap:14px;margin-top:44px}
.lp-cell{
  background:var(--lp-card);border:1px solid var(--lp-cline);border-radius:14px;
  padding:24px;transition:transform .25s ease,border-color .25s ease;
}
.lp-cell:hover{transform:translateY(-2px);border-color:#2e3137}
.lp-cell h3{margin:0;font-size:1rem;font-weight:600;color:var(--lp-text)}
.lp-cell p{margin:6px 0 0;font-size:.88rem;line-height:1.6;color:var(--lp-text2)}
.lp-cell-emoji{font-size:1.3rem;margin-bottom:8px}
.lp-cell-stack{display:flex;flex-direction:column;gap:14px}
.lp-cell-stack .lp-cell{flex:1}
.lp-cell-green{
  border-color:rgba(74,222,128,0.22);
  background:linear-gradient(135deg,rgba(74,222,128,0.05),transparent 50%),var(--lp-card);
}
.lp-cell-green:hover{border-color:rgba(74,222,128,0.4)}
.lp-cell-green h3{margin-top:12px}
.lp-badge-sm{font-size:.62rem;padding:3px 11px;margin-bottom:0;letter-spacing:.1em;text-transform:uppercase}

.lp-mini-plan{
  margin-top:16px;background:var(--lp-card2);border:1px solid var(--lp-cline2);
  border-radius:9px;padding:12px 14px;
}
.lp-mini-plan-top{display:flex;justify-content:space-between;align-items:center}
.lp-mini-plan-top span:first-child{color:var(--lp-mut);font-size:.58rem;letter-spacing:.14em}
.lp-mini-badge{
  color:var(--lp-amber);font-size:.58rem;
  border:1px solid rgba(245,165,36,0.35);padding:2px 9px;border-radius:999px;
}
.lp-mini-plan-name{color:var(--lp-text);font-size:.85rem;font-weight:600;margin-top:7px}
.lp-mini-plan-meta{color:var(--lp-faint);font-size:.65rem;margin-top:2px}
.lp-mini-plan-segs{display:flex;gap:5px;margin-top:10px}
.lp-mini-plan-segs span{flex:1;height:4px;border-radius:999px;background:#2a2c30}
.lp-mini-plan-segs span.on{flex:2;background:var(--lp-amber)}

.lp-mini-frog{
  margin-top:14px;background:var(--lp-card2);
  border-left:3px solid var(--lp-amber);border-radius:7px;padding:10px 12px;
}
.lp-mini-frog-name{color:var(--lp-text);font-size:.72rem;font-weight:600}
.lp-mini-frog-done{color:var(--lp-green);font-size:.6rem;margin-top:3px}

.lp-rbars{display:flex;gap:4px;align-items:flex-end;height:32px;max-width:70%;margin-top:16px}
.lp-rbars span{
  flex:1;border-radius:2px;background:#2e3035;height:var(--h,50%);
  transform:scaleY(.12);transform-origin:bottom;
  transition:transform .7s cubic-bezier(.22,.61,.36,1);transition-delay:var(--bd,0ms);
}
.lp-in .lp-rbars span{transform:scaleY(1)}
.lp-rbars span.miss{background:#3a2a1a;border:1px solid rgba(245,165,36,0.4)}
.lp-rbars span.rec{background:rgba(74,222,128,0.5)}
.lp-rbars span.rec2{background:rgba(74,222,128,0.7)}
.lp-rbars span.full{background:var(--lp-green)}
.lp-rbars-cap{color:var(--lp-faint);font-size:.62rem;margin-top:6px}

/* ── Final CTA ── */
.lp-final{position:relative;overflow:hidden;padding:110px 0;border-top:1px solid var(--lp-line);text-align:center}
.lp-final-glow{
  position:absolute;left:50%;bottom:-70px;transform:translateX(-50%);
  width:560px;height:180px;pointer-events:none;
  background:radial-gradient(ellipse,rgba(245,165,36,0.12),transparent 70%);
}
.lp-final .lp-h2{font-size:clamp(1.8rem,4vw,2.4rem);max-width:none}
.lp-final p{color:var(--lp-text2);margin:16px auto 0;max-width:380px;line-height:1.6}
.lp-final .lp-btn-amber{margin-top:28px}

/* ── Footer ── */
.lp-footer{border-top:1px solid var(--lp-line);padding:48px 0 0}
.lp-foot-main{display:flex;justify-content:space-between;gap:40px;padding-bottom:40px}
.lp-foot-brand{max-width:240px}
.lp-foot-sub{color:var(--lp-faint);font-size:.8rem;line-height:1.6;margin-top:10px}
.lp-foot-cols{display:flex;gap:64px}
.lp-foot-head{
  display:flex;align-items:center;gap:6px;width:100%;
  background:none;border:none;padding:0;cursor:default;
  font-family:var(--lp-font);color:var(--lp-mut);
  font-size:.68rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;
}
.lp-foot-chev{display:none}
.lp-foot-links-wrap{overflow:hidden}
.lp-foot-links{display:flex;flex-direction:column;gap:2px;margin-top:12px}
.lp-foot-links a{color:var(--lp-text2);font-size:.85rem;line-height:2;cursor:pointer}
.lp-foot-links a:hover{color:var(--lp-text)}
.lp-foot-base{
  display:flex;justify-content:space-between;
  border-top:1px solid rgba(255,255,255,0.05);
  padding:16px 0;color:var(--lp-faint);font-size:.72rem;
}

/* ── Motion utilities ── */
@keyframes lpFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.lp-load{opacity:0;animation:lpFadeUp .5s cubic-bezier(.22,.61,.36,1) forwards;animation-delay:var(--d,0ms)}
.lp-reveal{
  opacity:0;transform:translateY(16px);
  transition:opacity .55s cubic-bezier(.22,.61,.36,1),transform .55s cubic-bezier(.22,.61,.36,1);
  transition-delay:var(--d,0ms);
}
.lp-reveal.lp-in{opacity:1;transform:none}

/* ── Responsive ── */
@media (max-width:760px){
  .lp-links{display:none}
  .lp-menu-toggle{display:block}
  .lp-steps{flex-direction:column}
  .lp-step{border-right:none;border-bottom:1px solid var(--lp-line);padding:24px 0}
  .lp-step + .lp-step{padding-left:0}
  .lp-step:last-child{border-bottom:none}
  .lp-bento{grid-template-columns:1fr}
  .lp-rbars{max-width:100%}
}
@media (max-width:600px){
  .lp-header .lp-header-cta{display:none}
  .lp-user{display:none}
  .lp-nav{height:58px}
  .lp-hero{padding-top:56px}
  .lp-cta-row{flex-direction:column;align-items:center}
  .lp-preview-wrap{transform:none;margin-bottom:-30px}
  .lp-pv-stats{flex-direction:column}
  .lp-pv-frog{flex-direction:column;align-items:flex-start}
  .lp-block{padding:72px 0}
  .lp-final{padding:84px 0}
  .lp-foot-main{flex-direction:column;gap:24px}
  .lp-foot-cols{flex-direction:column;gap:0}
  .lp-foot-col{border-top:1px solid var(--lp-line)}
  .lp-foot-head{cursor:pointer;padding:14px 0;justify-content:space-between}
  .lp-foot-chev{display:inline-flex;transition:transform .25s}
  .lp-foot-chev svg{width:14px;height:14px}
  .lp-foot-head[aria-expanded="true"] .lp-foot-chev{transform:rotate(180deg)}
  .lp-foot-links-wrap{max-height:0;transition:max-height .3s ease}
  .lp-foot-head[aria-expanded="true"] + .lp-foot-links-wrap{max-height:300px}
  .lp-foot-links{margin:0 0 14px}
}

/* ── Reduced motion: render final state, kill all motion ── */
@media (prefers-reduced-motion:reduce){
  .lp-load{animation:none;opacity:1}
  .lp-reveal{opacity:1;transform:none;transition:none}
  .lp-steps::before{transform:scaleX(1);transition:none}
  .lp-rbars span{transform:scaleY(1);transition:none}
  .lp-preview-wrap{transform:none}
  .lp-btn-amber,.lp-btn-ghost,.lp-cell{transition:none}
}
`;
```

- [ ] **Step 2: Rewrite `src/components/PublicLanding.tsx` as the shell**

Replace the entire file with the following. **The logic blocks marked KEEP VERBATIM are copied from the old file unchanged — do not edit them.** Sections are placeholder comments filled by Tasks 2–5.

```tsx
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

      {/* === HERO (Task 2) === */}

      {/* === HOW IT WORKS (Task 3) === */}

      {/* === FEATURES (Task 4) === */}

      {/* === FINAL CTA (Task 5) === */}

      {/* === FOOTER (Task 5) === */}
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ built in …` with no TypeScript errors.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: exits clean (same warnings as before this change at most; no new errors).

- [ ] **Step 5: Visual check**

Run `npm run dev` (background), open http://localhost:5173 signed-out. Expected: dark near-black page, sticky header with wordmark / two nav links / Sign in / amber "Build your system" button. Header gains blur + hairline after scrolling (body is empty for now, so shrink the window if needed to scroll). No console errors. The auth page (click Sign in) still looks unchanged.

- [ ] **Step 6: STOP — checkpoint**

Report Task 1 done. **Do not commit** — the user commits, then says continue.

---

### Task 2: Hero section

**Files:**
- Modify: `src/components/PublicLanding.tsx` (replace the `{/* === HERO (Task 2) === */}` placeholder)

- [ ] **Step 1: Add the hero JSX**

Replace `{/* === HERO (Task 2) === */}` with:

```tsx
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
          <div className="lp-preview-wrap lp-load" style={rd("320ms")}>
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
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `✓ built in …`

- [ ] **Step 3: Visual check**

In the dev server, signed-out, reload `/`. Expected: badge → headline → sub → CTAs → preview fade up in sequence on load; preview is tilted back and cut by the next section edge; nothing animates again after settling. There is no scrollable content below yet, so the rise effect is fully verifiable after Task 3. "See how it works" does nothing yet (no `#how`) — that's expected until Task 3.

- [ ] **Step 4: STOP — checkpoint**

Report Task 2 done with what you verified. **Do not commit.**

---

### Task 3: How it works section

**Files:**
- Modify: `src/components/PublicLanding.tsx` (replace the `{/* === HOW IT WORKS (Task 3) === */}` placeholder)

- [ ] **Step 1: Add the section JSX**

Replace `{/* === HOW IT WORKS (Task 3) === */}` with:

```tsx
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
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `✓ built in …`

- [ ] **Step 3: Visual check**

Reload `/`. Expected: scrolling down, the hero preview flattens to face-on (the rise effect is now testable); the how-it-works hairline draws left→right, then the three steps fade up in sequence with `03` in amber. Header "How it works" link and hero ghost button smooth-scroll to the section with correct header offset. Mobile width (<760px): steps stack vertically.

- [ ] **Step 4: STOP — checkpoint**

Report Task 3 done. **Do not commit.**

---

### Task 4: Features bento

**Files:**
- Modify: `src/components/PublicLanding.tsx` (replace the `{/* === FEATURES (Task 4) === */}` placeholder)

- [ ] **Step 1: Add the `rd2` helper**

The recovery bars need two custom properties (height + grow delay). Next to the existing `rd` helper near the top of `PublicLanding.tsx`, add:

```tsx
// bar helper: height + grow-delay custom properties for the recovery chart
const rd2 = (h: string, bd: string) => ({ "--h": h, "--bd": bd } as React.CSSProperties);
```

- [ ] **Step 2: Add the section JSX**

Replace `{/* === FEATURES (Task 4) === */}` with:

```tsx
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
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ built in …`

- [ ] **Step 4: Visual check**

Reload `/`, scroll to the features section. Expected: cells fade up staggered; the recovery cell is the only green-tinted one; its bars grow bottom-up left-to-right exactly once (short amber-outlined bar = the missed day, greens after it); cells lift 2px on hover. Mobile width: cells stack full-width. Header "Features" link scrolls here.

- [ ] **Step 5: STOP — checkpoint**

Report Task 4 done. **Do not commit.**

---

### Task 5: Final CTA + footer

**Files:**
- Modify: `src/components/PublicLanding.tsx` (replace the `{/* === FINAL CTA (Task 5) === */}` and `{/* === FOOTER (Task 5) === */}` placeholders)

- [ ] **Step 1: Add final CTA JSX**

Replace `{/* === FINAL CTA (Task 5) === */}` with:

```tsx
      {/* ============================ FINAL CTA ============================ */}
      <section className="lp-final">
        <div className="lp-final-glow" aria-hidden="true" />
        <div className="lp-wrap lp-reveal">
          <h2 className="lp-h2">Your system is built<br />the moment you start.</h2>
          <p>A few questions. Your first AI plan in minutes. Free to begin.</p>
          <PrimaryCTA />
        </div>
      </section>
```

- [ ] **Step 2: Add footer JSX**

Replace `{/* === FOOTER (Task 5) === */}` with:

```tsx
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
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: build `✓`, lint clean.

- [ ] **Step 4: Visual check**

Reload `/`. Expected: final CTA centered over a soft bottom glow with a single amber button; footer shows brand + three columns on desktop; at ≤600px the columns become accordions (tap heading → links expand, chevron rotates). Footer links: Privacy/Terms/Support/AI Disclaimer navigate to trust pages; How it works/Features scroll; Build your system triggers the CTA flow.

- [ ] **Step 5: STOP — checkpoint**

Report Task 5 done. **Do not commit.**

---

### Task 6: Delete the old `.pl-*` block from appStyles.ts

**Files:**
- Modify: `src/styles/appStyles.ts` (delete lines ~119–924 — verify boundaries first)

- [ ] **Step 1: Verify the block boundaries**

Run: `grep -n "Public Landing (Project 14B)\|Trust / legal pages (Project 14C)" src/styles/appStyles.ts`
Expected: two lines, e.g. `119:` (block start) and `925:` (next section start). The block to delete is start-line through (next-section-line − 1). Also confirm all `.pl-` selectors are inside it: `grep -n "\.pl-" src/styles/appStyles.ts | awk -F: '$1<119 || $1>924'` → no output.

- [ ] **Step 2: Delete the block**

With boundaries confirmed as 119–924 (adjust if they differ):

```bash
sed -i '' '119,924d' src/styles/appStyles.ts
```

- [ ] **Step 3: Verify deletion**

Run: `grep -c "\.pl-" src/styles/appStyles.ts`
Expected: `0`
Run: `grep -n "Page container\|Trust / legal" src/styles/appStyles.ts | head -3`
Expected: the `.page` rule survives and the Trust section now directly follows it.

- [ ] **Step 4: Build + lint**

Run: `npm run build && npm run lint`
Expected: build `✓`, lint clean. (`PublicLanding.tsx` no longer uses any `pl-` class, so nothing can break — but verify.)

- [ ] **Step 5: Visual check — auth page regression**

In the dev server: landing renders identically to Task 5; click **Sign in** → the auth screen (with its `apv-*` dashboard preview panel) must look exactly as before — its styles live in the AUTH SHELL section, which was not touched. Also spot-check a trust page (footer → Privacy).

- [ ] **Step 6: STOP — checkpoint**

Report Task 6 done, including the auth-page check result. **Do not commit.**

---

### Task 7: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 2: Functional checklist (dev server, report each result)**

1. Signed-out: header CTA, hero CTA, final CTA, footer "Build your system" → all open auth with **sign-up** intent.
2. Signed-out: header/footer "Sign in" → auth with sign-in intent.
3. Anchor nav: header links, hero ghost button, footer Product links scroll smoothly inside `.page` with correct header offset.
4. Wordmark (header + footer) scrolls to top.
5. Mobile (≤600px viewport): hamburger menu opens/closes and navigates; header CTA hidden; footer accordions work; hero preview is flat (no tilt) and stats stack.
6. Reduced motion (macOS: System Settings → Accessibility → Display → Reduce motion, or DevTools rendering emulation): page renders fully visible and static — no fade-ups, no line draw, no bar growth, no preview tilt; anchor scrolling is instant.
7. Signed-in (if a test account is available): header shows the Clerk avatar, CTA routes to dashboard (onboarded) — if no test account, note it for the user to verify.
8. Trust pages from footer all render and their "home" returns to the landing.

- [ ] **Step 3: STOP — final checkpoint**

Report the full checklist results. **Do not commit.** Remind the user this completes the plan; remaining diffs are theirs to commit.

---

## Self-review notes (already applied)

- Spec coverage: header, hero (badge/headline/sub/CTAs/preview/load stagger/scroll rise), how-it-works (3 cols, line draw, amber 03), bento (4 cells/5 features, green recovery hero cell, growing bars), final CTA, footer (accordion mobile), reduced motion, responsive, `.page` scroll root, props/CTA verbatim, `apv-*` untouched, `.pl-*` deleted — all have tasks.
- Type consistency: `rd` and `rd2` helpers defined before use; all `.lp-*` classes used in JSX exist in `LANDING_STYLES`.
- No test framework added by design (no runner exists in repo); verification is build + lint + manual checks per task.
