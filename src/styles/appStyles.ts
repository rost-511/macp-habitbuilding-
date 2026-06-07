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

/* ── Public Landing (Project 14B) ───────────────────────────────────────────
   Marketing page. Owns its own sticky header (.pl-header). Scroll container is
   the app's .page element. All classes namespaced pl-*; the embedded dashboard
   previews reuse the auth screen's apv-* classes via the .pl-pv color scope. */
.pl-root{
  position:relative;
  font-family:var(--font-body);color:var(--text);
  background:
  radial-gradient(70% 50% at 92% -2%, rgba(212,146,42,0.10) 0%, rgba(212,146,42,0) 58%),
  radial-gradient(50% 40% at 4% 6%, rgba(212,146,42,0.04) 0%, rgba(212,146,42,0) 60%);
background-repeat:no-repeat;
}
.pl-wrap{width:100%;max-width:1280px;margin:0 auto;padding:0 56px}

/* shared type */
.pl-eyebrow{font-family:var(--font-mono);font-weight:500;font-size:13px;text-transform:uppercase;letter-spacing:.32em;color:var(--amber)}
.pl-label{font-family:var(--font-mono);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:var(--text-dim)}
.pl-accent{font-style:italic;font-weight:600;color:var(--amber)}

/* wordmark */
.pl-wordmark{display:inline-flex;align-items:baseline;gap:9px;background:none;border:none;padding:0;cursor:pointer;text-decoration:none}
.pl-wordmark .mk{font-family:var(--font-display);font-weight:700;color:var(--amber);letter-spacing:-.01em;line-height:1}
.pl-wordmark .sy{font-family:var(--font-mono);color:#a39c92;letter-spacing:.42em;line-height:1}

/* buttons */
.pl-btn-amber{
  font-family:var(--font-body);font-weight:600;font-size:16px;line-height:1;
  color:#07080a;background:var(--amber);border:none;border-radius:var(--r);
  padding:15px 24px;display:inline-flex;align-items:center;justify-content:center;gap:9px;
  cursor:pointer;text-decoration:none;white-space:nowrap;
  transition:transform .18s ease,box-shadow .18s ease,background .18s ease,opacity .18s ease;
  box-shadow:0 0 0 1px rgba(212,146,42,0.2),0 16px 44px -14px rgba(212, 104, 42, 0.45);
}
.pl-btn-amber:hover{transform:translateY(-2px);box-shadow:0 0 0 1px rgba(212,146,42,0.28),0 20px 50px -14px rgba(212,146,42,0.5)}
.pl-btn-amber:active{transform:scale(.985);box-shadow:none}
.pl-btn-amber:disabled{opacity:.7;cursor:wait;transform:none}
.pl-btn-amber svg{width:18px;height:18px;transition:transform .18s ease}
.pl-btn-amber:hover svg{transform:translateX(3px)}
.pl-btn-ghost{
  font-family:var(--font-body);font-weight:600;font-size:16px;line-height:1;
  color:var(--text);background:transparent;border:1px solid var(--border);
  border-radius:var(--r);padding:15px 22px;display:inline-flex;align-items:center;justify-content:center;gap:9px;
  cursor:pointer;text-decoration:none;white-space:nowrap;transition:border-color .18s ease,background .18s ease,color .18s ease;
}
.pl-btn-ghost:hover{border-color:var(--border2);background:var(--surface);color:var(--text)}
.pl-btn-ghost svg{width:17px;height:17px;color:var(--amber);transition:transform .18s ease}
.pl-btn-ghost:hover svg{transform:translateY(2px)}
.pl-spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(7,8,10,0.35);border-top-color:#07080a;border-radius:50%;animation:spin .7s linear infinite}

/* header */
/* Landing header — transparent at top, glass on scroll */
.pl-header{
  position:sticky;
  top:0;
  z-index:40;
  border-bottom:1px solid transparent;
  background:transparent;
  -webkit-backdrop-filter:none;
  backdrop-filter:none;
  transition:
    background .25s ease,
    border-color .25s ease,
    -webkit-backdrop-filter .25s ease,
    backdrop-filter .25s ease;
}

.pl-header.scrolled{
  background:rgba(7,8,10,0.52);
  -webkit-backdrop-filter:blur(14px) saturate(1.2);
  backdrop-filter:blur(14px) saturate(1.2);
  border-bottom-color:rgba(240,236,227,0.08);
}
.pl-nav{display:flex;align-items:center;justify-content:space-between;height:78px}
.pl-links{display:flex;align-items:center;gap:34px}
.pl-links a{font-family:var(--font-body);font-size:15px;color:var(--text-mid);text-decoration:none;cursor:pointer;transition:color .16s ease}
.pl-links a:hover{color:var(--text)}
.pl-actions{display:flex;align-items:center;gap:18px}
.pl-user{display:inline-flex;align-items:center}
.pl-signin{font-family:var(--font-body);font-size:15px;color:var(--text-mid);background:none;border:none;text-decoration:none;cursor:pointer;transition:color .16s ease}
.pl-signin:hover{color:var(--text)}
.pl-header-cta{padding:11px 20px;font-size:15px}
.pl-menu-toggle{display:none;background:none;border:none;cursor:pointer;color:var(--text);padding:6px}
.pl-mobile-menu{display:flex;flex-direction:column;gap:2px;position:absolute;top:78px;left:0;right:0;z-index:39;
  background:rgba(7,8,10,0.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);padding:10px 28px 18px}
.pl-mobile-menu a,.pl-mobile-menu button{text-align:left;font-family:var(--font-body);font-size:16px;color:var(--text-mid);background:none;border:none;padding:13px 0;cursor:pointer;text-decoration:none}
.pl-mobile-menu a:hover,.pl-mobile-menu button:hover{color:var(--text)}

/* hero */
.pl-hero{padding:76px 0 96px}
.pl-hero-grid{display:grid;grid-template-columns:1fr 1.06fr;gap:72px;align-items:center}
.pl-hero .pl-eyebrow{margin-bottom:22px}
.pl-h1{font-family:var(--font-display);font-weight:700;font-size:clamp(44px,4.6vw,64px);line-height:1.05;letter-spacing:-.01em;color:var(--text);margin:0 0 26px}
.pl-hero-sub{font-family:var(--font-body);font-size:19px;color:#a39c92;line-height:1.55;max-width:510px;margin:0 0 36px}
.pl-cta-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.pl-trust{display:flex;align-items:center;gap:22px;margin-top:46px;flex-wrap:wrap}
.pl-trust-item{display:flex;align-items:center;gap:9px}
.pl-trust-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);flex:none}
.pl-trust-t{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-mid)}

