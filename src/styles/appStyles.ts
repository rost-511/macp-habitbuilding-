/* ─────────────────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────────────────── */
export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg:#07080a;
  --surface:#0f1013;
  --surface2:#161719;
  --border:#1f2024;
  --border2:#2a2b30;
  --amber:#d4922a;
  --amber-dim:rgba(212,146,42,0.15);
  --amber-glow:rgba(212,146,42,0.08);
  --text:#f0ece3;
  --text-dim:#6b6870;
  --text-mid:#9a9699;
  --green:#2d9e5f;
  --green-dim:rgba(45,158,95,0.15);
  --red:#c94040;
  --sky:#3a7cbf;
  --sky-dim:rgba(58,124,191,0.15);
  --r:8px;
  --r2:14px;
--font-display:'Playfair Display',serif;
--font-body:'Hanken Grotesk',sans-serif;
--font-mono:'JetBrains Mono',monospace;
  --shadow:0 4px 32px rgba(0,0,0,0.6);
  --shadow-sm:0 2px 12px rgba(0,0,0,0.4);
}

html{
  height:100%;
  background:var(--bg);
  overflow-y:scroll;
  scrollbar-gutter:stable;
}

body,#root{
  min-height:100%;
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:var(--font-body);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  text-rendering:geometricPrecision;
}

/* scrollbar */
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

/* ── Grain overlay ── */
.grain::after{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:999;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  opacity:0.6;mix-blend-mode:overlay;
}

/* ── Animations ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes frogPop{0%{transform:scale(1)}30%{transform:scale(1.04)}100%{transform:scale(1)}}
@keyframes habitCheck{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(45,158,95,0)}50%{box-shadow:0 0 32px 8px rgba(45,158,95,0.3)}}
@keyframes typing{0%,100%{opacity:1}50%{opacity:0}}
@keyframes drawRing{from{stroke-dashoffset:283}to{stroke-dashoffset:var(--offset)}}
@keyframes slideIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}

.fu{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) both}
.tab-fu{animation:tabFade .28s ease-out both;will-change:opacity}
@keyframes tabFade{from{opacity:0}to{opacity:1}}
.tab-clean .fu{animation:none!important}
.fu1{animation-delay:.06s}.fu2{animation-delay:.13s}.fu3{animation-delay:.20s}.fu4{animation-delay:.27s}.fu5{animation-delay:.34s}
.fi{animation:fadeIn .35s ease both}
.si{animation:slideIn .35s cubic-bezier(.22,.68,0,1.2) both}

/* ── Layout ── */
.app-shell{display:flex;flex-direction:column;height:100vh;min-height:100vh;overflow:hidden}

/* ── Top bar ── */
.topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;height:56px;
  background:rgba(7,8,10,0.92);backdrop-filter:blur(16px);
  border-bottom:1px solid var(--border);
  position:sticky;top:0;z-index:100;
  flex-shrink:0;
}
.topbar-logo{
  font-family:var(--font-display);font-size:1.5rem;font-weight:700;letter-spacing:.12em;
  color:var(--amber);cursor:pointer;user-select:none;
}
.topbar-logo span{color:var(--text-dim);font-weight:400}
.topbar-nav{display:flex;gap:2px}
.topbar-btn{
  background:none;border:none;cursor:pointer;
  font-family:var(--font-body);font-size:.73rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  padding:7px 14px;border-radius:6px;color:var(--text-mid);
  transition:all .18s;
}
.topbar-btn:hover{color:var(--text);background:var(--surface2)}
.topbar-btn.active{color:var(--amber);background:var(--amber-glow)}
.topbar-tag{
  font-family:var(--font-mono);font-size:.65rem;font-weight:600;letter-spacing:.1em;
  color:var(--amber);background:var(--amber-dim);border:1px solid rgba(212,146,42,0.3);
  border-radius:4px;padding:3px 10px;
}

/* ── Page container ── */
.page{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden}

/* ── Trust / legal pages (Project 14C) ───────────────────────────────────────
   Public Privacy / Terms / Support / AI Disclaimer pages. Own header + footer,
   warm-black MACP styling. tp-* namespace. */
