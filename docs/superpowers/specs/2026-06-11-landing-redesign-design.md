# Landing Page Redesign — Design Spec

**Date:** 2026-06-11
**Scope:** `PublicLanding.tsx` (landing page only). No changes to auth, app, database, or routing logic.

## Goal

Replace the current landing page with a clean, serious, "real SaaS" design in the Linear school: centered minimal hero, restrained high-quality motion, dark neutral palette with amber/green used only where color carries meaning. The page should feel premium and engineered, not AI-generated or template-like.

## Decisions made during brainstorming

- **Direction:** Centered Minimal (Linear-like) layout with a realistic product preview as the credibility shot.
- **Structure:** Lean, 5 sections — Hero → How it works → Features bento → Final CTA → Footer. No pricing section (CTA goes straight to sign-up; premium gating lives in-app).
- **Animation approach:** CSS + IntersectionObserver + one rAF scroll handler. **No new dependencies.**
- **Palette:** keep amber/green, shift the base from warm dark to neutral near-black.

## Visual language

| Token | Value | Use |
|---|---|---|
| Page background | `#0a0a0b` | whole page |
| Card surfaces | `#121315` – `#17181b` | product preview, bento cells |
| Hairline borders | `rgba(255,255,255,0.06)` (cards `#222428`/`#26282c`) | section rules, card borders |
| Primary text | `#f4f3f0` | headlines |
| Secondary text | `#9a9ba0` | body copy |
| Muted text | `#5b5d61` / `#86878a` | labels, footnotes |
| Amber | `#f5a524` | CTAs, "live" signals, step highlight — nothing else |
| Green | `#4ade80` | status/done/recovery — nothing else |

Typography: system font stack (`-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`). Headlines bold with tight letter-spacing (−1px to −2px at hero size). Small uppercase labels with wide letter-spacing for eyebrows/kickers. No new font loads.

## Page sections

### 1. Header

- Transparent over the hero; after ~12px of scroll gains `backdrop-blur`, subtle background, and bottom hairline (reuse existing scroll detection on the `.page` container, smoother CSS transition).
- Left: MACP wordmark (scrolls to top). Center/right links: How it works, Features (anchor scroll; "Progress" link removed with its section). Right: Sign in (SignedOut) / Clerk `UserButton` (SignedIn), amber "Build your system" CTA, hamburger menu on mobile with the same dropdown behavior as today.

### 2. Hero

- Centered column: green status badge ("Adapts every week — even the bad ones") → two-line headline **"Consistency, engineered."** → one-sentence sub ("MACP turns your goals into a daily operating system — one priority a day, and a plan that rebalances when life happens.") → amber primary CTA + ghost "See how it works" (anchor-scrolls to How it works).
- Below, cut by the fold: realistic dashboard preview card — greeting + date, tier badge, frog card (amber left border, "Mark complete"), three stat cards (Habits Today 3/5, Streak 6 days, This Week 72% with mini bar chart). Built fresh with landing-namespace classes; **do not** reuse the auth screen's `apv-*` markup.
- Soft radial amber glow behind the preview.

### 3. How it works

- Eyebrow "HOW IT WORKS", headline "Three steps. Then the system runs."
- One horizontal hairline rule; three numbered columns separated by vertical hairlines:
  1. **Answer a few questions** — goals, schedule, real constraints.
  2. **Get your system** — AI builds the plan: habits, milestones, tiers, first frog.
  3. **Run your day** — one priority a day, weekly review, recovery built in. Number `03` rendered in amber (the others muted).
- Mobile: columns stack vertically with horizontal rules.

### 4. Features (bento grid)

Eyebrow "WHAT'S INSIDE", headline "Five parts, one calm surface." Four cells, five features:

- **Row 1:** AI Plan (wide cell; mini plan-card visual: plan name, tier meta, amber progress segments) · Today's Frog (frog emoji, completed frog card with green timestamp).
- **Row 2:** **Recovery — the hero cell** (wide; green-tinted border + gradient wash, the only colored cell): badge "RECOVERY", headline "One bad day isn't a reset.", copy ending "This is what most habit apps get wrong.", mini bar chart showing a missed day (amber-outlined short bar) recovering to green across the week, caption "missed wednesday → recovered by friday". · Right column stacks two compact cells: Weekly Review, Progress History.
- Mobile: all cells stack full-width.