/* dashboard preview color scope — mirrors .auth-right so reused apv-* classes
   render in the richer preview amber/green, matching the auth screen exactly */
.pl-pv{
  --amber:#e0a43b;
  --amber-line:rgba(224,164,59,0.38);
  --green:#4aa56b;
  --text-faint:rgba(240,236,227,0.42);
  --bg-raise:#0c0d10;
}
.pl-pv .auth-pv{transform:none;width:100%;max-width:100%;box-shadow:0 50px 110px -40px rgba(0,0,0,0.85)}
.pl-dash-float{position:relative}
.pl-dash-float::before{
  content:"";
  position:absolute;
  inset:-22% -18% -26% -12%;
  z-index:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 68% 18%,
      rgba(212,146,42,0.105) 0%,
      rgba(212,146,42,0.045) 22%,
      rgba(212,146,42,0.015) 42%,
      rgba(212,146,42,0) 68%
    );
  filter:blur(18px);
}
.pl-dash-float .pl-pv{position:relative;z-index:1}

/* wide preview variant (command-surface proof) */
.pl-pv-wide .auth-pv{background:linear-gradient(180deg, rgba(40,30,18,0.42) 0%, var(--bg-raise) 40%)}
.pl-dw-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
.pl-momentum{background:#0b0d10;border:1px solid rgba(255,255,255,0.06);border-radius:13px;padding:18px;margin-bottom:12px}
.pl-momentum-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.pl-momentum-lbl{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--amber)}
.pl-momentum-pct{font-family:var(--font-display);font-weight:700;font-size:18px;color:var(--text)}
.pl-bars{display:flex;align-items:flex-end;gap:10px;height:64px}
.pl-bar{flex:1;border-radius:5px 5px 3px 3px;background:var(--surface2);position:relative}
.pl-bar i{position:absolute;bottom:0;left:0;right:0;border-radius:5px 5px 3px 3px;background:var(--amber);
  transform-origin:bottom;transform:scaleY(0);transition:transform .7s cubic-bezier(0.2,0.7,0.2,1);transition-delay:var(--bd,0ms)}
.pl-bars.pl-in .pl-bar i{transform:scaleY(1)}
.pl-bar.green i{background:var(--green)}
.pl-bar.miss i{background:var(--border2)}
.pl-dw-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pl-mini{background:#0b0d10;border:1px solid rgba(255,255,255,0.06);border-radius:13px;padding:16px}
.pl-mini.pl-recover{background:linear-gradient(180deg,rgba(74,165,107,0.13),rgba(74,165,107,0.035));border-color:rgba(74,165,107,0.26)}
.pl-mini-lbl{font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-dim);margin-bottom:9px}
.pl-mini.pl-recover .pl-mini-lbl{color:var(--green)}
.pl-mini h5{font-family:var(--font-display);font-weight:700;font-size:16px;color:var(--text);margin:0 0 4px}
.pl-mini p{font-family:var(--font-body);font-size:13px;color:var(--text-mid);margin:0;line-height:1.45}