.tp-wordmark{display:inline-flex;align-items:baseline;gap:9px;background:none;border:none;padding:0;cursor:pointer;text-decoration:none}
.tp-wordmark .mk{font-family:var(--font-display);font-weight:700;color:var(--amber);letter-spacing:-.01em;line-height:1}
.tp-wordmark .sy{font-family:var(--font-mono);color:#a39c92;letter-spacing:.42em;line-height:1}
.tp-root{
  position:relative;min-height:100%;
  font-family:var(--font-body);color:var(--text);
  --tp-cream:#efe7dc;--tp-amber:#e2a23a;
  background:
    radial-gradient(60% 40% at 92% -4%, rgba(226,162,58,0.08) 0%, rgba(226,162,58,0) 60%),
    linear-gradient(180deg,#0f0a05 0%,#0a0704 48%,#060403 100%);
  background-repeat:no-repeat;
}
.tp-wrap{width:100%;max-width:820px;margin:0 auto;padding:0 40px}
.tp-header{position:sticky;top:0;z-index:6;
  background:rgba(7,8,10,0.6);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);
  border-bottom:1px solid rgba(240,236,227,0.08)}
.tp-header-inner{display:flex;align-items:center;justify-content:space-between;height:66px}
.tp-back{display:inline-flex;align-items:center;gap:7px;background:none;border:none;cursor:pointer;
  font-family:var(--font-body);font-size:14px;color:var(--text-mid);transition:color .16s ease}
.tp-back:hover{color:var(--text)}
.tp-back svg{width:16px;height:16px}

.tp-main{padding:54px 0 0}
.tp-eyebrow{font-family:var(--font-mono);font-weight:500;font-size:12px;text-transform:uppercase;
  letter-spacing:.3em;color:var(--tp-amber);text-shadow:0 0 18px rgba(226,162,58,0.24);margin-bottom:18px}
.tp-title{font-family:var(--font-display);font-weight:700;font-size:clamp(34px,5vw,48px);
  line-height:1.05;letter-spacing:-.01em;color:var(--tp-cream);margin:0 0 14px}
.tp-updated{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-dim);margin-bottom:20px}
.tp-intro{font-family:var(--font-body);font-size:17px;line-height:1.6;color:#a39c92;max-width:660px;margin:0}

.tp-note{margin:26px 0 4px;padding:18px 20px;border-radius:var(--r2);
  border:1px solid rgba(226,162,58,0.28);
  background:linear-gradient(180deg,rgba(226,162,58,0.085),rgba(226,162,58,0.02));
  display:flex;gap:13px;align-items:flex-start}
.tp-note svg{width:20px;height:20px;color:var(--tp-amber);flex:none;margin-top:1px}
.tp-note p{margin:0;font-size:14.5px;line-height:1.55;color:#cfc6ba}
.tp-note strong{color:var(--tp-cream);font-weight:600}

.tp-sections{margin-top:16px}
.tp-section{padding:26px 0;border-top:1px solid var(--border)}
.tp-section:first-child{border-top:none}
.tp-h2{font-family:var(--font-display);font-weight:700;font-size:21px;color:var(--tp-cream);margin:0 0 12px;line-height:1.2}
.tp-body{font-family:var(--font-body);font-size:15.5px;line-height:1.65;color:#a39c92}
.tp-body p{margin:0 0 12px}
.tp-body p:last-child{margin-bottom:0}
.tp-body strong{color:#cfc6ba;font-weight:600}
.tp-body a{color:var(--tp-amber);text-decoration:none;border-bottom:1px solid rgba(226,162,58,0.3);transition:border-color .16s ease}
.tp-body a:hover{border-bottom-color:var(--tp-amber)}
.tp-body ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.tp-body li{position:relative;padding-left:20px}
.tp-body li::before{content:"";position:absolute;left:2px;top:9px;width:6px;height:6px;border-radius:50%;background:var(--tp-amber)}
.tp-placeholder{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}

.tp-foot{border-top:1px solid var(--border);margin-top:34px;padding:26px 0 44px;
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
.tp-foot-links{display:flex;flex-wrap:wrap;gap:22px}
.tp-foot-links a{font-family:var(--font-body);font-size:13.5px;color:var(--text-mid);cursor:pointer;text-decoration:none;transition:color .16s ease}
.tp-foot-links a:hover{color:var(--text)}
.tp-foot-links a.on{color:var(--tp-amber);cursor:default}
.tp-foot-home{font-family:var(--font-body);font-size:13.5px;color:var(--text-mid);background:none;border:none;cursor:pointer;transition:color .16s ease}
.tp-foot-home:hover{color:var(--text)}

@media (max-width:600px){
  /* header keeps its exact current gutter (frozen — logo/back untouched). Only
     the body content gets a wider horizontal inset so text sits further from
     the screen edges. .tp-main carries both classes, and its later padding
     shorthand overrides .tp-wrap's gutter for the content column only. */
  .tp-wrap{padding:0 26px}
  .tp-header-inner{height:58px}
  .tp-back span{display:none}
  .tp-main{padding:36px 36px 0}
  .tp-intro{font-size:16px}
  .tp-foot{flex-direction:column;align-items:flex-start;gap:14px}
}

/* ── AUTH SHELL ──────────────────────────────────────────────────────────────
   Full MACP-branded auth experience. MACP owns every control (see
   MacpAuthControls); Clerk's custom-flow hooks own the real auth/session/security.
   Split on desktop, stacked + thumb-friendly on mobile. */
.auth-screen{
  position:relative;z-index:200;width:100%;
  min-height:100vh;min-height:100dvh;        /* grow with content; document scrolls */
  display:grid;grid-template-columns:minmax(0,42fr) minmax(0,58fr);  /* design: 600 / 840 of 1440 */
  background:var(--bg);color:var(--text);overflow-x:clip;  /* clip, not hidden — keeps sticky preview pinned */
  animation:fadeIn .4s ease both;
}
/* Left = three vertical zones: wordmark (top) · form (centered) · footer (bottom) */
.auth-left{
  position:relative;min-width:0;
  display:flex;flex-direction:column;
  padding:54px 72px 42px;
  background:
    radial-gradient(circle at 18% 12%, rgba(224,164,59,0.045) 0%, transparent 34%),
    linear-gradient(180deg,#0a0704 0%,#050302 100%);
}
.auth-logo{
  align-self:flex-start;display:inline-flex;align-items:baseline;gap:10px;
  font-family:var(--font-display);font-size:1.55rem;font-weight:700;letter-spacing:.03em;
  color:var(--amber);background:none;border:none;cursor:pointer;padding:0;user-select:none;line-height:1;
}
.auth-logo span{
  font-family:var(--font-mono);color:var(--text-dim);font-weight:400;
  font-size:.6rem;letter-spacing:.42em;text-transform:lowercase;
}
.auth-center{margin:auto auto;width:100%;max-width:404px}   /* centers form between logo and footer */
.auth-brand{display:flex;flex-direction:column;gap:13px;width:100%}
.auth-eyebrow{
  font-family:var(--font-mono);font-size:.62rem;letter-spacing:.28em;text-transform:uppercase;
  color:var(--amber);
}
.auth-headline{
  font-family:var(--font-display);font-weight:700;line-height:1.08;letter-spacing:-.01em;
  font-size:clamp(2.4rem,3.3vw,2.95rem);color:var(--text);
}
.auth-headline em{color:var(--amber);font-style:italic}
.auth-sub{font-size:.98rem;line-height:1.55;color:var(--text-mid);font-weight:300;max-width:404px}
.auth-controls{width:100%;margin-top:28px}
.auth-foot{width:100%;margin-top:36px;display:flex;flex-direction:column;gap:16px;align-items:center}
.auth-legal{font-size:.76rem;color:var(--text-dim);line-height:1.6;text-align:center;max-width:380px}
.auth-legal u{text-decoration:underline;text-underline-offset:2px;cursor:default}
.auth-foot-rule{width:100%;height:1px;background:var(--border)}
.auth-switch{font-size:.88rem;color:var(--text-mid);text-align:center}
.auth-switch button{
  background:none;border:none;cursor:pointer;color:var(--amber);font-weight:700;
  font-family:var(--font-body);font-size:.88rem;padding:0 0 0 4px;
}
.auth-switch button:hover{text-decoration:underline}

/* ── CUSTOM MACP AUTH CONTROLS ────────────────────────────────────────────────
   MACP fully owns this UI. Every control drives Clerk's REAL backend through its
   custom-flow hooks (useSignIn / useSignUp / useClerk) — no embedded Clerk card. */
.macp-auth{display:flex;flex-direction:column;gap:12px;width:100%}

/* Provider buttons — dark + bordered so the eye lands on the amber CTA below */
.macp-oauth{
  display:flex;align-items:center;justify-content:center;gap:12px;width:100%;
  min-height:54px;padding:0 18px;position:relative;
  background:var(--surface2);color:var(--text);
  border:1px solid var(--border2);border-radius:13px;
  font-family:var(--font-body);font-size:1rem;font-weight:500;letter-spacing:.01em;
  cursor:pointer;transition:border-color .18s,background-color .18s,transform .1s;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.03);
  -webkit-tap-highlight-color:transparent;
}
.macp-oauth:hover{background:#1b1c1f;border-color:rgba(212,146,42,0.45)}
.macp-oauth:active{transform:translateY(1px)}
.macp-oauth:disabled{opacity:.55;cursor:wait}
.macp-oauth svg{flex:none}
.macp-oauth-badge{
  position:absolute;right:14px;font-family:var(--font-mono);font-size:.55rem;letter-spacing:.16em;
  color:var(--text-dim);border:1px solid var(--border2);border-radius:5px;padding:3px 6px;text-transform:uppercase;
}

/* Mono divider */
.macp-divider{display:flex;align-items:center;gap:16px;margin:4px 0 2px;color:var(--text-dim)}
.macp-divider::before,.macp-divider::after{content:"";flex:1;height:1px;background:var(--border)}
.macp-divider span{font-family:var(--font-mono);font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap}

/* Fields — design uses soft sentence-case labels (not mono kickers) above each input */
.macp-field{display:flex;flex-direction:column;gap:9px}
.macp-label{font-family:var(--font-body);font-size:.84rem;font-weight:500;letter-spacing:.01em;color:var(--text-mid)}
.macp-input{
  width:100%;min-height:54px;padding:0 16px;
  background:var(--surface);color:var(--text);
  border:1px solid var(--border2);border-radius:13px;
  font-family:var(--font-body);font-size:1rem;outline:none;
  transition:border-color .18s,box-shadow .18s;
}
.macp-input::placeholder{color:var(--text-dim)}
.macp-input:focus{border-color:rgba(212,146,42,0.6);box-shadow:0 0 0 3px rgba(212,146,42,0.14)}
/* Keep inputs dark in every state — including browser autofill (no white flash) */
.macp-input:-webkit-autofill,
.macp-input:-webkit-autofill:hover,
.macp-input:-webkit-autofill:focus,
.macp-input:-webkit-autofill:active{
  -webkit-text-fill-color:var(--text);caret-color:var(--text);
  -webkit-box-shadow:0 0 0 1000px var(--surface) inset!important;
  box-shadow:0 0 0 1000px var(--surface) inset!important;
  transition:background-color 9999s ease-in-out 0s;
}
.macp-code{text-align:center;font-family:var(--font-mono);font-size:1.3rem;letter-spacing:.5em;padding-left:.5em}

/* Segmented email-code (OTP) — real <input> sits transparent over six display cells */
.macp-otp{position:relative}
.macp-otp-input{
  position:absolute;inset:0;width:100%;height:100%;z-index:2;
  opacity:0;border:none;background:none;color:transparent;caret-color:transparent;cursor:text;
  font-size:16px; /* keeps iOS from zooming on focus */
}
.macp-otp-cells{display:flex;gap:10px}
.macp-otp-cell{
  flex:1;height:58px;border-radius:12px;border:1px solid var(--border2);background:var(--surface);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--font-mono);font-size:1.45rem;font-weight:500;color:var(--text);
  transition:border-color .15s,box-shadow .15s;
}
.macp-otp-cell.active{border-color:var(--amber);box-shadow:0 0 0 3px rgba(212,146,42,0.14)}
.macp-otp-cell.err{border-color:var(--red);color:var(--red)}
.macp-otp-caret{width:2px;height:26px;background:var(--amber);animation:macpBlink 1.1s steps(1) infinite}
@keyframes macpBlink{0%,50%{opacity:1}50.01%,100%{opacity:0}}
.macp-pw-wrap{position:relative}
.macp-pw-wrap .macp-input{padding-right:46px}
.macp-pw-toggle{
  position:absolute;right:7px;top:50%;transform:translateY(-50%);
  width:36px;height:36px;display:flex;align-items:center;justify-content:center;
  background:none;border:none;color:var(--text-mid);cursor:pointer;border-radius:6px;transition:color .15s;
}
.macp-pw-toggle:hover{color:var(--text)}

/* Amber CTA — the one filled element */
.macp-cta{
  width:100%;min-height:54px;margin-top:4px;
  display:flex;align-items:center;justify-content:center;gap:10px;
  background:var(--amber);color:#1a1408;border:none;border-radius:13px;
  font-family:var(--font-body);font-size:1.02rem;font-weight:700;letter-spacing:.02em;
  cursor:pointer;transition:transform .1s,box-shadow .18s,background-color .18s;
  box-shadow:0 10px 26px -10px rgba(212,146,42,0.6);
}
.macp-cta:hover{background:#dc9c36;box-shadow:0 12px 30px -10px rgba(212,146,42,0.72)}
.macp-cta:active{transform:translateY(1px)}
.macp-cta:disabled{opacity:.65;cursor:not-allowed;box-shadow:0 0 18px rgba(212,146,42,0.18)}
.macp-cta-spin{width:15px;height:15px;border:2px solid rgba(7,8,10,0.35);border-top-color:#07080a;border-radius:50%;animation:spin .7s linear infinite}

/* Custom inline error (matches MACP error reference, never breaks layout) */
.macp-auth-err{
  display:flex;gap:9px;align-items:flex-start;
  background:rgba(201,64,64,0.08);border:1px solid rgba(201,64,64,0.38);
  border-radius:var(--r);padding:11px 13px;color:var(--text);font-size:.85rem;line-height:1.45;
}
.macp-auth-err svg{flex:none;color:var(--red);margin-top:1px}

/* Verify (email-code) step */
.macp-back{
  align-self:flex-start;background:none;border:none;color:var(--text-mid);cursor:pointer;
  font-family:var(--font-mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;padding:2px 0;
}
.macp-back:hover{color:var(--text)}
.macp-otp-hint{font-size:.9rem;color:var(--text-mid);line-height:1.55}
.macp-otp-hint b{color:var(--text);font-weight:600}
.macp-resend{font-size:.82rem;color:var(--text-mid);text-align:center;margin-top:2px}
.macp-auth-link{background:none;border:none;color:var(--amber);font-weight:600;cursor:pointer;font-family:var(--font-body);font-size:inherit;padding:0}
.macp-auth-link:hover{text-decoration:underline}
.macp-auth-link:disabled{opacity:.6;cursor:wait;text-decoration:none}

/* Loading skeleton (while Clerk initializes) — no Clerk-button pop, no FOUC */
.macp-skel{border-radius:var(--r);background:linear-gradient(90deg,var(--surface2) 25%,#1d1e22 50%,var(--surface2) 75%);background-size:200% 100%;animation:macpShimmer 1.4s ease-in-out infinite}
@keyframes macpShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* Clerk's real bot-check mounts here when sign-up requires it (invisible until used) */
.macp-auth #clerk-captcha{display:flex;justify-content:center;max-width:100%;overflow:hidden}
.macp-auth #clerk-captcha:not(:empty){margin-top:6px}
.macp-auth #clerk-captcha iframe,
.macp-auth #clerk-captcha > *{max-width:100%}

/* Right preview — exact Claude Design right panel */
.auth-right{
--amber:#e0a43b;
--amber-line:rgba(224,164,59,0.38);
--green:#4aa56b;
--text-faint:rgba(240,236,227,0.42);
--bg-raise:#0c0d10;
--surface-1:#0d0f12;
--surface-2:#121316;

  position:relative;
  flex:1 1 0;
  min-width:0;
  height:100vh;
  height:100dvh;
  max-height:100dvh;
  overflow:hidden;
  padding:64px 60px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  border-left:1px solid var(--border);
  background:linear-gradient(160deg,#0d0a07 0%,#050403 100%);
}

.auth-right::after{
  content:"";
  position:absolute;
  top:-180px;
  right:-120px;
  width:640px;
  height:640px;
  border-radius:50%;
  pointer-events:none;
  background:radial-gradient(circle,rgba(224,164,59,0.22) 0%,rgba(224,164,59,0.08) 34%,rgba(224,164,59,0) 68%);
  filter:blur(8px);
}

.auth-right::before{
  content:"";
  position:absolute;
  inset:0;
  opacity:.5;
  pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,0.035) 1px,transparent 1px);
  background-size:26px 26px;
}

.auth-right>*{
  position:relative;
  z-index:1;
}

.auth-pv-head{
  position:relative;
  max-width:440px;
}

.auth-pv-eyebrow{
  font-family:'JetBrains Mono',monospace;
  font-size:11px;
  letter-spacing:3.5px;
  text-transform:uppercase;
  color:var(--amber);
}

.auth-pv-headline{
  font-family:'Playfair Display',serif;
  font-weight:600;
  font-size:38px;
  line-height:1.12;
  color:var(--text);
  margin:16px 0 0;
  max-width:520px;
  letter-spacing:-0.015em;
}

.auth-pv-headline em{
  color:var(--amber);
  font-style:italic;
}

.auth-pv-tilt{
  position:relative;
  display:flex;
  justify-content:center;
  margin:22px 0 28px;
}

.auth-pv{
  width:560px;
  max-width:100%;
  border-radius:18px;
  overflow:hidden;
  background:var(--bg-raise);
  border:1px solid var(--border);
  box-shadow:0 40px 80px -30px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.02);
  transform:perspective(1600px) rotateY(-7deg) rotateX(2deg) scale(1.10);
  transform-origin:center;
}

.apv-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:14px 18px;
  border-bottom:1px solid var(--border);
}

.apv-logo{
  display:flex;
  align-items:baseline;
  gap:6.2px;
}

.apv-logo::first-letter{
  color:var(--amber);
}

.apv-logo{
  font-family:'Playfair Display',serif;
  font-weight:700;
  font-size:16.12px;
  letter-spacing:.62px;
  color:var(--amber);
  line-height:1;
}

.apv-logo span{
  font-family:'JetBrains Mono',monospace;
  font-size:7.44px;
  letter-spacing:2.48px;
  text-transform:lowercase;
  color:var(--text-faint);
  font-weight:400;
}

.apv-nav{
  display:flex;
  gap:18px;
  align-items:center;
}

.apv-nav span{
  font-family:'JetBrains Mono',monospace;
  font-size:9.5px;
  letter-spacing:1px;
  text-transform:uppercase;
  color:var(--text-faint);
}

.apv-nav .on{
  color:var(--amber);
}

.apv-body{
  padding:18px;
}

.apv-greetrow{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:16px;
}

.apv-greet{
  font-family:'Playfair Display',serif;
  font-size:24px;
  font-weight:600;
  color:var(--text);
  line-height:1.1;
}

.apv-greet em{
  color:var(--amber);
  font-style:normal;
}

.apv-date{
  font-family:'JetBrains Mono',monospace;
  font-size:9px;
  letter-spacing:1.5px;
  color:var(--text-faint);
  text-transform:uppercase;
  margin-top:7px;
}

.apv-tier{
  font-family:'JetBrains Mono',monospace;
  font-size:9px;
  letter-spacing:1px;
  color:var(--amber);
  text-transform:uppercase;
  border:1px solid var(--amber-line);
  border-radius:8px;
  padding:7px 11px;
  display:flex;
  align-items:center;
  gap:6px;
  white-space:nowrap;
}

.apv-tier span{
  width:6px;
  height:6px;
  border-radius:50%;
  background:var(--amber);
  display:inline-block;
}

.apv-plan{
  padding:16px;
  border-radius:13px;
  background:#0b0d10;
  border:1px solid rgba(255,255,255,0.06);
  margin-bottom:12px;
}

.apv-plan-top{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
}

.apv-kicker{
  font-family:'JetBrains Mono',monospace;
  font-size:9px;
  letter-spacing:1.5px;
  color:var(--amber);
  text-transform:uppercase;
  margin-bottom:6px;
}

.apv-badge{
  font-family:'JetBrains Mono',monospace;
  font-size:8.5px;
  letter-spacing:1px;
  color:var(--amber);
  text-transform:uppercase;
  border:1px solid var(--amber-line);
  border-radius:999px;
  padding:5px 10px;
}

.apv-plan-name{
  font-family:'Playfair Display',serif;
  font-size:19px;
  font-weight:600;
  color:var(--text);
  margin:0;
}

.apv-plan-meta{
  font-family:'Hanken Grotesk',sans-serif;
  font-size:11.5px;
  color:var(--text-mid);
  margin-top:8px;
}

.apv-stats{
  display:flex;
  gap:10px;
  margin-bottom:12px;
}

.apv-stat{
  flex:1;
  padding:14px 15px;
  border-radius:13px;
  background:#0b0d10;
  border:1px solid rgba(255,255,255,0.06);
}

.apv-stat-lbl{
  font-family:'JetBrains Mono',monospace;
  font-size:9px;
  letter-spacing:1.5px;
  color:var(--text-faint);
  text-transform:uppercase;
  margin-bottom:12px;
}

.apv-stat-val{
  display:flex;
  align-items:baseline;
  gap:4px;
  font-family:'Playfair Display',serif;
  font-size:30px;
  font-weight:600;
  color:var(--text);
  line-height:1;
}

.apv-stat-val small{
  font-family:'Hanken Grotesk',sans-serif;
  font-size:13px;
  color:var(--text-mid);
  font-weight:400;
}

.apv-stat-foot{
  font-family:'Hanken Grotesk',sans-serif;
  font-size:12px;
  color:var(--text-mid);
  margin-top:8px;
}

.apv-stat-foot.g{
  color:var(--green);
}

.apv-stat-foot.a{
  color:var(--amber);
}

.apv-frog{
  padding:15px;
  border-radius:13px;
  background:linear-gradient(180deg,rgba(74,165,107,0.13),rgba(74,165,107,0.035));
  border:1px solid rgba(74,165,107,0.26);
}

.apv-frog-lbl{
  font-family:'JetBrains Mono',monospace;
  font-size:9px;
  letter-spacing:1.5px;
  color:var(--green);
  text-transform:uppercase;
  margin-bottom:9px;
}

.apv-frog-name{
  font-family:'Playfair Display',serif;
  font-size:17px;
  font-weight:600;
  color:var(--text);
  margin-bottom:12px;
}

.apv-frog-row{
  display:flex;
  gap:9px;
}

.apv-frog-cta{
  background:var(--green);
  color:#08130c;
  font-family:'Hanken Grotesk',sans-serif;
  font-size:12.5px;
  font-weight:600;
  padding:9px 16px;
  border-radius:9px;
}

.apv-frog-ghost{
  border:1px solid var(--border);
  color:var(--text-mid);
  font-family:'Hanken Grotesk',sans-serif;
  font-size:12.5px;
  padding:9px 16px;
  border-radius:9px;
}

.auth-values{
  position:relative;
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:28px;
}

.auth-value{
  display:flex;
  gap:14px;
  align-items:flex-start;
}

.auth-value-ic{
  flex-shrink:0;
  width:40px;
  height:40px;
  border-radius:11px;
  border:1px solid var(--amber-line);
  background:rgba(224,164,59,0.07);
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--amber);
}

.auth-value-t{
  font-family:'Hanken Grotesk',sans-serif;
  font-size:15.5px;
  font-weight:600;
  color:var(--text);
  margin-bottom:3px;
}

.auth-value-d{
  font-family:'Hanken Grotesk',sans-serif;
  font-size:13.5px;
  line-height:1.5;
  color:var(--text-dim);
}

@media (max-width:880px){
  /* Mobile auth: compact centered module. The controls + footer still fuse into
     one card, but the card no longer spans full width and the internal rhythm
     scales down with it. */
  .auth-screen{grid-template-columns:1fr;display:block;min-height:100vh;min-height:100dvh}
  .auth-right{display:none}
  .auth-left{
    justify-content:flex-start;min-height:100vh;min-height:100dvh;
    padding:max(18px,env(safe-area-inset-top)) 22px max(22px,env(safe-area-inset-bottom));
  }
  .auth-logo{margin-bottom:0;font-size:1.5rem}
  .auth-center{display:flex;flex-direction:column;align-items:center;width:100%;max-width:none;margin:0}
  .auth-brand{
    margin:clamp(64px,10.5vh,92px) auto 0;
    gap:12px;max-width:356px;text-align:center;align-items:center;
  }
  .auth-headline{
    font-size:clamp(3.02rem,12.3vw,3.58rem);
    line-height:.98;font-weight:600;letter-spacing:-.035em;
  }
  .auth-sub{font-size:.94rem;line-height:1.45;max-width:312px;margin:0 auto}

  .auth-controls,
  .auth-foot{
    width:min(322px,calc(100vw - 44px));
    max-width:322px;
    margin-left:auto;
    margin-right:auto;
    background:var(--surface);
    border-color:var(--border2);
  }
  .auth-controls{
    margin-top:clamp(42px,5.6vh,56px);
    padding:22px 20px 3px;
    border:1px solid var(--border2);
    border-bottom:none;
    border-radius:24px 24px 0 0;
  }
  .auth-foot{
    margin-top:0;
    margin-bottom:18px;
    padding:12px 20px 15px;
    gap:10px;
    border:1px solid var(--border2);
    border-top:none;
    border-radius:0 0 24px 24px;
  }

  .macp-auth{gap:10px}
  .macp-field{gap:7px}
  .macp-label{font-size:.78rem}
  .macp-oauth,
  .macp-cta,
  .macp-input{
    min-height:48px;
    border-radius:11px;
    font-size:.94rem;
  }
  .macp-oauth{gap:10px;padding:0 14px}
  .macp-input{padding:0 14px}
  .macp-pw-wrap .macp-input{padding-right:42px}
  .macp-pw-toggle{right:6px;width:32px;height:32px}
  .macp-cta{margin-top:3px;gap:9px;box-shadow:0 8px 22px -10px rgba(212,146,42,0.58)}
  .macp-divider{gap:13px;margin:2px 0 1px}
  .macp-divider span{font-size:.52rem;letter-spacing:.18em}
  .macp-auth #clerk-captcha{
    align-self:center;
    width:100%;
    min-height:0;
    margin:0 auto -12px;
    overflow:visible;
  }
  .macp-auth #clerk-captcha:not(:empty){margin-top:0}
  .macp-auth #clerk-captcha iframe,
  .macp-auth #clerk-captcha > *{
    max-width:none!important;
    transform:scale(.86);
    transform-origin:top center;
  }
  .auth-legal{font-size:.69rem;line-height:1.45;max-width:266px}
  .auth-switch{font-size:.78rem}
  .auth-switch button{font-size:.78rem}
  .macp-otp-cells{gap:8px}
  .macp-otp-cell{height:48px;border-radius:10px;font-size:1.24rem}
}

/* ── POST-AUTH "SETTING UP YOUR SYSTEM…" ── */
.setup-wrap{
  position:fixed;inset:0;z-index:9999;background:var(--bg);
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
  padding:24px;gap:22px;
  background-image:radial-gradient(ellipse 60% 40% at 50% 18%,rgba(212,146,42,0.08) 0%,transparent 60%);
  animation:fadeIn .35s ease both;
}
.setup-pill{
  font-family:var(--font-mono);font-size:.7rem;letter-spacing:.42em;text-transform:uppercase;color:var(--amber);
  border:1px solid rgba(212,146,42,0.35);border-radius:99px;padding:9px 26px;
}
.setup-title{font-family:var(--font-display);font-size:clamp(2.4rem,5vw,3.4rem);font-weight:700;line-height:1.0;color:var(--text)}
.setup-title em{color:var(--amber);font-style:italic}
.setup-sub{font-size:.98rem;color:var(--text-mid);font-weight:300}
.setup-bar{width:min(420px,72vw);height:3px;background:var(--border);border-radius:99px;overflow:hidden;margin-top:6px}
.setup-bar-fill{height:100%;background:var(--amber);border-radius:99px;width:14%;animation:setupFill 1.7s cubic-bezier(.4,0,.2,1) forwards}
@keyframes setupFill{0%{width:14%}55%{width:66%}100%{width:82%}}
.setup-steps{display:flex;flex-direction:column;gap:13px;align-items:flex-start;margin-top:10px}
.setup-step{display:flex;align-items:center;gap:12px;font-family:var(--font-mono);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase}
.setup-step.done{color:var(--text)}
.setup-step.pending{color:var(--text-dim)}
.setup-check{color:var(--green);font-size:.9rem}
.setup-ring{width:14px;height:14px;border:1.5px solid var(--border2);border-top-color:var(--amber);border-radius:50%;animation:spin .8s linear infinite}

/* ── MACP TOAST (replaces native alert) ── */
.macp-toast{
  position:fixed;left:50%;bottom:max(26px,env(safe-area-inset-bottom));transform:translateX(-50%);
  z-index:10000;max-width:min(440px,calc(100vw - 32px));
  display:flex;gap:12px;align-items:flex-start;
  background:rgba(15,16,19,0.97);backdrop-filter:blur(14px);
  border:1px solid var(--border2);border-left:3px solid var(--red);border-radius:var(--r2);
  padding:14px 18px;box-shadow:var(--shadow);
  animation:fadeUp .3s cubic-bezier(.22,.68,0,1.2) both;
}
.macp-toast.ok{border-left-color:var(--green)}
.macp-toast-ic{flex-shrink:0;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;background:var(--red);color:#fff;margin-top:1px}
.macp-toast.ok .macp-toast-ic{background:var(--green)}
.macp-toast-body{display:flex;flex-direction:column;gap:3px}
.macp-toast-title{font-family:var(--font-mono);font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-mid)}
.macp-toast-msg{font-size:.86rem;color:var(--text);line-height:1.45}
.macp-toast-x{margin-left:auto;background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1rem;line-height:1;padding:2px 4px}

/* ── Wizard ── */
.wiz{max-width:620px;margin:0 auto;padding:52px 24px 100px}
.wiz-step{font-family:var(--font-mono);font-size:.63rem;letter-spacing:.18em;text-transform:uppercase;color:var(--amber);margin-bottom:10px}
.wiz-title{font-family:var(--font-display);font-size:2.8rem;font-weight:700;color:var(--text);line-height:1.05;margin-bottom:8px}
.wiz-sub{font-size:.92rem;color:var(--text-mid);margin-bottom:36px;line-height:1.6}
.prog-track{height:3px;background:var(--border);border-radius:99px;margin-bottom:44px;overflow:hidden}
.prog-fill{height:100%;background:var(--amber);border-radius:99px;transition:width .5s cubic-bezier(.4,0,.2,1)}

/* form elements */
.fgrp{display:flex;flex-direction:column;gap:22px}
.field{display:flex;flex-direction:column;gap:8px}
.field label{font-size:.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-mid)}
.field input,.field select,.field textarea{
  padding:13px 16px;background:var(--surface2);border:1px solid var(--border2);border-radius:var(--r);
  font-family:var(--font-body);font-size:.95rem;color:var(--text);
  outline:none;transition:border-color .18s,box-shadow .18s;
}
.field input:focus,.field select:focus,.field textarea:focus{
  border-color:rgba(212,146,42,0.6);box-shadow:0 0 0 3px rgba(212,146,42,0.08);
}
.field textarea{resize:vertical;min-height:88px;line-height:1.6}
.field select option{background:var(--surface2)}
.field-hint{font-size:.73rem;color:var(--text-dim);line-height:1.5}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}

/* chips */
.chips{display:flex;flex-wrap:wrap;gap:9px}
.chip{
  padding:9px 16px;border:1px solid var(--border2);border-radius:99px;
  font-size:.8rem;font-weight:500;cursor:pointer;color:var(--text-mid);background:var(--surface2);
  transition:all .16s;user-select:none;
}
.chip:hover{border-color:var(--border2);color:var(--text);background:var(--surface)}
.chip.on{border-color:rgba(212,146,42,0.7);background:var(--amber-dim);color:var(--amber);font-weight:600}

/* range */
.range-wrap{display:flex;flex-direction:column;gap:10px}
.range-wrap input[type=range]{width:100%;accent-color:var(--amber);cursor:pointer}
.range-labels{display:flex;justify-content:space-between;font-size:.73rem;color:var(--text-dim)}
.range-val{font-family:var(--font-mono);font-size:.8rem;color:var(--amber);font-weight:600}

/* buttons */
.btn-row{display:flex;justify-content:flex-end;gap:12px;margin-top:36px}
.btn{
  padding:13px 28px;border-radius:var(--r);border:none;cursor:pointer;
  font-family:var(--font-body);font-size:.88rem;font-weight:700;letter-spacing:.04em;
  transition:all .2s;
}
.btn-ghost{background:var(--surface2);color:var(--text-mid);border:1px solid var(--border2)}
.btn-ghost:hover{color:var(--text);border-color:var(--border2)}
.btn-main{background:var(--surface2);color:var(--text);border:1px solid var(--border2)}
.btn-main:hover{background:var(--border2);color:var(--text)}
.btn-amber{background:var(--amber);color:#07080a;box-shadow:0 0 24px rgba(212,146,42,0.3)}
.btn-amber:hover{transform:translateY(-1px);box-shadow:0 0 36px rgba(212,146,42,0.4)}
.btn-amber:active{transform:translateY(0)}
.btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important}

/* ── AI generation ── */
.gen-box{
  margin-top:32px;background:var(--surface);border:1px solid var(--border2);
  border-radius:var(--r2);overflow:hidden;
}
.gen-header{
  padding:20px 24px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:12px;
}
.gen-dot{width:8px;height:8px;border-radius:50%;background:var(--amber);animation:pulse 1.6s ease-in-out infinite}
.gen-title{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--amber)}
.gen-body{padding:24px;max-height:420px;overflow-y:auto}
.gen-text{font-size:.9rem;line-height:1.85;color:var(--text-mid);white-space:pre-wrap}
.gen-text .gh{
  font-family:var(--font-display);font-size:1.1rem;font-weight:700;
  color:var(--amber);margin:20px 0 6px;display:block;letter-spacing:.02em;
}
.gen-cursor{display:inline-block;width:2px;height:14px;background:var(--amber);animation:typing .7s step-end infinite;margin-left:2px;vertical-align:middle}
.gen-spinner{display:flex;align-items:center;gap:12px;padding:8px 0;color:var(--text-dim);font-size:.85rem}
.gen-preview{display:grid;gap:18px}
.gen-preview-copy{font-size:.95rem;line-height:1.8;color:var(--text-mid)}
.gen-preview-copy p{margin:0 0 12px}
.gen-preview-copy p:last-child{margin-bottom:0}
.gen-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gen-preview-card{
  padding:16px;border:1px solid var(--border);background:var(--surface2);
  border-radius:var(--r);overflow:hidden;
}
.gen-preview-label{
  font-family:var(--font-mono);font-size:.62rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--amber);margin-bottom:10px;
}
.gen-preview-title{
  font-family:var(--font-display);font-size:1.1rem;line-height:1.25;
  color:var(--text);font-weight:700;
}
.gen-preview-note{margin-top:8px;color:var(--text-mid);font-size:.86rem;line-height:1.6}
.gen-preview-list{display:grid;gap:10px}
.gen-preview-habit{
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;
  padding-bottom:10px;border-bottom:1px solid var(--border);
}
.gen-preview-habit:last-child{padding-bottom:0;border-bottom:0}
.gen-preview-habit span{color:var(--green)}
.gen-preview-habit strong{color:var(--text);font-size:.9rem}
.gen-preview-habit em{
  font-style:normal;font-family:var(--font-mono);font-size:.6rem;
  letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);
}
.spinner{width:18px;height:18px;border:2px solid var(--border2);border-top-color:var(--amber);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}

