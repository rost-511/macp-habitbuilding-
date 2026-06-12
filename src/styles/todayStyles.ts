/* ─────────────────────────────────────────────────────────────────────────────
   TODAY DASHBOARD STYLES (2026-06 rebuild)
   Namespace: .td-* — injected by TodayApp.tsx via <style>{TODAY_STYLES}</style>.
   Warm-dark brand tokens shared with the landing (.lp-*).
   Spec: docs/superpowers/specs/2026-06-12-dashboard-rebuild-design.md
───────────────────────────────────────────────────────────────────────────── */
export const TODAY_STYLES = `
.td-root{
  --td-bg:#0a0805; --td-card:#100d09; --td-card2:#15110b;
  --td-line:rgba(224,164,59,0.10); --td-line2:rgba(224,164,59,0.16);
  --td-text:#f4f1ea; --td-text2:#a39c8f; --td-mut:#8a8275; --td-faint:#6b6354;
  --td-amber:#f5a524; --td-amber-dim:rgba(245,165,36,0.10);
  --td-green:#4ade80; --td-red:#f87171;
  --td-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  min-height:100%; background:var(--td-bg); color:var(--td-text);
  font-family:var(--td-font); -webkit-font-smoothing:antialiased;
}
.td-wrap{max-width:520px;margin:0 auto;padding:0 20px 96px;overflow-x:clip}

/* ── Top bar ── */
.td-bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;
  gap:12px;padding:14px 20px;background:rgba(10,8,5,0.92);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--td-line)}
.td-bar-views{display:flex;gap:4px}
.td-bar-view{background:none;border:none;cursor:pointer;font-family:var(--td-font);
  font-size:.9rem;font-weight:600;color:var(--td-faint);padding:6px 10px;border-radius:8px;
  transition:color .15s}
.td-bar-view:hover{color:var(--td-text2)}
.td-bar-view.active{color:var(--td-text)}
.td-bar-right{display:flex;align-items:center;gap:8px;margin-left:auto}
.td-replan{display:inline-flex;align-items:center;gap:6px;background:transparent;
  color:var(--td-amber);border:1px solid rgba(245,165,36,0.35);border-radius:8px;cursor:pointer;
  font-family:var(--td-font);font-size:.82rem;font-weight:600;padding:7px 12px;
  transition:background .15s}
.td-replan:hover{background:var(--td-amber-dim)}
.td-menu-btn{background:none;border:1px solid var(--td-line);border-radius:8px;cursor:pointer;
  color:var(--td-text2);font-size:1rem;line-height:1;padding:7px 10px}
.td-menu{position:absolute;right:20px;top:52px;background:var(--td-card);border:1px solid var(--td-line2);
  border-radius:10px;padding:6px;min-width:180px;box-shadow:0 12px 40px rgba(0,0,0,0.5);z-index:30}
.td-menu button{display:block;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  font-family:var(--td-font);font-size:.88rem;color:var(--td-text2);padding:9px 12px;border-radius:7px}
.td-menu button:hover{background:var(--td-card2);color:var(--td-text)}

/* ── Today header ── */
.td-head{display:flex;align-items:baseline;justify-content:space-between;margin:22px 0 10px}
.td-date{font-size:.85rem;color:var(--td-mut)}
.td-count{font-size:.85rem;color:var(--td-text2)}
.td-count b{color:var(--td-green);font-weight:700}

/* ── List rows ── */
.td-section{font-size:.68rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
  color:var(--td-faint);margin:18px 0 6px}
.td-row{display:flex;align-items:center;gap:11px;width:100%;box-sizing:border-box;text-align:left;
  background:none;border:none;border-bottom:1px solid rgba(224,164,59,0.06);cursor:pointer;
  font-family:var(--td-font);color:var(--td-text);padding:12px 2px;border-radius:0;
  transition:background .12s}
.td-row:hover{background:rgba(255,255,255,0.02)}
.td-row.now{background:var(--td-amber-dim);border:1px solid rgba(245,165,36,0.3);
  border-radius:10px;padding:12px 10px;margin:4px 0}
.td-row.done{opacity:.45}
.td-row.done .td-row-name{text-decoration:line-through;color:var(--td-mut)}
.td-check{width:19px;height:19px;flex:none;border-radius:6px;border:1.5px solid #4a4336;
  background:transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;
  color:transparent;font-size:.7rem;transition:all .12s}
.td-check:hover{border-color:var(--td-amber)}
.td-check.on{background:var(--td-green);border-color:var(--td-green);color:#06270f}
.td-row-time{width:48px;flex:none;font-size:.74rem;color:var(--td-faint);
  font-variant-numeric:tabular-nums}
.td-row.now .td-row-time{color:var(--td-amber)}
.td-row-name{flex:1;font-size:.92rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-row.now .td-row-name{font-weight:600}
.td-row-sub{font-size:.72rem;color:var(--td-faint);margin-left:6px}
.td-badge{font-size:.62rem;font-weight:700;letter-spacing:.5px;flex:none}
.td-badge.p1{color:var(--td-amber)}
.td-badge.p2{color:var(--td-mut)}
.td-badge.p3{color:var(--td-faint)}
.td-badge.now-tag{color:var(--td-amber)}
.td-chip{font-size:.64rem;color:var(--td-mut);border:1px solid var(--td-line);border-radius:9px;
  padding:1px 7px;flex:none}
.td-chip.missed{color:var(--td-amber);border-color:rgba(245,165,36,0.3)}
.td-row-del{background:none;border:none;cursor:pointer;color:var(--td-faint);font-size:.95rem;
  padding:2px 6px;flex:none;border-radius:6px}
.td-row-del:hover{color:var(--td-red)}

/* ── Add-task composer ── */
.td-add{display:flex;align-items:center;flex-wrap:wrap;gap:9px;padding:12px 2px}
.td-add input[type="text"]{min-width:140px}
.td-add-ctl{display:flex;align-items:center;gap:8px;margin-left:auto}
.td-add input[type="text"]{flex:1;background:transparent;border:none;outline:none;
  font-family:var(--td-font);font-size:.9rem;color:var(--td-text)}
.td-add input[type="text"]::placeholder{color:var(--td-faint);font-style:italic}
.td-add-plus{color:var(--td-faint);font-size:1rem;flex:none}
.td-add select,.td-add input[type="time"]{background:var(--td-card);border:1px solid var(--td-line);
  border-radius:7px;color:var(--td-text2);font-family:var(--td-font);font-size:.76rem;padding:4px 6px}

/* ── Focus card (full takeover) ── */
.td-focus{position:fixed;inset:0;z-index:50;background:var(--td-bg);display:flex;flex-direction:column}
.td-focus-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;
  border-bottom:1px solid var(--td-line)}
.td-focus-exit{background:none;border:none;cursor:pointer;color:var(--td-mut);
  font-family:var(--td-font);font-size:.88rem}
.td-focus-exit:hover{color:var(--td-text)}
.td-focus-meta{font-size:.8rem;color:var(--td-amber);font-weight:600}
.td-focus-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:center;
  padding:46px 20px}
.td-focus-inner{width:100%;max-width:420px;text-align:center}
.td-focus-title{font-size:1.5rem;font-weight:700;margin:0 0 6px}
.td-focus-hint{font-size:.85rem;color:var(--td-mut);margin-bottom:22px}
.td-subs{text-align:left;border:1px solid var(--td-line);border-radius:12px;
  background:var(--td-card);margin-bottom:22px;overflow:hidden}
.td-sub{display:flex;align-items:center;gap:10px;padding:11px 14px;
  border-bottom:1px solid rgba(224,164,59,0.06)}
.td-sub:last-child{border-bottom:none}
.td-sub .td-check{width:16px;height:16px;border-radius:5px}
.td-sub-name{flex:1;font-size:.88rem}
.td-sub.done .td-sub-name{text-decoration:line-through;color:var(--td-mut)}
.td-sub-add{display:flex;gap:10px;padding:11px 14px}
.td-sub-add input{flex:1;background:transparent;border:none;outline:none;
  font-family:var(--td-font);font-size:.86rem;color:var(--td-text)}
.td-sub-add input::placeholder{color:var(--td-faint);font-style:italic}
.td-done-btn{display:inline-flex;align-items:center;gap:8px;background:var(--td-amber);color:#161104;
  border:none;border-radius:9px;cursor:pointer;font-family:var(--td-font);font-size:.92rem;
  font-weight:700;padding:12px 26px;box-shadow:0 4px 24px rgba(245,165,36,0.25);
  transition:transform .15s,background .15s}
.td-done-btn:hover{background:#ffb437;transform:translateY(-1px)}
.td-done-btn.undone{background:transparent;color:var(--td-text2);border:1px solid var(--td-line2);
  box-shadow:none}

/* ── Habits manager ── */
.td-hab{display:flex;align-items:center;gap:10px;padding:13px 2px;
  border-bottom:1px solid rgba(224,164,59,0.06)}
.td-hab-name{flex:1;font-size:.92rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-hab-meta{font-size:.7rem;color:var(--td-mut);flex:none}
.td-hab-edit{background:none;border:1px solid var(--td-line);border-radius:7px;cursor:pointer;
  color:var(--td-text2);font-family:var(--td-font);font-size:.74rem;padding:4px 10px}
.td-hab-edit:hover{border-color:var(--td-line2);color:var(--td-text)}
.td-new-habit{display:inline-flex;align-items:center;gap:7px;background:transparent;
  color:var(--td-amber);border:1px dashed rgba(245,165,36,0.4);border-radius:9px;cursor:pointer;
  font-family:var(--td-font);font-size:.86rem;font-weight:600;padding:10px 16px;margin-top:16px}
.td-new-habit:hover{background:var(--td-amber-dim)}

/* ── Editor / modal shell (habit editor, schedule, replan) ── */
.td-modal-veil{position:fixed;inset:0;z-index:60;background:rgba(5,4,2,0.7);backdrop-filter:blur(3px);
  display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 16px}
.td-modal{width:100%;max-width:480px;background:var(--td-card);border:1px solid var(--td-line2);
  border-radius:14px;padding:22px}
.td-modal h3{margin:0 0 16px;font-size:1.05rem}
.td-field{margin-bottom:14px}
.td-label{display:block;font-size:.68rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;
  color:var(--td-faint);margin-bottom:6px}
.td-input{width:100%;box-sizing:border-box;background:var(--td-card2);border:1px solid var(--td-line);
  border-radius:8px;color:var(--td-text);font-family:var(--td-font);font-size:.9rem;padding:9px 11px;outline:none}
.td-input:focus{border-color:rgba(245,165,36,0.4)}
.td-seg{display:flex;gap:6px;flex-wrap:wrap}
.td-seg button{background:var(--td-card2);border:1px solid var(--td-line);border-radius:8px;cursor:pointer;
  color:var(--td-text2);font-family:var(--td-font);font-size:.8rem;padding:7px 12px}
.td-seg button.on{border-color:var(--td-amber);color:var(--td-amber);background:var(--td-amber-dim)}
.td-seg button.on.sp1{border-color:rgba(245,165,36,0.5);color:var(--td-amber);background:rgba(245,165,36,0.09)}
.td-seg button.on.sp2{border-color:rgba(56,189,248,0.45);color:#7cc6f0;background:rgba(56,189,248,0.08)}
.td-seg button.on.sp3{border-color:rgba(167,139,250,0.45);color:#a78bfa;background:rgba(167,139,250,0.08)}

/* ── Help sheet ── */
.td-help h4{margin:18px 0 6px;font-size:.78rem;font-weight:800;letter-spacing:1px;
  text-transform:uppercase;color:var(--td-text2)}
.td-help h4:first-of-type{margin-top:4px}
.td-help p{margin:0 0 6px;font-size:.86rem;line-height:1.6;color:var(--td-mut)}
.td-help .c1{color:rgba(245,165,36,0.85);font-weight:600}
.td-help .c2{color:rgba(56,189,248,0.8);font-weight:600}
.td-help .c3{color:rgba(167,139,250,0.8);font-weight:600}
.td-help .key{color:var(--td-text2);font-weight:600}
.td-daypick{display:flex;gap:5px}
.td-daypick button{width:34px;height:30px;background:var(--td-card2);border:1px solid var(--td-line);
  border-radius:7px;cursor:pointer;color:var(--td-text2);font-family:var(--td-font);font-size:.72rem}
.td-daypick button.on{border-color:var(--td-amber);color:var(--td-amber);background:var(--td-amber-dim)}
.td-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}
.td-btn{background:var(--td-amber);color:#161104;border:none;border-radius:8px;cursor:pointer;
  font-family:var(--td-font);font-size:.86rem;font-weight:700;padding:9px 18px}
.td-btn:disabled{opacity:.5;cursor:default}
.td-btn-ghost{background:transparent;color:var(--td-text2);border:1px solid var(--td-line);
  border-radius:8px;cursor:pointer;font-family:var(--td-font);font-size:.86rem;padding:9px 16px}
.td-btn-ghost:hover{color:var(--td-text);border-color:var(--td-line2)}
.td-btn-danger{background:none;border:none;cursor:pointer;color:var(--td-red);
  font-family:var(--td-font);font-size:.82rem;margin-right:auto;padding:9px 4px}

/* ── Replan diff ── */
.td-diff{border:1px solid var(--td-line);border-radius:11px;overflow:hidden;margin-top:14px}
.td-diff-row{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;
  border-bottom:1px solid rgba(224,164,59,0.06)}
.td-diff-row:last-child{border-bottom:none}
.td-diff-row.off{opacity:.4}
.td-diff-type{font-size:.62rem;font-weight:800;letter-spacing:.8px;border-radius:5px;
  padding:2px 7px;flex:none;margin-top:2px}
.td-diff-type.add{color:var(--td-green);border:1px solid rgba(74,222,128,0.35)}
.td-diff-type.update{color:var(--td-amber);border:1px solid rgba(245,165,36,0.35)}
.td-diff-type.remove{color:var(--td-red);border:1px solid rgba(248,113,113,0.35)}
.td-diff-body{flex:1;min-width:0}
.td-diff-name{font-size:.88rem;font-weight:600}
.td-diff-reason{font-size:.78rem;color:var(--td-mut);margin-top:2px}
.td-replan-summary{font-size:.86rem;color:var(--td-text2);line-height:1.55;margin-top:8px}
.td-replan-err{font-size:.84rem;color:var(--td-red);margin-top:12px}
.td-spinner{width:15px;height:15px;border-radius:50%;border:2px solid var(--td-line2);
  border-top-color:var(--td-amber);animation:tdSpin .7s linear infinite;display:inline-block;
  vertical-align:-2px;margin-right:8px}
@keyframes tdSpin{to{transform:rotate(360deg)}}

/* ── Priority — gradient-only color language, no labels, no dots ──
   P1 amber/gold (high leverage) · P2 blue/cyan (normal) · P3 muted violet (light) */
.td-row.pri1:not(.now),.td-hab.pri1,.td-done-row.pri1{
  background:linear-gradient(270deg,rgba(245,165,36,0.16),rgba(245,165,36,0.03) 55%,transparent 78%)}
.td-row.pri2:not(.now),.td-hab.pri2,.td-done-row.pri2{
  background:linear-gradient(270deg,rgba(56,189,248,0.11),rgba(56,189,248,0.02) 48%,transparent 70%)}
.td-row.pri3:not(.now),.td-hab.pri3,.td-done-row.pri3{
  background:linear-gradient(270deg,rgba(167,139,250,0.085),rgba(167,139,250,0.015) 40%,transparent 62%)}
.td-row.pri1:not(.now):hover{background:linear-gradient(270deg,rgba(245,165,36,0.21),rgba(255,255,255,0.02) 60%)}
.td-row.pri2:not(.now):hover{background:linear-gradient(270deg,rgba(56,189,248,0.15),rgba(255,255,255,0.02) 52%)}
.td-row.pri3:not(.now):hover{background:linear-gradient(270deg,rgba(167,139,250,0.12),rgba(255,255,255,0.02) 44%)}

/* ── Time view: chronological agenda ──
   No row gradients here — priority lives in a thin left rail (P1 glows softly). */
.td-agenda .td-row{border-bottom:none;border-radius:9px;padding:10px 6px;margin:1px 0}
.td-row.agenda.pri1,.td-row.agenda.pri2,.td-row.agenda.pri3{background:none}
.td-row.agenda.pri1:hover,.td-row.agenda.pri2:hover,.td-row.agenda.pri3:hover{background:rgba(255,255,255,0.025)}
.td-row.agenda.now{background:rgba(245,165,36,0.055);border:none;margin:2px 0}
.td-agenda .td-row-time{width:52px;text-align:right;padding-right:2px;font-size:.76rem}
.td-rail{width:3px;align-self:stretch;min-height:20px;border-radius:2px;flex:none}
.td-rail.p1{background:rgba(245,165,36,0.8);box-shadow:0 0 8px rgba(245,165,36,0.35)}
.td-rail.p2{background:rgba(56,189,248,0.45)}
.td-rail.p3{background:rgba(167,139,250,0.35)}
.td-row.done .td-rail{opacity:.5;box-shadow:none}
.td-nowline{display:flex;align-items:center;gap:10px;margin:6px 0;
  font-size:.62rem;font-weight:800;letter-spacing:1.2px;color:var(--td-amber)}
.td-nowline::before{content:"";flex:none;width:52px}
.td-nowline::after{content:"";flex:1;height:1px;
  background:linear-gradient(90deg,rgba(245,165,36,0.55),rgba(245,165,36,0.05))}
.td-nowline .t{flex:none}

/* ── Bottom legend — quiet, out of the way ── */
.td-legend{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:center;
  font-size:.64rem;color:var(--td-faint);letter-spacing:.4px;margin:26px 0 6px;opacity:.8}
.td-legend b{font-weight:600}
.td-legend .c1{color:rgba(245,165,36,0.75)}
.td-legend .c2{color:rgba(56,189,248,0.7)}
.td-legend .c3{color:rgba(167,139,250,0.7)}
.td-legend .gest{display:none}
@media (max-width:719px){.td-legend .gest{display:inline}}

/* ── Row actions: desktop kebab + popover ── */
.td-swipe{position:relative;touch-action:pan-y}
.td-kebab{display:none;background:none;border:none;cursor:pointer;color:var(--td-faint);
  font-size:1.05rem;line-height:1;padding:4px 7px;border-radius:7px;flex:none}
.td-kebab:hover{color:var(--td-text);background:rgba(255,255,255,0.05)}
@media (min-width:720px){.td-kebab{display:inline-flex}}
.td-rowmenu{position:absolute;right:8px;top:calc(100% - 6px);z-index:25;min-width:130px;
  background:var(--td-card);border:1px solid var(--td-line2);border-radius:10px;padding:5px;
  box-shadow:0 12px 36px rgba(0,0,0,0.55)}
.td-rowmenu button{display:block;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  font-family:var(--td-font);font-size:.85rem;color:var(--td-text2);padding:8px 11px;border-radius:7px}
.td-rowmenu button:hover{background:var(--td-card2);color:var(--td-text)}
.td-rowmenu button.danger{color:var(--td-red)}
.td-rowmenu button.danger:hover{background:rgba(248,113,113,0.08)}

/* ── Mobile swipe reveals: right = edit (cyan) · left = delete (red) ── */
.td-swipe-under{position:absolute;inset:0;display:flex;align-items:center;
  justify-content:space-between;pointer-events:none;border-radius:10px}
.td-swipe-under .e,.td-swipe-under .d{display:inline-flex;align-items:center;gap:6px;
  font-size:.78rem;font-weight:700;letter-spacing:.5px;padding:0 16px;opacity:0;transition:opacity .12s}
.td-swipe-under .e{color:#7dd3fc}
.td-swipe-under .d{color:var(--td-red);margin-left:auto}
.td-swipe.swiping-r .td-swipe-under{background:linear-gradient(90deg,rgba(56,189,248,0.16),transparent 55%)}
.td-swipe.swiping-r .e{opacity:1}
.td-swipe.swiping-l .td-swipe-under{background:linear-gradient(270deg,rgba(248,113,113,0.18),transparent 55%)}
.td-swipe.swiping-l .d{opacity:1}

/* ── Sort toggle (Time | Priority) ── */
.td-sort{display:inline-flex;gap:2px;background:var(--td-card);border:1px solid var(--td-line);
  border-radius:8px;padding:2px}
.td-sort button{background:none;border:none;cursor:pointer;font-family:var(--td-font);
  font-size:.7rem;font-weight:700;letter-spacing:.6px;text-transform:uppercase;
  color:var(--td-faint);padding:4px 10px;border-radius:6px;transition:color .15s,background .15s}
.td-sort button:hover{color:var(--td-text2)}
.td-sort button.on{color:var(--td-amber);background:var(--td-amber-dim)}

/* ── Priority groups (priority sort mode) ── */
.td-pgroup{border:1px solid var(--td-line);border-radius:12px;margin:10px 0;overflow:hidden;
  background:rgba(255,255,255,0.012)}
.td-pgroup-head{display:flex;align-items:center;gap:8px;padding:9px 12px 7px;
  border-bottom:1px solid rgba(224,164,59,0.07)}
.td-pgroup-head .lbl{font-size:.66rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
.td-pgroup-head .n{margin-left:auto;font-size:.68rem;color:var(--td-faint)}
.td-pgroup.p1 .lbl{color:var(--td-amber)}
.td-pgroup.p2 .lbl{color:#7cc6f0}
.td-pgroup.p3 .lbl{color:#a78bfa}
.td-pgroup .td-row{padding-left:10px;padding-right:10px}
.td-pgroup .td-row.now{margin:4px 0}

/* ── Completed view ── */
.td-day-nav{display:flex;align-items:center;gap:10px;margin:22px 0 6px}
.td-day-btn{width:44px;height:44px;flex:none;background:var(--td-card);border:1px solid var(--td-line);
  border-radius:9px;cursor:pointer;color:var(--td-text2);font-size:1rem;line-height:1;
  display:inline-flex;align-items:center;justify-content:center;transition:border-color .15s,color .15s}
.td-day-btn:hover:not(:disabled){border-color:var(--td-line2);color:var(--td-text)}
.td-day-btn:disabled{opacity:.35;cursor:default}
.td-day-label{flex:1;text-align:center}
.td-day-label .d1{display:block;font-size:.95rem;font-weight:700}
.td-day-label .d2{display:block;font-size:.7rem;color:var(--td-faint);letter-spacing:.8px;
  text-transform:uppercase;margin-top:2px}
.td-day-pick{position:relative;width:44px;height:44px;flex:none}
.td-day-pick input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
.td-day-pick .ic{pointer-events:none;width:100%;height:100%;background:var(--td-card);
  border:1px solid var(--td-line);border-radius:9px;color:var(--td-text2);font-size:.85rem;
  display:inline-flex;align-items:center;justify-content:center}
.td-done-row{display:flex;align-items:center;gap:11px;padding:11px 2px;
  border-bottom:1px solid rgba(224,164,59,0.06)}
.td-done-mark{width:17px;height:17px;flex:none;border-radius:5px;background:rgba(74,222,128,0.16);
  border:1px solid rgba(74,222,128,0.4);color:var(--td-green);font-size:.62rem;
  display:inline-flex;align-items:center;justify-content:center}
.td-done-name{flex:1;font-size:.9rem;color:var(--td-text2);min-width:0;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.td-done-time{font-size:.7rem;color:var(--td-faint);font-variant-numeric:tabular-nums;flex:none}
.td-empty{color:var(--td-mut);font-size:.9rem;padding:18px 2px}

/* ── Skeleton ── */
.td-skel{height:42px;border-radius:9px;background:linear-gradient(90deg,var(--td-card) 25%,var(--td-card2) 50%,var(--td-card) 75%);
  background-size:200% 100%;animation:tdShimmer 1.4s infinite;margin:8px 0}
@keyframes tdShimmer{to{background-position:-200% 0}}

/* ── Mobile bottom tabs ── */
.td-tabs{display:none}
@media (max-width:719px){
  .td-bar-views{display:none}
  .td-tabs{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:40;
    background:rgba(10,8,5,0.96);backdrop-filter:blur(8px);border-top:1px solid var(--td-line)}
  .td-tab{flex:1;background:none;border:none;cursor:pointer;font-family:var(--td-font);
    font-size:.78rem;font-weight:600;color:var(--td-faint);padding:13px 0 max(13px,env(safe-area-inset-bottom))}
  .td-tab.active{color:var(--td-amber)}
}
`;