/* trust / value strip */
.pl-strip{border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.pl-strip-grid{display:grid;grid-template-columns:repeat(4,1fr)}
.pl-strip-item{padding:30px 28px;border-left:1px solid var(--border)}
.pl-strip-item:first-child{border-left:none;padding-left:0}
.pl-strip-item .pl-label{margin-bottom:9px}
.pl-strip-t{font-family:var(--font-display);font-weight:700;font-size:19px;color:var(--text)}

/* section shell */
.pl-block{padding:110px 0}
.pl-section-head{max-width:640px;margin-bottom:56px}
.pl-section-head .pl-eyebrow{margin-bottom:18px}
.pl-section-head h2{font-family:var(--font-display);font-weight:700;font-size:clamp(34px,3.4vw,46px);line-height:1.06;letter-spacing:-.01em;color:var(--text);margin:0 0 18px}
.pl-section-head h2.pl-h2-sm{font-size:34px}
.pl-section-head p{font-family:var(--font-body);font-size:18px;color:var(--text-mid);line-height:1.55;margin:0}

/* how it works */
.pl-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.pl-step{
  background:linear-gradient(180deg, rgba(20,15,10,0.72), rgba(8,6,4,0.86));
  border:1px solid rgba(226,162,58,0.14);
  border-radius:var(--r2);
  padding:26px 24px 28px;
  box-shadow:
    inset 0 1px 0 rgba(239,231,220,0.035),
    0 18px 50px rgba(0,0,0,0.18);
  transition:border-color .2s ease, background .2s ease, box-shadow .2s ease;
}
.pl-step:hover{
  border-color:rgba(226,162,58,0.28);
  background:linear-gradient(180deg, rgba(26,18,10,0.78), rgba(9,7,5,0.9));
  box-shadow:
    inset 0 1px 0 rgba(239,231,220,0.045),
    0 22px 60px rgba(226,162,58,0.055);
}
.pl-step .pl-num{font-family:var(--font-mono);font-size:12px;letter-spacing:.2em;color:var(--amber)}
.pl-step .pl-line{
  height:1px;
  background:rgba(226,162,58,0.14);
  margin:18px 0 20px;
}
.pl-step h3{font-family:var(--font-display);font-weight:700;font-size:21px;color:var(--text);margin:0 0 10px;line-height:1.15}
.pl-step p{font-family:var(--font-body);font-size:14.5px;color:var(--text-mid);line-height:1.5;margin:0}

/* features */
.pl-features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.pl-feat{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);padding:28px;transition:border-color .2s ease,background .2s ease}
.pl-feat:hover{border-color:rgba(212,146,42,0.4);background:var(--surface2)}
.pl-feat.span2{grid-column:span 2;display:flex;gap:30px;align-items:flex-start}
.pl-feat.span2 .pl-feat-body{flex:1}
.pl-tile{width:46px;height:46px;border-radius:13px;border:1px solid rgba(212,146,42,0.4);display:inline-flex;align-items:center;justify-content:center;color:var(--amber);margin-bottom:20px;flex:none}
.pl-tile svg{width:22px;height:22px}
.pl-tile.green{border-color:rgba(45,158,95,0.42);color:var(--green)}
.pl-feat.span2 .pl-tile{margin-bottom:0}
.pl-feat .pl-label{margin-bottom:12px}
.pl-feat h3{font-family:var(--font-display);font-weight:700;font-size:22px;color:var(--text);margin:0 0 10px}
.pl-feat p{font-family:var(--font-body);font-size:15px;color:var(--text-mid);line-height:1.55;margin:0}
.pl-frog-emoji{font-size:20px}
/* Feature-card expand chevron — hidden on desktop (cards are always open there),
   revealed + interactive on mobile via the "Landing mobile final polish" block. */
.pl-feat-chev{display:none;position:absolute;top:24px;right:22px;width:34px;height:34px;
  align-items:center;justify-content:center;padding:0;cursor:pointer;
  background:rgba(226,162,58,0.07);border:1px solid var(--border);border-radius:10px;
  color:var(--pl-amber-bright);transition:transform .26s ease,background .2s ease,border-color .2s ease}
.pl-feat-chev svg{width:18px;height:18px}
.pl-feat-chev:hover{background:rgba(226,162,58,0.12);border-color:rgba(226,162,58,0.4)}

/* command surface proof */
.pl-surface-grid{display:grid;grid-template-columns:1.18fr 0.82fr;gap:64px;align-items:center}
.pl-callouts{display:flex;flex-direction:column;gap:4px}
.pl-callout{padding:20px 0;border-bottom:1px solid var(--border)}
.pl-callout:last-child{border-bottom:none}
.pl-callout .pl-label{color:var(--amber);margin-bottom:8px}
.pl-callout h4{font-family:var(--font-display);font-weight:700;font-size:19px;color:var(--text);margin:0 0 6px}
.pl-callout p{font-family:var(--font-body);font-size:14.5px;color:var(--text-mid);line-height:1.5;margin:0}

/* command surface — "system modules" visual (premium stacked modules, NOT a
   fake app screen). Replaces the old weekly-review dashboard mock. */
.pl-modules-wrap{position:relative}
.pl-modules{
  position:relative;display:flex;flex-direction:column;gap:10px;
  padding:18px;border-radius:var(--r2);
  background:rgba(22,18,13,0.42);
  -webkit-backdrop-filter:blur(20px) saturate(1.2);
  backdrop-filter:blur(20px) saturate(1.2);
  border:1px solid rgba(226,162,58,0.10);
  box-shadow:
    0 34px 90px -34px rgba(0,0,0,0.78),
    0 0 0 1px rgba(226,162,58,0.04),
    0 0 58px rgba(226,162,58,0.05);
}
.pl-modules-cap{display:flex;align-items:baseline;justify-content:space-between;
  padding:6px 6px 12px;margin-bottom:2px;border-bottom:1px solid var(--border)}