/* ── Dashboard ── */
.dash{max-width:1140px;margin:0 auto;padding:36px 24px 100px}
.dash-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px}
.dash-greet{font-family:var(--font-display);font-size:2.4rem;font-weight:700;line-height:1;letter-spacing:-.01em}
.dash-greet span{color:var(--amber)}
.dash-date{font-family:var(--font-mono);font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-top:8px}
.tier-pill{
  display:flex;align-items:center;gap:9px;
  background:var(--surface);border:1px solid var(--border2);border-radius:99px;padding:9px 18px;
}
.tier-pip{width:8px;height:8px;border-radius:50%}
.tier-name{font-family:var(--font-mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-mid)}
.tier-week{font-family:var(--font-mono);font-size:.65rem;color:var(--text-dim)}

/* stats strip */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);padding:18px 20px}
.stat-lbl{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px}
.stat-val{font-family:var(--font-display);font-size:2.6rem;font-weight:700;line-height:1;color:var(--text)}
.stat-unit{font-size:.78rem;color:var(--text-dim);margin-left:4px;font-family:var(--font-body)}
.stat-note{font-size:.72rem;margin-top:5px;color:var(--text-dim)}
.stat-note.pos{color:var(--green)}

.current-plan-card{
  margin-bottom:16px;
  border-color:rgba(212,146,42,.18);
  background:linear-gradient(135deg,rgba(212,146,42,.045),rgba(255,255,255,.014));
}

