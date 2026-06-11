/* ─────────────────────────────────────────────────────────────────────────────
   PUBLIC LANDING STYLES (2026-06 redesign)
   Namespace: .lp-* — injected by PublicLanding.tsx via <style>{LANDING_STYLES}</style>.
   The landing scrolls inside the app's `.page` element (NOT the window).
   Spec: docs/superpowers/specs/2026-06-11-landing-redesign-design.md
───────────────────────────────────────────────────────────────────────────── */
export const LANDING_STYLES = `
.lp-root{
  /* warm MACP surfaces — matches the app/auth warm-black + amber-tinted borders */
  --lp-bg:#0a0805;
  --lp-card:#100d09;
  --lp-card2:#15110b;
  --lp-line:rgba(224,164,59,0.10);
  --lp-cline:rgba(224,164,59,0.09);
  --lp-cline2:rgba(224,164,59,0.14);
  --lp-text:#f4f1ea;
  --lp-text2:#a39c8f;
  --lp-mut:#8a8275;
  --lp-faint:#6b6354;
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
  background:transparent;color:#d6cfc1;
  border:1px solid #332a1c;border-radius:8px;cursor:pointer;
  font-family:var(--lp-font);font-size:.9rem;font-weight:500;
  padding:11px 20px;
  transition:border-color .18s ease,color .18s ease,background .18s ease;
}
.lp-btn-ghost:hover{border-color:rgba(224,164,59,0.35);color:var(--lp-text);background:rgba(255,255,255,0.03)}
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
  background:rgba(10,8,5,0.72);
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
  background:none;border:1px solid #332a1c;border-radius:7px;cursor:pointer;
  color:#e9e4d7;font-family:var(--lp-font);font-size:.85rem;font-weight:500;
  padding:8px 16px;transition:border-color .18s,background .18s;
}
.lp-signin:hover{border-color:rgba(224,164,59,0.35);background:rgba(255,255,255,0.03)}
.lp-header .lp-btn-amber{padding:9px 18px;font-size:.85rem}
.lp-menu-toggle{display:none;background:none;border:none;color:var(--lp-text);cursor:pointer;padding:6px}
.lp-mobile-menu{
  display:flex;flex-direction:column;gap:4px;
  padding:10px 24px 18px;
  background:rgba(10,8,5,0.95);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--lp-line);
}
.lp-mobile-menu a,.lp-mobile-menu button{
  text-align:left;background:none;border:none;cursor:pointer;
  color:var(--lp-text2);font-family:var(--lp-font);font-size:.95rem;padding:10px 0;
}
.lp-mobile-menu a:hover,.lp-mobile-menu button:hover{color:var(--lp-text)}

/* ── Hero ── */
.lp-hero{position:relative;overflow:hidden;padding:84px 0 88px;text-align:center}
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
  margin:56px auto 0;max-width:760px;position:relative;
  transform:perspective(1200px) rotateX(6deg) translateY(-8px);
  transform-origin:top center;
  will-change:transform;
}
.lp-preview{
  background:var(--lp-card);border:1px solid var(--lp-cline2);
  border-radius:14px;
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
.lp-pv-bars span{flex:1;background:#332a1c;border-radius:2px}
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
.lp-cell:hover{transform:translateY(-2px);border-color:rgba(224,164,59,0.28)}
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
.lp-mini-plan-segs span{flex:1;height:4px;border-radius:999px;background:#332a1c}
.lp-mini-plan-segs span.on{flex:2;background:var(--lp-amber)}

.lp-mini-frog{
  margin-top:14px;background:var(--lp-card2);
  border-left:3px solid var(--lp-amber);border-radius:7px;padding:10px 12px;
}
.lp-mini-frog-name{color:var(--lp-text);font-size:.72rem;font-weight:600}
.lp-mini-frog-done{color:var(--lp-green);font-size:.6rem;margin-top:3px}

.lp-rbars{display:flex;gap:4px;align-items:flex-end;height:32px;max-width:70%;margin-top:16px}
.lp-rbars span{
  flex:1;border-radius:2px;background:#362d1e;height:var(--h,50%);
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
/* opacity-only load for elements whose transform is owned elsewhere (hero
   preview tilt/rise) — a filling lpFadeUp would pin transform to identity */
@keyframes lpFadeIn{from{opacity:0}to{opacity:1}}
.lp-load-fade{opacity:0;animation:lpFadeIn .5s cubic-bezier(.22,.61,.36,1) forwards;animation-delay:var(--d,0ms)}
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
  .lp-preview-wrap{transform:none;margin-bottom:-14px}
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
  .lp-load,.lp-load-fade{animation:none;opacity:1}
  .lp-reveal{opacity:1;transform:none;transition:none}
  .lp-steps::before{transform:scaleX(1);transition:none}
  .lp-rbars span{transform:scaleY(1);transition:none}
  .lp-preview-wrap{transform:none}
  .lp-btn-amber,.lp-btn-ghost,.lp-cell{transition:none}
  .lp-foot-chev,.lp-foot-links-wrap{transition:none}
}
`;