.pl-modules-cap-lbl{font-family:var(--font-mono);font-size:11px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--pl-amber-bright)}
.pl-modules-cap-meta{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;
  text-transform:uppercase;color:#a39c92}
.pl-module{
  position:relative;display:flex;align-items:center;gap:15px;
  padding:16px 18px;border-radius:14px;
  background:rgba(18,14,10,0.5);
  border:1px solid rgba(240,236,227,0.06);
  border-left:2px solid rgba(226,162,58,0.55);
  transition:border-color .2s ease,background .2s ease,transform .2s ease;
}
.pl-module.green{border-left-color:rgba(74,165,107,0.6)}
.pl-module:hover{transform:translateX(2px);background:rgba(24,19,13,0.6);border-color:rgba(226,162,58,0.22);border-left-color:rgba(226,162,58,0.8)}
.pl-module.green:hover{border-color:rgba(74,165,107,0.3);border-left-color:rgba(74,165,107,0.85)}
.pl-module-icon{width:42px;height:42px;border-radius:12px;flex:none;
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid rgba(226,162,58,0.4);color:var(--pl-amber-bright);background:rgba(226,162,58,0.06)}
.pl-module.green .pl-module-icon{border-color:rgba(74,165,107,0.45);color:var(--green);background:rgba(74,165,107,0.07)}
.pl-module-icon svg{width:21px;height:21px}
.pl-module-icon .pl-frog-emoji{font-size:20px}
.pl-module-main{flex:1;min-width:0}
.pl-module-name{font-family:var(--font-display);font-weight:700;font-size:17px;
  color:var(--pl-text-cream);line-height:1.2;margin-bottom:4px}
.pl-module-desc{font-family:var(--font-body);font-size:13.5px;color:#a39c92;line-height:1.45}
.pl-module-tag{flex:none;align-self:flex-start;
  font-family:var(--font-mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--pl-amber-bright);border:1px solid rgba(226,162,58,0.28);border-radius:999px;padding:5px 11px}
.pl-module.green .pl-module-tag{color:var(--green);border-color:rgba(74,165,107,0.32)}

/* features section — intro text + the modules visual as the main feature explainer */
.pl-feature-grid{display:grid;grid-template-columns:0.82fr 1.18fr;gap:60px;align-items:center}
.pl-feature-grid .pl-section-head{margin-bottom:0;max-width:430px}

/* command-surface — reserved (future preview) visual slot: clean dark space + soft
   glow, intentionally minimal. No fake screen, no placeholder text. */
.pl-future-slot{
  position:relative;min-height:360px;border-radius:var(--r2);
  border:1px solid rgba(240,236,227,0.05);
  background:
    radial-gradient(55% 46% at 50% 42%, rgba(226,162,58,0.055) 0%, rgba(226,162,58,0) 72%),
    linear-gradient(180deg, rgba(22,18,13,0.34) 0%, rgba(10,8,6,0.34) 100%);
  -webkit-backdrop-filter:blur(8px);
  backdrop-filter:blur(8px);
  box-shadow:inset 0 0 60px rgba(226,162,58,0.03);
}

/* final CTA */
.pl-final{text-align:center;padding:130px 0 120px;position:relative}
.pl-final::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(46% 70% at 50% 30%, rgba(212,146,42,0.10) 0%, rgba(212,146,42,0) 65%)}
.pl-final-inner{position:relative;max-width:720px;margin:0 auto}
.pl-final .pl-eyebrow{margin-bottom:24px}
.pl-final h2{font-family:var(--font-display);font-weight:700;font-size:clamp(40px,4.4vw,60px);line-height:1.05;letter-spacing:-.01em;color:var(--text);margin:0 0 22px}
.pl-final p{font-family:var(--font-body);font-size:18px;color:var(--text-mid);margin:0 0 36px}
.pl-final .pl-btn-amber{font-size:17px;padding:17px 30px}

/* footer — multi-column grouped structure (Project 14C) */
.pl-footer{border-top:1px solid var(--border);padding:0}
/* main grid: brand · product · account · legal */
.pl-foot-main{
  display:grid;grid-template-columns:2fr 1fr 1fr 1fr;
  gap:48px;padding:40px 0 28px;
  border-bottom:1px solid rgba(240,236,227,0.05)
}
.pl-foot-brand{display:flex;flex-direction:column;align-items:flex-start;gap:12px}
/* brand intro — wordmark · subheader · mission. Subheader sits a touch
   brighter/heavier than body; mission stays muted and calm. */
.pl-foot-sub{
  font-family:var(--font-body);font-weight:600;font-size:14.5px;line-height:1.4;
  color:var(--text);margin:2px 0 0;max-width:340px
}
.pl-foot-mission{
  font-family:var(--font-body);font-weight:400;font-size:13.5px;line-height:1.65;
  color:#a39c92;margin:0;max-width:380px
}
/* nav columns — heading is a <button> (accordion toggle on mobile); on desktop
   it reads as a static label, the chevron is hidden, and links stay open. */
.pl-foot-col{display:flex;flex-direction:column;gap:14px}
.pl-foot-head{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  width:100%;appearance:none;background:none;border:0;padding:0;margin:0;
  cursor:default;text-align:left;
  font-family:var(--font-mono);font-size:11px;font-weight:600;
  letter-spacing:.2em;text-transform:uppercase;color:rgba(240,236,227,0.86)
}
.pl-foot-chev{display:none}
/* desktop: wrapper is transparent so the column flex governs spacing */
.pl-foot-links-wrap{display:contents}
.pl-foot-links{display:flex;flex-direction:column;gap:11px}
.pl-foot-col a{
  font-family:var(--font-body);font-size:14px;color:#a39c92;width:fit-content;
  text-decoration:none;cursor:pointer;transition:color .16s ease
}
.pl-foot-col a:hover{color:var(--text)}
/* bottom row: copyright · AI disclaimer */
.pl-foot-base{
  display:flex;align-items:center;justify-content:space-between;
  gap:16px;flex-wrap:wrap;padding:14px 0 24px
}
.pl-foot-copy{
  font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--text-dim);white-space:nowrap
}
.pl-foot-note{
  font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(163,156,146,0.38);
  text-align:right
}