.current-plan-body{
  padding:16px 20px;
}

.current-plan-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
}

.current-plan-eyebrow{
  color:var(--amber);
  font-family:var(--font-mono);
  font-size:.56rem;
  font-weight:700;
  letter-spacing:.13em;
  text-transform:uppercase;
  margin-bottom:4px;
}

.current-plan-title{
  color:var(--text);
  font-family:var(--font-display);
  font-size:1rem;
  font-weight:700;
  line-height:1.1;
}

.current-plan-badge{
  flex:0 0 auto;
  border:1px solid rgba(212,146,42,.32);
  border-radius:999px;
  color:var(--amber);
  background:rgba(212,146,42,.07);
  font-family:var(--font-mono);
  font-size:.56rem;
  font-weight:700;
  letter-spacing:.09em;
  text-transform:uppercase;
  padding:6px 9px;
}

.current-plan-meta-line{
  display:flex;
  flex-wrap:wrap;
  gap:8px 14px;
  color:var(--text-dim);
  font-size:.76rem;
  line-height:1.45;
}

.current-plan-meta-item{
  min-width:0;
}

.current-plan-meta-label{
  color:var(--text-dim);
  font-family:var(--font-mono);
  font-size:.56rem;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
  margin-right:6px;
}

.current-plan-meta-value{
  color:var(--text);
  font-weight:700;
  overflow-wrap:anywhere;
}