### 5. Final CTA

Centered: headline "Your system is built the moment you start.", sub "A few questions. Your first AI plan in minutes. Free to begin.", single amber CTA. Soft amber glow rising from the bottom edge. No secondary button.

### 6. Footer

Single grid: brand column (wordmark + two-line blurb "AI habit systems, built for execution. One priority a day, recovery when life happens.") + three link columns — Product (How it works, Features), Account (Sign in — SignedOut only, Build your system), Legal (Privacy, Terms, Support, AI Disclaimer via `onTrust`). Bottom row: "© 2026 MACP" · "AI habit guidance · Use your judgment". Mobile: link columns use the existing accordion pattern (module-scope component so re-renders don't reset open state). The old long mission paragraph is removed.

## Motion system

Principles: nothing loops, nothing moves after settling, every animation runs once. All motion disabled (final state rendered immediately) under `prefers-reduced-motion`, matching current behavior.

1. **Hero load sequence:** badge → headline → sub → CTAs fade up in order, 60ms stagger, ~500ms each, gentle ease-out. Runs on mount, not on IO.
2. **Hero product rise (the one scroll-linked effect):** preview starts lower, tilted back in perspective (`rotateX(~6deg)`); as the user scrolls it rises and flattens to face-on while the glow brightens slightly. Driven by one passive scroll listener on the `.page` container + `requestAnimationFrame`; transform-only (compositor-friendly).
3. **Scroll reveals:** IntersectionObserver on the `.page` root (threshold/rootMargin similar to current), one-time fade-up per element with per-element stagger delays. Keep the current safety net: reveal anything already in view on first frame and force-reveal stragglers so the page never renders blank.
4. **Section accents:** How-it-works hairline draws in left→right before its steps fade up; recovery chart bars grow once when the cell enters view.
5. **Micro-interactions (CSS only):** bento cells lift 2px + border brightens on hover; buttons have subtle hover/active states; header blur transition.

Removed from the old page: count-up numbers, momentum-bar choreography, per-element `--d` inline delays scattered through JSX (delays move into CSS where practical).

## Architecture

- **`src/components/PublicLanding.tsx` rewritten in place.** Unchanged: props interface (`onStart`, `onDashboard`, `onAuth`, `onTrust`), `handleAssessmentClick` routing logic **verbatim** (sign-up intent for signed-out, profile check → dashboard/onboarding, fail-open to assessment), Clerk `SignedIn`/`SignedOut`/`UserButton` usage, `.page` container as the scroll root for all scroll reads/IO/smooth-scroll.
- **New styles file** `src/styles/landingStyles.ts` exporting `LANDING_STYLES`, the landing CSS under the fresh `.lp-*` class namespace. `PublicLanding.tsx` renders its own `<style>{LANDING_STYLES}</style>` so the landing is self-contained. The old `.pl-*` block is deleted from `appStyles.ts` (`STYLES`, injected via `<style>` tags in `App.tsx`). The auth screen's `apv-*` styles stay untouched (still used by the auth page).
- **No changes to `App.tsx`** — its `STYLES` injection stays as-is for the rest of the app. No new npm dependencies.

## Responsive behavior

Breakpoint strategy mirrors the current page (~600px mobile). Hero headline scales down; CTAs stack; product preview scales to full width with reduced tilt; how-it-works and bento stack vertically; footer accordions. Header CTA may hide on the smallest widths (current pattern).

## Accessibility

- `prefers-reduced-motion` honored for every animation (static final state).
- Product preview and bento mini-visuals get `role="img"` + descriptive `aria-label`s.
- Anchor navigation keeps the header-offset scroll logic; interactive footer accordions keep `aria-expanded`.

## Testing / verification

- `npm run build` and `npm run lint` pass.
- Manual: signed-out CTA → auth (sign-up); signed-in CTA → dashboard (onboarded) or assessment; anchor links scroll correctly inside `.page`; mobile menu and footer accordions work; reduced-motion renders everything visible and static; auth page preview still styled (apv-* untouched).

## Out of scope

Auth screens, TrustPage, the app itself, pricing UI, copy changes elsewhere, analytics, SEO/meta work beyond what the landing markup already has.