/* Landing color polish — creamy headlines + brighter amber */
.pl-root{
  --pl-text-cream:#efe7dc;
  --pl-amber-bright:#e2a23a;
  --pl-amber-glow-soft:rgba(226,162,58,0.24);
}

/* Big white display text: softer, creamier, less harsh */
.pl-h1,
.pl-section-head h2,
.pl-step h3,
.pl-feat h3,
.pl-callout h4,
.pl-final h2,
.pl-mini h5,
.pl-strip-t{
  color:var(--pl-text-cream);
}

/* Amber text/signals: slightly brighter + subtle premium glow */
.pl-eyebrow,
.pl-accent,
.pl-wordmark .mk,
.pl-step .pl-num,
.pl-momentum-lbl,
.pl-callout .pl-label{
  color:var(--pl-amber-bright);
  text-shadow:0 0 18px var(--pl-amber-glow-soft);
}

/* Amber icons/dots also get a tiny lift */
.pl-tile,
.pl-btn-ghost svg{
  color:var(--pl-amber-bright);
}

.pl-trust-dot{
  background:var(--pl-amber-bright);
  box-shadow:0 0 10px rgba(226,162,58,0.28);
}

/* Primary CTA: slightly richer amber, still not neon */
.pl-btn-amber{
  background:linear-gradient(180deg,#e3a43b 0%,#d6952f 100%);
  box-shadow:
    0 0 0 1px rgba(226,162,58,0.22),
    0 16px 44px -14px rgba(226,162,58,0.42);
}

/* Final CTA glow — soft ambient halo, no clipped rectangle */
.pl-final{
  position:relative;
  isolation:isolate;
  background:transparent;
  overflow:visible;
}

.pl-final::before{
  content:"";
  position:absolute;
  left:50%;
  top:26%;
  width:min(820px, 72vw);
  height:360px;
  transform:translate(-50%, -50%);
  z-index:0;
  pointer-events:none;
  background:
    radial-gradient(ellipse at center,
      rgba(226,162,58,0.13) 0%,
      rgba(226,162,58,0.07) 28%,
      rgba(226,162,58,0.025) 52%,
      rgba(226,162,58,0) 78%
    );
  filter:blur(28px);
  opacity:.9;
}

.pl-final > *{
  position:relative;
  z-index:1;
  transform:translateY(-72px);
}

/* Hero dashboard preview — slightly taller to align with hero text */
.pl-hero .pl-pv .auth-pv{
  min-height:550px;
  display:flex;
  flex-direction:column;
}

.pl-hero .pl-pv .apv-body{
  flex:1;
  display:flex;
  flex-direction:column;
}

.pl-hero .pl-pv .apv-plan{
  margin-bottom:16px;
}

.pl-hero .pl-pv .apv-stats{
  margin-bottom:16px;
}

.pl-hero .pl-pv .apv-frog{
  margin-top:auto;
  padding:18px;
}

/* Keep mobile natural */
@media(max-width:880px){
  .pl-hero .pl-pv .auth-pv{
    min-height:0;
  }
}

/* Hero dashboard preview — lift only, no resize */
.pl-hero .pl-dash-float{
  margin-top:-28px;
}

@media(max-width:880px){
  .pl-hero .pl-dash-float{
    margin-top:0;
  }
}

/* Hero dashboard preview — lighter glass panel */
.pl-hero .pl-pv .auth-pv{
  background:rgba(22,18,13,0.38);
  -webkit-backdrop-filter:blur(22px) saturate(1.22);
  backdrop-filter:blur(22px) saturate(1.22);
  border:1px solid rgba(226,162,58,0.075);
  box-shadow:
    0 34px 90px -34px rgba(0,0,0,0.78),
    0 0 0 1px rgba(226,162,58,0.045),
    0 0 58px rgba(226,162,58,0.065);
}

/* Inner dashboard cards — lighter glass */
.pl-hero .pl-pv .apv-plan,
.pl-hero .pl-pv .apv-stat{
  background:rgba(18,14,10,0.36);
  -webkit-backdrop-filter:blur(14px) saturate(1.16);
  backdrop-filter:blur(14px) saturate(1.16);
  border-color:rgba(240,236,227,0.055);
}

.pl-hero .pl-pv .apv-bar{
  background:rgba(20,16,11,0.30);
  -webkit-backdrop-filter:blur(14px) saturate(1.16);
  backdrop-filter:blur(14px) saturate(1.16);
  border-bottom-color:rgba(240,236,227,0.05);
}

/* Soften hero dashboard sharp inner outlines */
.pl-hero .pl-pv .apv-frog{
  border-color:rgba(74,165,107,0.16);
  box-shadow:inset 0 0 22px rgba(74,165,107,0.035);
}

.pl-hero .pl-pv .apv-daytag,
.pl-hero .pl-pv .apv-pill{
  border-color:rgba(226,162,58,0.14);
}

/* Hero dashboard preview — stable glass panel, fade contents only */
.pl-hero .pl-dash-float,
.pl-hero .pl-dash-float.pl-reveal,
.pl-hero .pl-dash-float.pl-in{
  opacity:1 !important;
  filter:none !important;
}

/* Panel itself stays final/dark immediately */
.pl-hero .pl-dash-float.pl-reveal .auth-pv{
  opacity:1 !important;
  filter:none !important;
}

/* Fade the actual dashboard content, not the glass shell */
.pl-hero .pl-dash-float.pl-reveal .auth-pv > *{
  opacity:0;
  transform:translateY(8px);
  transition:
    opacity .68s cubic-bezier(.22,1,.36,1),
    transform .68s cubic-bezier(.22,1,.36,1);
}

.pl-hero .pl-dash-float.pl-reveal.pl-in .auth-pv > *{
  opacity:1;
  transform:translateY(0);
}

/* Hero dashboard preview — permanent lift, separate from animation */
.pl-hero .pl-dash-float{
  margin-top:-36px;
}

@media(max-width:880px){
  .pl-hero .pl-dash-float{
    margin-top:0;
  }
}

/* Landing base background — warmer black, no extra glow */
.pl-root{
  background:
    linear-gradient(180deg,#0f0a05 0%,#0a0704 48%,#060403 100%);
}

/* Landing text warmth pass — supporting text only */
.pl-links a,
.pl-signin,
.pl-mobile-menu a,
.pl-mobile-menu button,
.pl-hero-sub,
.pl-trust-t,
.pl-section-head p,
.pl-step p,
.pl-feat p,
.pl-callout p,
.pl-final p,
.pl-foot-col a,
.pl-foot-mission{
  color:#a39c92;
}

/* Landing dashboard-preview supporting text */
.pl-pv .apv-logo span,
.pl-pv .apv-nav span,
.pl-pv .apv-date,
.pl-pv .apv-plan-meta,
.pl-pv .apv-stat-val small,
.pl-pv .apv-stat-foot,
.pl-pv .apv-frog-ghost,
.pl-pv .pl-mini-lbl,
.pl-pv .pl-mini p{
  color:#a39c92;
}

/* Landing command-surface / mini preview supporting text */
.pl-mini p,
.pl-momentum-pct{
  color:#a39c92;
}

/* motion — restrained fades + short slide-ups, ease-out (MACP system) */
.pl-reveal{opacity:0;transform:translateY(14px);transition:opacity .55s ease-out,transform .55s ease-out;transition-delay:var(--d,0ms)}
.pl-reveal.pl-in{opacity:1;transform:none}
.pl-dash-float.pl-reveal,.pl-dash-wide-wrap.pl-reveal{transform:translateY(22px);transition-duration:.7s}

/* responsive */
@media (max-width:1080px){
  .pl-hero-grid{grid-template-columns:1fr;gap:56px}
  .pl-surface-grid{grid-template-columns:1fr;gap:44px}
  .pl-feature-grid{grid-template-columns:1fr;gap:40px}
  /* Reserved preview slot is desktop-only — drop it so the progress section is
     just its text on mobile/tablet (no awkward empty box or blank gap). */
  .pl-future-slot{display:none}
  .pl-features{grid-template-columns:repeat(2,1fr)}
  .pl-feat.span2{grid-column:span 2}
  /* footer: brand spans the top, three nav columns share the row below */
  .pl-foot-main{grid-template-columns:repeat(3,1fr);gap:28px 28px}
  .pl-foot-brand{grid-column:1 / -1}
}
@media (max-width:820px){
  .pl-wrap{padding:0 28px}
  .pl-links,.pl-signin{display:none}
  .pl-menu-toggle{display:inline-flex}
  .pl-actions .pl-btn-amber{padding:12px 18px}
  .pl-hero{padding:48px 0 64px}
  .pl-h1{font-size:clamp(38px,9vw,46px)}
  .pl-cta-row{flex-direction:column;align-items:center}
  .pl-cta-row .pl-btn-amber,.pl-cta-row .pl-btn-ghost{width:100%;max-width:280px;padding:16px 22px}
  .pl-block{padding:72px 0}
  .pl-strip-grid{grid-template-columns:1fr 1fr}
  .pl-strip-item{border-left:none;padding:22px 0;border-top:1px solid var(--border)}
  .pl-strip-item:nth-child(-n+2){border-top:none}
  .pl-strip-item:nth-child(even){padding-left:22px;border-left:1px solid var(--border)}
  .pl-steps{grid-template-columns:1fr;gap:14px}
  .pl-features{grid-template-columns:1fr}
  .pl-feat.span2{grid-column:span 1;flex-direction:column;gap:0}
  .pl-feat.span2 .pl-tile{margin-bottom:20px}
  .pl-dw-stats{grid-template-columns:1fr 1fr}
  .pl-final{padding:88px 0 80px}
  /* footer: brand block on top, columns collapse into tappable accordion rows.
     Everything shares the same left edge (.pl-wrap) — wordmark, tagline,
     headings, links and the base row all start at x=0. */
  /* soften the section divider above the brand and give it breathing room so it
     reads as a subtle divider, not a line touching the MACP wordmark */
  .pl-footer{
  position:relative;
  border-top-color:transparent;
}
.pl-footer::before{
  content:"";
  position:absolute;
  left:0;
  right:0;
  top:-14px;
  height:1px;
  background:rgba(240,236,227,0.08);
  pointer-events:none;
}
  .pl-foot-main{grid-template-columns:1fr;gap:0;padding:54px 0 0;border-bottom:none}
  .pl-foot-brand{gap:10px;padding-bottom:22px}
  /* hairline dividers — one per row, last row closes the stack (no boxes) */
  .pl-foot-col{gap:0;border-top:1px solid rgba(240,236,227,0.06)}
  .pl-foot-col:last-of-type{border-bottom:1px solid rgba(240,236,227,0.06)}
  /* thin heading row: muted mono label + small dim chevron, vertically centered */
  .pl-foot-head{
  padding:13px 0;
  cursor:pointer;
  color:#a39c92;
  font-size:11px;
  letter-spacing:.2em;
  line-height:1;
}
.pl-foot-head > span:first-child{
  position:relative;
  top:1px;
  line-height:1;
}

.pl-foot-chev{
  position:relative;
  top:1px;
}
  .pl-foot-head[aria-expanded="true"]{color:var(--text)}
  .pl-foot-chev{
    display:flex;align-items:center;color:var(--text-dim);opacity:.55;
    transition:transform .22s ease,opacity .22s ease
  }
  .pl-foot-chev svg{width:13px;height:13px}
  .pl-foot-head[aria-expanded="true"] .pl-foot-chev{transform:rotate(180deg);opacity:.9}
  /* collapsible region: calm, quick grid-rows + opacity fade (no bounce) */
  .pl-foot-links-wrap{
    display:grid;grid-template-rows:0fr;opacity:0;
    transition:grid-template-rows .22s ease,opacity .22s ease
  }
  .pl-foot-head[aria-expanded="true"] + .pl-foot-links-wrap{grid-template-rows:1fr;opacity:1}
  .pl-foot-links{overflow:hidden;min-height:0;gap:0;padding-bottom:10px}
  .pl-foot-col a{width:fit-content;padding:9px 0;font-size:13.5px}
  .pl-foot-base{flex-direction:column;align-items:flex-start;gap:7px;padding:16px 0 28px}
  .pl-foot-note{text-align:left}
}

/* Landing mobile final polish ──────────────────────────────────────────────
   Phone-only refinements: calmer header, an intentionally-mobile (lower-density)
   dashboard preview, clean anchor landings under the sticky header, and tighter
   vertical rhythm. CSS-only and scoped to .pl-* (incl. the landing .pl-pv
   previews) — desktop layout and the shared AuthShell preview are untouched. */
@media (max-width:600px){
  /* Header — shorter and less crowded, no horizontal overflow */
  .pl-wrap{padding:0 20px}
  .pl-nav{height:60px}
  .pl-actions{gap:10px}
  .pl-mobile-menu{top:60px;padding:8px 20px 16px}
  .pl-user{display:none}                         /* account lives on the dashboard */
  .pl-actions .pl-header-cta{padding:11px 15px;font-size:14px}

  /* Hero rhythm — avoid a yawning gap between copy and the preview */
  .pl-hero{padding:40px 0 52px}
  .pl-hero-grid{gap:32px}
  .pl-h1{margin-bottom:18px}
  .pl-hero-sub{font-size:17px;margin-bottom:28px}
  /* Hero bullets — centered group, amber dot on BOTH sides of each line:
     • BUILT AROUND DAILY EXECUTION •   (mono uppercase preserved) */
  .pl-trust{flex-direction:column;align-items:center;gap:12px;margin-top:30px}
  .pl-trust-item{justify-content:center;gap:10px}
  .pl-trust-t{text-align:center}
  .pl-trust-item::after{content:"";width:6px;height:6px;border-radius:50%;flex:none;
    background:var(--pl-amber-bright);box-shadow:0 0 10px rgba(226,162,58,0.28)}

  /* Dashboard previews — intentionally mobile: lower density, less wrapping.
     Scoped to .pl-pv so the AuthShell's own apv-* preview is unaffected. */
  .pl-pv .apv-nav{display:none}                   /* drop the desktop tab row */
  .pl-pv .apv-bar{padding:12px 14px}
  .pl-pv .apv-body{padding:14px}
  .pl-pv .apv-greetrow{margin-bottom:14px}
  .pl-pv .apv-greet{font-size:19px}
  .pl-pv .apv-tier{padding:6px 9px}
  .pl-pv .apv-plan{padding:14px;margin-bottom:10px}
  .pl-pv .apv-plan-name{font-size:16px}
  .pl-pv .apv-stats{gap:8px;margin-bottom:10px}
  .pl-pv .apv-stat{padding:11px 10px}
  .pl-pv .apv-stat-lbl{margin-bottom:8px}
  .pl-pv .apv-stat-val{font-size:23px}
  .pl-pv .apv-stat-val small{font-size:11px}
  .pl-pv .apv-frog{padding:14px}
  .pl-pv .apv-frog-name{font-size:15px}
  .pl-pv .apv-frog-row{flex-wrap:wrap}
  /* command-surface "system modules" visual — compact, clean stack on phones */
  .pl-modules{padding:14px;gap:8px}
  .pl-modules-cap{padding:4px 4px 10px}
  .pl-module{padding:13px 14px;gap:12px}
  .pl-module-icon{width:38px;height:38px}
  .pl-module-icon svg{width:19px;height:19px}
  .pl-module-name{font-size:15.5px}
  .pl-module-desc{font-size:13px}
  .pl-module-tag{font-size:9px;padding:4px 9px}

  /* Section rhythm + clean anchor landing under the sticky header */
  .pl-block{padding:60px 0;scroll-margin-top:84px}
  .pl-section-head{margin-bottom:36px}

  /* Numbered process strip (01 Generate … 04 Recover) — drop it on phones */
  .pl-strip{display:none}

  /* "What's inside the system" cards → compact tap-to-expand rows.
     Collapsed = a thin premium row (icon left · title middle · chevron right,
     ~78–82px tall); the body text opens below inside the same card. */
  /* Keep the CARD itself permanently visible: the scroll-reveal (pl-reveal/pl-in)
     must never re-hide it. Open state is a data-attr so React never rewrites the
     className, but this is the belt-and-suspenders guard so the card never fades. */
  .pl-feat,
  .pl-feat.pl-reveal,
  .pl-feat.pl-in{opacity:1!important;visibility:visible!important;transform:none!important}
  /* header row: icon · title · (absolute chevron); body wraps to its own line below */
  .pl-feat{display:flex;flex-wrap:wrap;align-items:center;column-gap:13px;row-gap:0;
    cursor:pointer;padding:18px 52px 18px 18px}
  .pl-feat.span2{align-items:flex-start}            /* long title wraps; keep icon top-aligned */
  .pl-feat .pl-label{display:none}                  /* drop eyebrow → keeps the row thin */
  .pl-feat .pl-tile{width:42px;height:42px;margin:0;flex:none}
  .pl-feat .pl-tile svg{width:20px;height:20px}
  .pl-feat h3{flex:1;min-width:0;margin:0;font-size:17px;line-height:1.28}
  .pl-feat.span2 .pl-feat-body{flex:1;min-width:0}
  /* chevron pinned to the header row, aligned with the icon */
  .pl-feat-chev{display:inline-flex;top:21px;right:14px}
  /* Only the body animates (max-height + opacity + margin) — never the card.
     flex-basis:100% drops it onto its own line beneath the header row. */
  .pl-feat p{flex-basis:100%;max-height:0;margin-top:0;opacity:0;overflow:hidden;
    transition:max-height .3s ease,opacity .26s ease,margin-top .3s ease}
  .pl-feat[data-open] p{max-height:320px;margin-top:12px;opacity:1}
  .pl-feat[data-open] .pl-feat-chev{transform:rotate(180deg);background:rgba(226,162,58,0.13)}
}

/* Tightest phones (≤420px) — keep the header on one calm line */
@media (max-width:420px){
  .pl-wrap{padding:0 16px}
  .pl-header .pl-wordmark .sy{display:none}       /* keep MACP; drop the tag */
  .pl-actions .pl-header-cta svg{display:none}
  .pl-actions .pl-header-cta{padding:10px 13px;font-size:13.5px}
}

@media (prefers-reduced-motion: reduce){
  .pl-reveal{opacity:1!important;transform:none!important;transition:none!important}
  .pl-bar i{transform:scaleY(1)!important;transition:none!important}
  .pl-btn-amber svg,.pl-btn-ghost svg{transition:none!important}
  .pl-feat p,.pl-feat-chev{transition:none!important}
}

/* ── Trust / legal pages (Project 14C) ───────────────────────────────────────
   Public Privacy / Terms / Support / AI Disclaimer pages. Own header + footer,
   warm-black MACP styling. tp-* namespace; reuses .pl-wordmark for the mark. */
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