/* dash grid */
.dgrid{display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start}
.dleft{display:flex;flex-direction:column;gap:16px}
.dright{display:flex;flex-direction:column;gap:16px;position:sticky;top:72px}

/* cards */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden}
.card-hd{
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;border-bottom:1px solid var(--border);
}
.card-hd-l{display:flex;align-items:center;gap:10px}
.card-icon{font-size:1rem;line-height:1}
.card-title{font-family:var(--font-mono);font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--text-mid)}
.card-body{padding:20px}
.card-action{
  font-family:var(--font-mono);font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;
  color:var(--text-dim);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:4px;
  transition:all .15s;
}
.card-action:hover{color:var(--amber);background:var(--amber-glow)}

/* energy check-in */
.checkin-row{display:flex;gap:8px;flex-wrap:wrap}
.energy-btn{
  padding:8px 16px;border-radius:99px;border:1px solid var(--border2);
  font-size:.8rem;cursor:pointer;background:var(--surface2);color:var(--text-dim);
  transition:all .16s;font-family:var(--font-body);font-weight:500;
}
.energy-btn:hover{border-color:var(--border2);color:var(--text)}
.energy-btn.sel{font-weight:600}

/* frog */
.frog-card{background:linear-gradient(135deg,#091410,#060e0a);border-color:#152219}
.frog-hd{padding:16px 20px;border-bottom:1px solid #152219;display:flex;align-items:center;justify-content:space-between}
.frog-tag{font-family:var(--font-mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#3d9e6a}
.frog-body{padding:20px}
.frog-task{font-family:var(--font-display);font-size:1.5rem;font-weight:700;line-height:1.2;color:var(--text);margin-bottom:10px}
.frog-why{font-size:.83rem;color:#5aa870;line-height:1.6;margin-bottom:20px}
.frog-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.frog-done-btn{
  padding:11px 24px;background:var(--green);color:#fff;border:none;border-radius:var(--r);
  font-weight:700;font-size:.85rem;cursor:pointer;transition:all .2s;
}
.frog-done-btn:hover{background:#38b870;transform:translateY(-1px)}
.frog-done-btn.done{background:rgba(45,158,95,0.2);color:var(--green);text-decoration:line-through;cursor:default;transform:none}
.focus-btn{
  padding:11px 20px;background:var(--surface2);border:1px solid #152219;border-radius:var(--r);
  font-weight:600;font-size:.82rem;cursor:pointer;color:#5aa870;transition:all .2s;
  font-family:var(--font-body);
}
.focus-btn:hover{border-color:#2d9e5f;background:rgba(45,158,95,0.08)}

/* focus mode overlay */
.focus-overlay{
  position:fixed;inset:0;background:#04090f;z-index:200;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:32px;
}
.focus-label{font-family:var(--font-mono);font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:#3d9e6a}
.focus-task{font-family:var(--font-display);font-size:clamp(1.8rem,5vw,3.2rem);font-weight:700;color:var(--text);max-width:640px;text-align:center;line-height:1.15}
.focus-timer{font-family:var(--font-mono);font-size:4rem;font-weight:600;color:var(--green);letter-spacing:.08em}
.focus-controls{display:flex;gap:14px}
.focus-ctrl{
  padding:12px 28px;border-radius:var(--r);font-weight:700;font-size:.88rem;cursor:pointer;
  font-family:var(--font-body);transition:all .2s;
}
.focus-start{background:var(--green);color:#fff;border:none}
.focus-start:hover{background:#38b870}
.focus-exit{background:var(--surface2);color:var(--text-dim);border:1px solid var(--border2)}
.focus-exit:hover{color:var(--text)}
.focus-done{background:rgba(45,158,95,0.2);color:var(--green);border:1px solid rgba(45,158,95,0.4);font-weight:700;cursor:pointer;padding:12px 28px;border-radius:var(--r);font-family:var(--font-body);font-size:.88rem;transition:all .2s}
.focus-done:hover{background:var(--green);color:#fff}
.focus-ring-wrap{position:relative;width:140px;height:140px}
.focus-ring-wrap svg{transform:rotate(-90deg)}
.focus-ring-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:1.4rem;font-weight:600;color:var(--green)}

/* habits */
.habit-list{display:flex;flex-direction:column;gap:0}
.habit-row{
  display:flex;align-items:center;gap:14px;
  padding:14px 0;border-bottom:1px solid var(--border);
  transition:background .15s;
}
.habit-row:last-child{border-bottom:none}
.habit-row:hover{background:rgba(255,255,255,0.015);margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:6px}
.hcheck{
  width:22px;height:22px;border-radius:6px;border:1.5px solid var(--border2);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .18s;font-size:.8rem;
}
.hcheck:hover{border-color:var(--amber)}
.hcheck.done{background:var(--green);border-color:var(--green);color:#fff;animation:habitCheck .3s ease}
.hname{flex:1;font-size:.9rem;font-weight:500;color:var(--text);transition:color .18s}
.hname.done{color:var(--text-dim);text-decoration:line-through;text-decoration-color:rgba(107,104,112,0.5)}
.htag{font-family:var(--font-mono);font-size:.6rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:4px;flex-shrink:0}
.htag-morning{background:rgba(212,146,42,0.12);color:#c9961a}
.htag-work{background:rgba(58,124,191,0.12);color:#5a9fd4}
.htag-health{background:rgba(45,158,95,0.12);color:#4abe80}
.htag-evening{background:rgba(107,104,112,0.12);color:var(--text-dim)}
.htag-business{background:rgba(201,82,82,0.12);color:#d47070}
.hdel{background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:.85rem;opacity:0;transition:opacity .15s;padding:2px 6px;border-radius:4px}
.habit-row:hover .hdel{opacity:1}
.hdel:hover{color:var(--red);background:rgba(201,82,82,0.1)}

/* add habit */
.add-habit-row{display:flex;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
.add-habit-input{
  flex:1;padding:10px 14px;background:var(--surface2);border:1px solid var(--border2);
  border-radius:var(--r);font-family:var(--font-body);font-size:.88rem;color:var(--text);outline:none;
  transition:border-color .18s;
}
.add-habit-input:focus{border-color:rgba(212,146,42,0.5)}
.add-habit-input::placeholder{color:var(--text-dim)}
.add-habit-select{
  padding:10px 12px;background:var(--surface2);border:1px solid var(--border2);border-radius:var(--r);
  font-family:var(--font-body);font-size:.82rem;color:var(--text-mid);outline:none;cursor:pointer;
}
.add-habit-btn{
  padding:10px 18px;background:var(--amber-dim);border:1px solid rgba(212,146,42,0.4);
  border-radius:var(--r);color:var(--amber);font-weight:700;font-size:.82rem;cursor:pointer;
  transition:all .18s;font-family:var(--font-body);white-space:nowrap;
}
.add-habit-btn:hover{background:rgba(212,146,42,0.25)}

/* progress ring */
.ring-wrap{display:flex;flex-direction:column;align-items:center;padding:20px}
.ring-svg{transform:rotate(-90deg);overflow:visible}
.ring-bg{fill:none;stroke:var(--border);stroke-width:8}
.ring-fg{fill:none;stroke:var(--amber);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)}
.ring-center{text-align:center;margin-top:12px}
.ring-pct{font-family:var(--font-display);font-size:2.4rem;font-weight:700;color:var(--amber);line-height:1}
.ring-lbl{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-top:4px}

/* timeline */
.tl{display:flex;flex-direction:column;gap:0}
.tl-row{display:flex;gap:14px;position:relative}
.tl-spine{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:16px;padding-top:3px}
.tl-dot{width:10px;height:10px;border-radius:50%;border:2px solid var(--border2);background:var(--bg);flex-shrink:0}
.tl-dot.past{border-color:var(--green);background:var(--green)}
.tl-dot.now{border-color:var(--amber);background:var(--amber);box-shadow:0 0 8px rgba(212,146,42,0.5)}
.tl-line{width:2px;flex:1;background:var(--border);margin:3px 0;min-height:18px}
.tl-line.past{background:var(--green)}
.tl-content{padding-bottom:18px}
.tl-time{font-family:var(--font-mono);font-size:.62rem;color:var(--text-dim);letter-spacing:.06em}
.tl-name{font-size:.88rem;font-weight:500;color:var(--text);margin-top:1px}
.tl-note{font-size:.76rem;color:var(--text-dim);margin-top:2px;line-height:1.5}

/* streak */
.streak-grid{display:flex;gap:7px;flex-wrap:wrap}
.sday{
  flex-direction:column;gap:3px;display:flex;align-items:center;
}
.sday-dot{
  width:32px;height:32px;border-radius:8px;border:1.5px solid var(--border);
  display:flex;align-items:center;justify-content:center;font-size:.65rem;
  font-family:var(--font-mono);color:var(--text-dim);font-weight:600;
  transition:all .2s;
}
.sday-dot.hit{background:rgba(45,158,95,0.2);border-color:var(--green);color:var(--green)}
.sday-dot.today{border-color:var(--amber);color:var(--amber)}
.sday-dot.missed{background:rgba(201,82,82,0.08);border-color:rgba(201,82,82,0.25);color:rgba(201,82,82,0.4)}
.sday-lbl{font-family:var(--font-mono);font-size:.55rem;color:var(--text-dim);letter-spacing:.06em}

/* weekly review */
.rev{max-width:740px;margin:0 auto;padding:48px 24px 100px}
.rev-h1{font-family:var(--font-display);font-size:2.6rem;font-weight:700;margin-bottom:8px}
.rev-sub{font-size:.92rem;color:var(--text-mid);margin-bottom:28px;line-height:1.6}
.rev-plan-card{
  border:1px solid rgba(212,146,42,.2);
  border-radius:var(--r2);
  background:linear-gradient(135deg,rgba(212,146,42,.055),rgba(255,255,255,.014));
  padding:14px 16px;
  margin-bottom:34px;
}
.rev-plan-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.rev-plan-label{font-family:var(--font-mono);font-size:.58rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--amber);margin-bottom:4px}
.rev-plan-title{font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:var(--text);line-height:1.15}
.rev-plan-pill{flex:0 0 auto;border:1px solid rgba(212,146,42,.32);border-radius:999px;color:var(--amber);background:rgba(212,146,42,.07);font-family:var(--font-mono);font-size:.56rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:6px 9px;white-space:nowrap}
.rev-plan-focus{color:var(--text-mid);font-size:.84rem;line-height:1.55}
.rev-plan-focus strong{color:var(--text);font-weight:700}
.rev-section{margin-bottom:36px}
.rev-sec-title{
  font-family:var(--font-mono);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;
  color:var(--amber);margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border);
}
.star-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.star-box{background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);padding:16px;text-align:center}
.star-lbl{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px}
.stars{font-size:1.4rem;cursor:pointer;letter-spacing:2px;display:flex;justify-content:center;gap:4px}
.star{transition:transform .1s;display:inline-block}
.star:hover{transform:scale(1.2)}
.rev-insight{
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--r2);
  overflow:hidden;margin-top:4px;
}
.rev-insight-hd{
  padding:14px 20px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:10px;
}
.rev-insight-body{padding:12px 20px 20px;font-size:.9rem;line-height:1.85;color:var(--text-mid)}
.rev-insight-body .rh{font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--amber);margin:16px 0 6px;display:block}
.rev-section-block{padding:14px 0;border-bottom:1px solid var(--border)}
.rev-section-block:last-child{border-bottom:none;padding-bottom:0}
.rev-section-title{font-family:var(--font-mono);font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);margin-bottom:6px}
.rev-section-body{font-size:.88rem;line-height:1.75;color:var(--text-mid);white-space:pre-wrap}
.rev-section-keystone{background:var(--amber-glow);border-left:3px solid var(--amber);border-radius:0 8px 8px 0;padding:12px 14px;margin:12px 0}
.rev-section-keystone .rev-section-title{color:var(--amber)}
.rev-section-keystone .rev-section-body{color:var(--text);font-weight:500}
.rev-section-growth{background:var(--sky-dim);border-left:3px solid var(--sky);border-radius:0 8px 8px 0;padding:12px 14px;margin:12px 0}
.rev-section-growth .rev-section-title{color:var(--sky)}
.rev-section-recovery{background:rgba(107,104,112,.06);border-left:3px solid rgba(107,104,112,.35);border-radius:0 8px 8px 0;padding:12px 14px;margin:12px 0}
.rev-section-recovery .rev-section-title{color:var(--text-dim)}
.rev-grade-chip{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:rgba(212,146,42,.12);border:1px solid rgba(212,146,42,.3);font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--amber);flex-shrink:0}
.rev-meta{font-family:var(--font-mono);font-size:.58rem;color:var(--text-dim);letter-spacing:.06em;margin-left:auto;white-space:nowrap}
.rev-pre-hint{font-size:.78rem;color:var(--text-dim);margin-bottom:14px;line-height:1.55}

/* settings / habits page */
.set{max-width:680px;margin:0 auto;padding:48px 24px 100px}
.set-h1{font-family:var(--font-display);font-size:2.6rem;font-weight:700;margin-bottom:8px}
.set-sub{font-size:.92rem;color:var(--text-mid);margin-bottom:40px;line-height:1.6}
.set-section{margin-bottom:36px}
.set-sec-title{
  font-family:var(--font-mono);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;
  color:var(--amber);margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border);
}
.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.info-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)}
.info-row:last-child{border-bottom:none}
.info-lbl{font-family:var(--font-mono);font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim)}
.info-val{font-size:.88rem;color:var(--text);font-weight:500}

.day-plan-strip{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border:1px solid rgba(212,146,42,.18);
  border-radius:12px;
  background:rgba(212,146,42,.045);
  padding:10px 12px;
  margin-bottom:16px;
}

.day-plan-strip > div:first-child{
  min-width:0;
}

.day-plan-label{
  color:var(--text-dim);
  font-family:var(--font-mono);
  font-size:.58rem;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
  margin-bottom:4px;
}

.day-plan-value{
  color:var(--text);
  font-size:.84rem;
  font-weight:700;
  line-height:1.35;
}

.day-plan-pill{
  flex:0 0 auto;
  max-width:50%;
  border:1px solid rgba(212,146,42,.32);
  border-radius:999px;
  color:var(--amber);
  background:rgba(212,146,42,.07);
  font-family:var(--font-mono);
  font-size:.56rem;
  font-weight:700;
  letter-spacing:.09em;
  text-transform:uppercase;
  padding:6px 9px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.settings-actions{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  gap:12px;
  align-items:center;
}

.settings-actions button{
  width:auto;
}

.settings-actions .btn-main{
  justify-self:start;
  min-width:166px;
}

.settings-actions .btn-amber{
  justify-self:center;
  min-width:206px;
  white-space:nowrap;
}

.settings-danger-btn{
  justify-self:end;
  min-width:166px;
  color:var(--red) !important;
  border-color:rgba(201,82,82,0.3) !important;
}

.plan-history-list{display:grid;gap:10px}
.plan-history-empty{
  padding:16px;
  border:1px solid var(--border);
  border-radius:var(--r);
  background:var(--surface);
  color:var(--text-mid);
  font-size:.88rem;
}

.plan-history-item{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  padding:14px 16px;
  border:1px solid var(--border);
  border-radius:var(--r);
  background:var(--surface);
}
.plan-history-card{
  border:1px solid var(--border);
  border-radius:var(--r);
  background:var(--surface);
  overflow:hidden;
}

.plan-history-card .plan-history-item{
  width:100%;
  border:0;
  background:transparent;
  cursor:pointer;
}

.plan-history-card.open{
  border-color:rgba(212,146,42,.28);
  box-shadow:0 0 22px rgba(212,146,42,.08);
}

.plan-history-right{
  display:flex;
  align-items:center;
  gap:10px;
}

.plan-history-chevron{
  color:var(--text-dim);
  font-family:var(--font-mono);
  font-size:1rem;
}

.plan-history-detail{
  border-top:1px solid var(--border);
  padding:16px;
}

.plan-history-summary{
  margin:0 0 14px;
  color:var(--text-mid);
  font-size:.9rem;
  line-height:1.7;
}

.plan-history-metadata-row{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
  margin-bottom:14px;
}

.plan-history-metadata-cell{
  border:1px solid var(--border);
  border-radius:12px;
  background:rgba(255,255,255,.022);
  padding:10px 12px;
  min-width:0;
}

.plan-history-metadata-label{
  margin-bottom:5px;
  color:var(--text-dim);
  font-family:var(--font-mono);
  font-size:.58rem;
  font-weight:700;
  letter-spacing:.09em;
  text-transform:uppercase;
}

.plan-history-metadata-value{
  color:var(--text);
  font-size:.78rem;
  font-weight:700;
  line-height:1.35;
  overflow-wrap:anywhere;
}

.plan-history-legacy-note{
  border:1px dashed var(--border);
  border-radius:14px;
  background:rgba(255,255,255,.018);
  color:var(--text-dim);
  font-size:.84rem;
  line-height:1.55;
  padding:14px;
  margin-bottom:14px;
}

.plan-history-detail-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:12px;
}

.plan-history-detail-card{
  border:1px solid var(--border);
  border-radius:14px;
  background:rgba(255,255,255,.025);
  padding:14px;
}

.plan-history-detail-label{
  margin-bottom:8px;
  color:var(--amber);
  font-family:var(--font-mono);
  font-size:.64rem;
  font-weight:700;
  letter-spacing:.09em;
  text-transform:uppercase;
}

.plan-history-detail-title{
  color:var(--text);
  font-size:.92rem;
  font-weight:700;
  line-height:1.45;
}

.plan-history-detail-note{
  margin-top:6px;
  color:var(--text-dim);
  font-size:.82rem;
  line-height:1.55;
}

.plan-history-habit-card{
  grid-column:1 / -1;
}

.plan-history-habit-list{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:10px 18px;
}

.plan-history-habit-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  color:var(--text-mid);
  font-size:.84rem;
  line-height:1.45;
}

.plan-history-habit-name{
  min-width:0;
}

.plan-history-habit-tag{
  flex:0 0 auto;
  color:var(--text-dim);
  font-family:var(--font-mono);
  font-size:.62rem;
  letter-spacing:.06em;
  text-transform:uppercase;
}
.plan-history-title{
  font-family:var(--font-display);
  color:var(--text);
  font-size:1.05rem;
  font-weight:700;
}
.plan-history-meta{
  margin-top:4px;
  color:var(--text-dim);
  font-size:.78rem;
}
.plan-history-pill{
  flex:0 0 auto;
  max-width:180px;
  padding:7px 10px;
  border:1px solid rgba(212,146,42,.24);
  border-radius:999px;
  color:var(--amber);
  font-family:var(--font-mono);
  font-size:.62rem;
  letter-spacing:.08em;
  text-transform:uppercase;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

/* tier visual */
.tier-strip{display:flex;gap:1px;background:var(--border);border-radius:var(--r);overflow:hidden;margin-top:20px}
.tier-seg{
  flex:1;padding:14px 12px;background:var(--surface);text-align:center;
  cursor:pointer;transition:all .2s;
}
.tier-seg.active{background:var(--amber-dim)}
.tier-seg-num{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px}
.tier-seg-name{font-size:.8rem;font-weight:600;color:var(--text-dim)}
.tier-seg.active .tier-seg-num{color:var(--amber)}
.tier-seg.active .tier-seg-name{color:var(--text)}

/* celebration overlay */
.celebrate{
  position:fixed;inset:0;z-index:300;
  display:flex;align-items:center;justify-content:center;
  background:rgba(4,9,15,0.85);backdrop-filter:blur(8px);
  animation:fadeIn .2s ease;
}
.celebrate-box{
  background:var(--surface);border:1px solid rgba(45,158,95,0.4);border-radius:var(--r2);
  padding:48px 56px;text-align:center;
  box-shadow:0 0 80px rgba(45,158,95,0.25),var(--shadow);
  animation:fadeUp .4s cubic-bezier(.22,.68,0,1.2);
}
.celebrate-emoji{font-size:3.5rem;margin-bottom:16px;animation:bounce 1s ease infinite}
.celebrate-title{font-family:var(--font-display);font-size:2rem;font-weight:700;color:var(--green);margin-bottom:8px}
.celebrate-sub{font-size:.9rem;color:var(--text-mid);line-height:1.6}

/* Auth preview warmth pass — softer balanced Claude-style tuning only */
.auth-right{
  --amber:#e0a43b;
  --amber-line:rgba(224,164,59,0.35);
  --green:#4aa56b;
  --text-faint:rgba(240,236,227,0.42);
  --bg-raise:#0e0c0a;
  --surface-1:#0d0b09;
  --surface-2:#14110e;
  --border:rgba(224,164,59,0.07);
  --border2:rgba(224,164,59,0.11);

  background:
    radial-gradient(circle at 86% 6%, rgba(224,164,59,0.085) 0%, rgba(224,164,59,0.028) 30%, transparent 58%),
    linear-gradient(160deg,#0d0906 0%,#050403 100%);
}

.auth-right::after{
  background:
    radial-gradient(circle,
      rgba(224,164,59,0.155) 0%,
      rgba(224,164,59,0.048) 34%,
      rgba(224,164,59,0) 68%
    );
}

.auth-pv{
  background:#0e0c0a;
  border-color:rgba(224,164,59,0.075);
  box-shadow:
    0 40px 80px -30px rgba(0,0,0,0.84),
    0 0 0 1px rgba(224,164,59,0.026),
    0 0 32px rgba(224,164,59,0.02);
}

.apv-bar{
  background:#100d0a;
  border-bottom-color:rgba(224,164,59,0.065);
}

.apv-plan,
.apv-stat{
  background:#0c0a08;
  border-color:rgba(224,164,59,0.065);
}

.apv-frog{
  background:
    linear-gradient(180deg,rgba(74,165,107,0.10),rgba(15,48,31,0.075)),
    #0c0a08;
  border-color:rgba(74,165,107,0.22);
}

/* Auth preview — lighten dashboard card only */
.auth-pv{
  background:#11100d;
  border-color:rgba(224,164,59,0.09);
  box-shadow:
    0 40px 80px -30px rgba(0,0,0,0.82),
    0 0 0 1px rgba(224,164,59,0.03),
    0 0 28px rgba(224,164,59,0.018);
}

.apv-bar{
  background:#13110e;
  border-bottom-color:rgba(224,164,59,0.075);
}

.apv-plan,
.apv-stat{
  background:#100e0b;
  border-color:rgba(224,164,59,0.075);
}

.apv-frog{
  background:
    linear-gradient(180deg,rgba(74,165,107,0.105),rgba(15,48,31,0.07)),
    #100e0b;
  border-color:rgba(74,165,107,0.22);
}

/* Auth right panel — slightly darker background only */
.auth-right{
  background:
    radial-gradient(circle at 86% 6%, rgba(224,164,59,0.068) 0%, rgba(224,164,59,0.022) 30%, transparent 58%),
    linear-gradient(160deg,#0b0805 0%,#040302 100%);
}

.auth-right::after{
  background:
    radial-gradient(circle,
      rgba(224,164,59,0.13) 0%,
      rgba(224,164,59,0.04) 34%,
      rgba(224,164,59,0) 68%
    );
}

/* Auth preview — nudge dashboard panel slightly upward only */
.auth-pv-tilt{
  transform:translateY(-10px);
}

/* Auth preview — slightly wider dashboard only */
.auth-pv{
  width:582px;
}

/* responsive */
@media(max-width:768px){
  .topbar{
    height:auto;
    min-height:86px;
    padding:8px 14px 10px;
    flex-wrap:wrap;
    gap:7px;
    align-items:center;
  }

  .topbar-logo{
    font-size:1.15rem;
    white-space:nowrap;
    flex:1;
  }

  .topbar-logo span{
    display:inline;
    font-size:.78rem;
    opacity:.62;
    letter-spacing:.16em;
    margin-left:4px;
  }

  .topbar-tag{
    font-size:.54rem;
    padding:4px 8px;
    white-space:nowrap;
  }

  .topbar-nav{
    order:3;
    width:100%;
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:4px;
    padding-top:2px;
  }

  .topbar-btn{
    width:100%;
    font-size:.58rem;
    line-height:1.1;
    padding:7px 4px;
    min-height:40px;
    text-align:center;
    justify-content:center;
    white-space:normal;
    overflow-wrap:normal;
    border-radius:10px;
    letter-spacing:.02em;
  }

  .topbar-nav .topbar-btn:nth-child(3),
  .topbar-nav .topbar-btn:nth-child(4){
    font-size:.54rem;
    letter-spacing:.01em;
    line-height:1.05;
  }

  .page{
    padding-top:18px;
    padding-bottom:28px;
  }

  .dash{
    padding-top:0;
  }
  .rev,
  .set{
    padding-top:18px;
  }

  .rev-h1{font-size:1.75rem}
  .set-h1{font-size:1.75rem}
  .calendar-top{
    justify-content:center;
    text-align:center;
    margin-bottom:24px;
  }
  
  .calendar-top > div:first-child{
    width:100%;
  }
  
  .calendar-controls{
    width:100%;
    justify-content:center;
  }
  
  .calendar-card{
    width:100%;
    margin-left:auto;
    margin-right:auto;
  }
  
  .calendar-card .card-body{
    padding:14px;
  }
  
  .calendar-weekdays,
  .calendar-grid{
    width:100%;
    grid-template-columns:repeat(7,minmax(0,1fr)) !important;
    gap:5px !important;
  }
  
  .calendar-day{
    width:100%;
    min-height:62px !important;
    padding:6px !important;
    border-radius:11px !important;
    box-sizing:border-box;
  }
  
  .stats{grid-template-columns:1fr 1fr}

  .stat{padding:14px 16px}
  .stat-val{font-size:2rem}
  .stat-lbl{font-size:.72rem}
  .stat-note{font-size:.78rem}

  .current-plan-body{
    padding:16px;
  }

  .current-plan-top{
    margin-bottom:8px;
  }

  .current-plan-meta-line{
    flex-direction:column;
    gap:5px;
  }

  .dash-top{flex-direction:column;align-items:center;text-align:center;gap:12px}
  .dash-greet{font-size:1.6rem}
  .dash-date{letter-spacing:.08em}
  .dgrid{grid-template-columns:1fr}
  .dright{position:static}
  .land-h1{font-size:3rem}
  .star-grid{
    grid-template-columns:repeat(3,minmax(0,1fr)) !important;
    gap:8px !important;
  }
  
  .star-box{
    min-width:0;
    padding:10px 4px !important;
    overflow:hidden;
  }
  
  .star-lbl{
    font-size:.55rem !important;
    letter-spacing:.06em !important;
    margin-bottom:7px !important;
    white-space:nowrap;
  }
  
  .stars{
    width:100%;
    display:flex !important;
    justify-content:center !important;
    gap:0 !important;
    font-size:.78rem !important;
    letter-spacing:0 !important;
    overflow:hidden;
  }
  
  .star{
    font-size:.82rem !important;
    line-height:1 !important;
  }
  
  .rev .btn-amber{
    width:100%;
  }
  .row2{grid-template-columns:1fr}
  .profile-grid{grid-template-columns:1fr}
  .settings-actions{
    grid-template-columns:1fr !important;
  }
  
  
  
  .settings-actions button{
    width:100% !important;
    min-width:0 !important;
  }
  .week-controls{
    display:grid !important;
    grid-template-columns:48px 82px 48px !important;
    justify-content:center !important;
    gap:8px !important;
    align-items:center !important;
  }
  
  .week-btn{
    width:48px !important;
    min-width:48px !important;
    padding:10px 0 !important;
  }
  
  .week-readout{
    text-align:center !important;
  }
  
  .week-tier{
    grid-column:1 / -1;
    text-align:center !important;
    margin-top:4px;
  }
  
  .week-tier .tier-pill{
    width:100%;
    justify-content:center !important;
  }
  
  .tier-strip{
    display:grid !important;
    grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    gap:8px !important;
    border:0 !important;
    background:transparent !important;
    overflow:visible !important;
  }
  
  .tier-strip > div{
    min-height:76px !important;
    border:1px solid rgba(255,255,255,.08) !important;
    border-radius:12px !important;
    overflow:hidden !important;
  }
  
  .tier-strip > div *{
    white-space:normal !important;
  }
  .landing-shell .topbar{
    height:56px !important;
    min-height:56px !important;
    padding:0 16px !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
  }
  
  .landing-shell .topbar-logo{
    font-size:1.15rem !important;
    flex:1 !important;
  }
  
  .landing-shell .topbar-logo span{
    display:inline !important;
    font-size:.82rem !important;
    opacity:.62 !important;
    letter-spacing:.16em !important;
    margin-left:4px !important;
  }
  .flow-topbar{
    height:56px !important;
    min-height:56px !important;
    padding:0 16px !important;
    flex-wrap:nowrap !important;
    align-items:center !important;
  }
  
  .flow-topbar .topbar-logo{
    flex:0 0 auto !important;
    width:auto !important;
    font-size:1.15rem !important;
    cursor:default !important;
  }
  
  .flow-topbar .topbar-logo span{
    display:inline !important;
    font-size:.82rem !important;
    opacity:.62 !important;
    letter-spacing:.16em !important;
    margin-left:4px !important;
  }
  
  .flow-topbar .topbar-nav{
    display:none !important;
  }
  
  .plan-history-item{
    flex-direction:column;
    align-items:center;
  }
  
  .plan-history-pill{
    max-width:100%;
  }
  .gen-preview-grid{
    grid-template-columns:1fr !important;
  }
  
  .gen-preview-habit{
    grid-template-columns:auto 1fr !important;
  }
  
  .gen-preview-habit em{
    grid-column:2;
  }
}

/* ── Wizard Home button ── */
.wizard-home-button{
  padding:8px 12px;
  background:transparent;
  border:1px solid rgba(255,255,255,0.1);
  border-radius:var(--r);
  color:var(--text-dim);
  font-family:var(--font-body);
  font-size:.8rem;
  font-weight:500;
  letter-spacing:.04em;
  cursor:pointer;
  transition:all .18s;
  white-space:nowrap;
}
.wizard-home-button:hover{
  color:var(--amber);
  border-color:rgba(212,146,42,0.35);
  background:var(--amber-glow);
}

/* ── Weekly Review History ── */
.wr-scores{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.wr-score-item{display:flex;flex-direction:column;gap:3px;flex:1;min-width:80px}
.wr-score-label{font-family:var(--font-mono);font-size:.56rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim);margin-bottom:2px}
.wr-score-stars{font-size:.88rem;color:var(--amber);letter-spacing:1px}
.wr-notes-block{margin-bottom:12px}
.wr-notes-label{font-family:var(--font-mono);font-size:.56rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim);margin-bottom:5px}
.wr-notes-text{font-size:.86rem;line-height:1.7;color:var(--text-mid)}
.wr-insight-block{border-top:1px solid var(--border);padding-top:12px;margin-top:4px}
.wr-insight-label{font-family:var(--font-mono);font-size:.56rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--amber);margin-bottom:6px}
.wr-insight-text{font-size:.86rem;line-height:1.75;color:var(--text-mid);white-space:pre-wrap}
`;
