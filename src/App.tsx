import { useState, useEffect, useRef, useCallback } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useClerk } from "@clerk/clerk-react";
import { useSupabase } from "./lib/useSupabase";
import {
  getMyProfile,
  completeOnboarding,
  saveCurrentPlan,
  getTodayProgress,
  saveTodayProgress,
  getProgressMonth,
  getProgressByDate,
} from "./lib/userData";
/* ─────────────────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

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
  --font-display:'Cormorant Garamond',serif;
  --font-body:'Outfit',sans-serif;
  --font-mono:'JetBrains Mono',monospace;
  --shadow:0 4px 32px rgba(0,0,0,0.6);
  --shadow-sm:0 2px 12px rgba(0,0,0,0.4);
}

html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:var(--font-body)}

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
.fu1{animation-delay:.06s}.fu2{animation-delay:.13s}.fu3{animation-delay:.20s}.fu4{animation-delay:.27s}.fu5{animation-delay:.34s}
.fi{animation:fadeIn .35s ease both}
.si{animation:slideIn .35s cubic-bezier(.22,.68,0,1.2) both}

/* ── Layout ── */
.app-shell{display:flex;flex-direction:column;min-height:100vh;overflow:hidden}

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
.page{flex:1;overflow-y:auto;overflow-x:hidden}

/* ── Landing ── */
.land{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - 56px);padding:60px 24px;text-align:center;gap:28px;
  background:radial-gradient(ellipse 70% 50% at 50% 0%,rgba(212,146,42,0.07) 0%,transparent 65%);
}
.land-eyebrow{
  font-family:var(--font-mono);font-size:.65rem;letter-spacing:.22em;text-transform:uppercase;
  color:var(--amber);border:1px solid rgba(212,146,42,0.35);border-radius:99px;padding:6px 18px;
}
.land-h1{
  font-family:var(--font-display);font-size:clamp(3.2rem,9vw,6.5rem);font-weight:700;
  line-height:.92;letter-spacing:-.01em;max-width:820px;
}
.land-h1 em{color:var(--amber);font-style:italic}
.land-sub{font-size:1.05rem;color:var(--text-mid);max-width:480px;line-height:1.7;font-weight:300}
.land-frameworks{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.fw-badge{
  font-family:var(--font-mono);font-size:.63rem;letter-spacing:.1em;text-transform:uppercase;
  border:1px solid var(--border2);border-radius:4px;padding:5px 12px;color:var(--text-dim);
  background:var(--surface);
}
.land-cta{
  margin-top:8px;padding:18px 48px;
  font-family:var(--font-body);font-size:1rem;font-weight:700;letter-spacing:.05em;
  background:var(--amber);color:#07080a;border:none;border-radius:var(--r);
  cursor:pointer;transition:all .22s;
  box-shadow:0 0 40px rgba(212,146,42,0.35),0 4px 16px rgba(0,0,0,0.5);
}
.land-cta:hover{transform:translateY(-2px);box-shadow:0 0 60px rgba(212,146,42,0.45),0 8px 24px rgba(0,0,0,0.5)}
.land-cta:active{transform:translateY(0)}

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
.rev-sub{font-size:.92rem;color:var(--text-mid);margin-bottom:40px;line-height:1.6}
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
.rev-insight-body{padding:20px;font-size:.9rem;line-height:1.85;color:var(--text-mid);white-space:pre-wrap}
.rev-insight-body .rh{
  font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--amber);
  margin:16px 0 6px;display:block;
}

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

/* responsive */
@media(max-width:768px){
  .stats{grid-template-columns:1fr 1fr}
  .dgrid{grid-template-columns:1fr}
  .dright{position:static}
  .topbar-nav{display:none}
  .land-h1{font-size:3rem}
  .star-grid{grid-template-columns:1fr 1fr}
  .row2{grid-template-columns:1fr}
  .profile-grid{grid-template-columns:1fr}
}
`;

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────────────────────── */
const GOALS   = ["Finish degree","Launch a product","Get fit & healthy","Build a business","Read 12 books/year","Learn a new skill","Improve sleep quality","Reduce stress","Save money","Career promotion"];
const HABITS_CATS = ["Morning Routine","Deep Work","Exercise","Business","Study","Evening Wind-down","Nutrition","Mindfulness","Reading","Networking"];
const WORKOUTS = [{v:"none",l:"No workout yet"},{v:"walk",l:"Daily walk"},{v:"home",l:"Home workout"},{v:"gym",l:"Gym session"}];
const SITUATIONS = ["College student","Working professional","Entrepreneur","Freelancer","Student + job","Business owner"];
const ENERGY_LEVELS = [{v:"peak",l:"🔥 Peak",c:"#d4922a"},{v:"good",l:"✅ Good",c:"#2d9e5f"},{v:"low",l:"😴 Low",c:"#6b6870"},{v:"exam",l:"📚 Exam mode",c:"#3a7cbf"}];

const DAY_ABBRS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function tierFor(week) {
  if (week === 0) return { label:"Assessment", color:"#6b6870", level:0 };
  if (week <= 2)  return { label:"Tier 1 · Foundation", color:"#c9961a", level:1 };
  if (week <= 5)  return { label:"Tier 2 · Momentum", color:"#3a7cbf", level:2 };
                  return { label:"Tier 3 · Optimized", color:"#2d9e5f", level:3 };
}

function makeHabits(profile, tierLevel) {
  const base = [
    { id:"w1", name:"Drink 2 L of water", tag:"health",   tier:1 },
    { id:"w2", name:"No phone for first 30 min", tag:"morning", tier:1 },
    { id:"w3", name:"Complete the Frog Task", tag:"work",    tier:1 },
    { id:"w4", name:"10-min journaling", tag:"morning", tier:1 },
  ];
  if (tierLevel >= 2) {
    base.push({ id:"w5", name:"90-min deep work block", tag:"work",    tier:2 });
    base.push({ id:"w6", name:"Move for 20+ min",       tag:"health",  tier:2 });
  }
  if (tierLevel >= 3) {
    base.push({ id:"w7", name:"Business task logged",   tag:"business",tier:3 });
    base.push({ id:"w8", name:"Evening review done",    tag:"evening", tier:3 });
    base.push({ id:"w9", name:"Read 20 pages",          tag:"evening", tier:3 });
  }
  (profile.customHabits || []).forEach((h, i) =>
    base.push({ id:`c${i}`, name:h.name, tag:h.tag, tier:2, custom:true })
  );
  return base;
}

function makeTimeline(profile) {
  const [wH, wM] = (profile.wakeTime || "06:00").split(":").map(Number);
  const t = (dh, dm=0) => {
    const total = wH*60 + wM + dh*60 + dm;
    return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
  };
  const slots = [
    { time:t(0),   name:"Wake + Hydrate",          note:"16 oz water before anything else",      phase:"morning" },
    { time:t(0,12),name:"Mindset (10 min)",         note:"Journal, set intention, breathe",        phase:"morning" },
  ];
  if (profile.workout !== "none")
    slots.push({ time:t(0,28),name:`${profile.workout==="gym"?"Gym":"Home Workout"} (30–45 min)`, note:"Non-negotiable movement", phase:"morning" });
  slots.push({ time:t(1,15), name:"🐸 EAT THE FROG",          note:"Hardest task first — no distractions",    phase:"work" });
  if (profile.collegeHours)
    slots.push({ time:t(2,45), name:`Study Block (${profile.collegeHours}h)`, note:"Active recall + Pomodoro",    phase:"work" });
  slots.push({ time:t(4,30), name:"Lunch + Recovery",            note:"Eat, short walk, no screens",            phase:"rest" });
  if (profile.workHours)
    slots.push({ time:t(5,30), name:`Work Block (${profile.workHours}h)`,   note:"Focused execution",               phase:"work" });
  if (profile.businessGoal)
    slots.push({ time:t(8,0),  name:"Business Block",              note:profile.businessGoal.slice(0,42),          phase:"business" });
  slots.push({ time:t(9,15),  name:"Evening Review (10 min)",      note:"Rate the day, write tomorrow's frog",     phase:"evening" });
  slots.push({ time:t(9,30),  name:"Wind-down",                    note:"Screen off, read, prepare for sleep",     phase:"evening" });
  return slots;
}

function nowMinutes() {
  const n = new Date();
  return n.getHours()*60 + n.getMinutes();
}

function timeToMin(str) {
  const [h,m] = str.split(":").map(Number);
  return h*60+m;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
}

function fmtSecs(s) {
  const m = Math.floor(s/60), sec = s%60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   API — STREAMING CLAUDE
───────────────────────────────────────────────────────────────────────────── */
async function streamClaude(prompt, onChunk, onDone, onError) {
  try {
    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.details || errorData?.error || "Failed to generate plan"
      );
    }

    const data = await res.json();

    if (!data.text) {
      throw new Error("No plan text returned from API");
    }

    onChunk(data.text);
onDone(data.text);
  } catch (e) {
    onError(e instanceof Error ? e.message : String(e));
  }
}

function buildPlanPrompt(profile) {
  const [wH, wM] = (profile.wakeTime || "06:00").split(":").map(Number);
  const t = (dh: number, dm = 0) => {
    const total = wH * 60 + wM + dh * 60 + dm;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  return `You are MACP — an elite habit-architecture AI. Analyze this user's profile and return ONLY a valid JSON object. No markdown, no code fences, no extra text — just the raw JSON.

USER PROFILE:
- Name: ${profile.name || "User"}
- Situation: ${profile.situation || "Not specified"}
- Wake time: ${profile.wakeTime}
- College/study hours per day: ${profile.collegeHours || 0}h
- Work hours per day: ${profile.workHours || 0}h
- Business goal: ${profile.businessGoal || "None"}
- Average energy level: ${profile.energyLevel}/10
- Workout: ${profile.workout}
- Goals: ${(profile.goals || []).join(", ")}
- Habit categories: ${(profile.categories || []).join(", ")}
- Constraints: ${profile.constraints || "None"}
- Main goal: ${profile.mainGoal || "Not specified"}

Return this exact JSON shape (all fields required):
{
  "aiPlanText": "<2–3 paragraph human-readable summary of the full plan — tier, identity, key habits, energy strategy>",
  "dashboard": {
    "identityStatement": "<one 'I am the type of person who...' sentence tailored to their goals>",
    "frogTask": {
      "title": "<their single most important daily task, specific to their goals, max 12 words>",
      "description": "<one sentence: why this task, what outcome it drives>",
      "category": "<one of: work | business | health | morning | evening>"
    },
    "habits": [
      { "id": "h1", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h2", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h3", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h4", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h5", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" }
    ],
    "dailyFlow": [
      { "time": "${t(0)}", "title": "Wake + Hydrate", "description": "16 oz water before anything else" },
      { "time": "${t(0, 15)}", "title": "<morning routine item>", "description": "<brief note>" },
      { "time": "${t(1, 15)}", "title": "🐸 Eat the Frog", "description": "<their specific frog task>" },
      { "time": "${profile.collegeHours ? `${t(2, 45)}` : `${t(2, 30)}`}", "title": "<work or study block>", "description": "<focus method or goal>" },
      { "time": "${t(4, 30)}", "title": "Lunch + Recovery", "description": "Eat, short walk, no screens" },
      { "time": "${t(6, 0)}", "title": "<afternoon block>", "description": "<task or goal>" },
      { "time": "${t(9, 0)}", "title": "Evening Review", "description": "Rate the day, write tomorrow's frog" },
      { "time": "${t(9, 30)}", "title": "Wind-down", "description": "Screen off, read, prepare for sleep" }
    ],
    "weeklyReviewFocus": "<the single most important metric or behaviour they should track weekly — be specific>",
    "lowEnergyFallback": [
      "<minimum habit 1 for bad days>",
      "<minimum habit 2 for bad days>",
      "<minimum habit 3 for bad days>"
    ]
  }
}

Rules:
- habits tag must be exactly one of: morning, work, health, business, evening
- dailyFlow time must be HH:MM 24-hour format
- habits array must have exactly 5 items with unique ids h1–h5
- Be specific to this user's actual goals — no generic advice
- aiPlanText must be a plain string (no JSON inside it)`;
}

function buildReviewPrompt(profile, scores, notes, completionPct) {
  const tier = tierFor(profile.week || 1);
  return `You are MACP weekly coach. Generate a personalized weekly review.

USER: ${profile.name || "User"} | ${tier.label} | Week ${profile.week || 1}
Habit completion this week: ${completionPct}%
Scores — Consistency: ${scores.consistency}/5, Energy mgmt: ${scores.energy}/5, Deep focus: ${scores.focus}/5
User notes: "${notes || "None provided"}"
Goals: ${(profile.goals || []).join(", ")}

Write using EXACT section headers:

WEEK GRADE
Give a letter grade (A/B/C/D) and a single honest sentence why.

WINS THIS WEEK
2 specific things they likely did right. Connect to their actual goals.

GROWTH EDGE
The one bottleneck holding them back. Be direct, not harsh.

TIER STATUS
Should they: Stay in ${tier.label}, advance a tier, or step back? Explain in one sentence.

NEXT WEEK'S KEYSTONE
The single most important habit to cement next week. Why that one?

RECOVERY PROTOCOL
If they missed days: a specific 3-step rebound plan. No guilt — only action.

Max 220 words. Be honest, warm, energizing — like a great coach, not a therapist.`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   FOCUS MODE TIMER
───────────────────────────────────────────────────────────────────────────── */
function FocusMode({ task, onExit, onDone }) {
  const TOTAL = 25*60;
  const [secs, setSecs] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setSecs(s => s > 0 ? s-1 : 0), 1000);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);

  const pct = (TOTAL - secs) / TOTAL;
  const r = 58, circ = 2*Math.PI*r;
  const dash = circ * (1-pct);

  return (
    <div className="focus-overlay" onClick={e => e.target===e.currentTarget && onExit()}>
      <div className="focus-label">🐸 FOCUS MODE · 25-MIN POMODORO</div>
      <div className="focus-task">"{task}"</div>

      <div className="focus-ring-wrap" style={{width:140,height:140}}>
        <svg width="140" height="140" style={{transform:"rotate(-90deg)"}}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border2)" strokeWidth="8"/>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--green)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
            style={{transition:"stroke-dashoffset 1s linear"}}/>
        </svg>
        <div className="focus-ring-center" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-mono)",fontSize:"1.4rem",color:"var(--green)"}}>
          {fmtSecs(secs)}
        </div>
      </div>

      <div className="focus-controls">
        {secs > 0
          ? <button className="focus-ctrl focus-start" onClick={() => setRunning(r=>!r)}>
              {running ? "⏸ Pause" : (secs===TOTAL ? "▶ Start" : "▶ Resume")}
            </button>
          : <button className="focus-done" onClick={onDone}>✓ Complete Frog Task</button>
        }
        <button className="focus-ctrl focus-exit" onClick={onExit}>Exit</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS RING
───────────────────────────────────────────────────────────────────────────── */
function ProgressRing({ pct }) {
  const r = 52, circ = 2*Math.PI*r;
  const dash = circ*(1-pct/100);
  return (
    <div className="ring-wrap">
      <svg width="120" height="120" className="ring-svg">
        <circle cx="60" cy="60" r={r} className="ring-bg"/>
        <circle cx="60" cy="60" r={r} className="ring-fg"
          strokeDasharray={circ} strokeDashoffset={dash}/>
      </svg>
      <div className="ring-center">
        <div className="ring-pct">{pct}%</div>
        <div className="ring-lbl">Done Today</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAR RATING
───────────────────────────────────────────────────────────────────────────── */
function StarRating({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-box">
      <div className="star-lbl">{label}</div>
      <div className="stars">
        {[1,2,3,4,5].map(n => (
          <span key={n} className="star"
            style={{color: n<=(hover||value)?"var(--amber)":"var(--border2)",fontSize:"1.4rem",cursor:"pointer"}}
            onClick={()=>onChange(n)}
            onMouseEnter={()=>setHover(n)}
            onMouseLeave={()=>setHover(0)}>★</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WIZARD
───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  { label:"Step 1 / 5", title:"Who are you?",               sub:"Build your identity profile." },
  { label:"Step 2 / 5", title:"Your Schedule",              sub:"Tell me when you live your life." },
  { label:"Step 3 / 5", title:"Goals & Ambition",           sub:"What are you building toward?" },
  { label:"Step 4 / 5", title:"Energy & Constraints",       sub:"Honesty here shapes everything." },
  { label:"Step 5 / 5", title:"Choose Habit Categories",    sub:"Where do you want to level up?" },
];

function Wizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [P, setP] = useState({
    name:"", situation:"", wakeTime:"06:00", workout:"none",
    collegeHours:"", workHours:"", businessGoal:"",
    goals:[], mainGoal:"", energyLevel:7, constraints:"", freeHours:"2",
    categories:[], customHabits:[], week:1,
  });
  const up = (k,v) => setP(p=>({...p,[k]:v}));
  const tog = (k,v) => { const a=P[k]||[]; up(k, a.includes(v)?a.filter(x=>x!==v):[...a,v]); };

  const s = STEPS[step];
  const pct = ((step+1)/STEPS.length)*100;

  const next = () => setStep(s=>Math.min(s+1, STEPS.length-1));
  const back = () => setStep(s=>Math.max(s-1, 0));

  return (
    <div className="wiz fu">
      <div className="wiz-step">{s.label}</div>
      <h2 className="wiz-title">{s.title}</h2>
      <p className="wiz-sub">{s.sub}</p>
      <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`}}/></div>

      {step===0 && (
        <div className="fgrp">
          <div className="field">
            <label>First name</label>
            <input value={P.name} onChange={e=>up("name",e.target.value)} placeholder="e.g. Jordan"/>
          </div>
          <div className="field">
            <label>Current situation</label>
            <div className="chips">
              {SITUATIONS.map(s=>(
                <div key={s} className={`chip ${P.situation===s?"on":""}`} onClick={()=>up("situation",s)}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step===1 && (
        <div className="fgrp">
          <div className="row2">
            <div className="field">
              <label>Wake time</label>
              <input type="time" value={P.wakeTime} onChange={e=>up("wakeTime",e.target.value)}/>
            </div>
            <div className="field">
              <label>Workout preference</label>
              <select value={P.workout} onChange={e=>up("workout",e.target.value)}>
                {WORKOUTS.map(w=><option key={w.v} value={w.v}>{w.l}</option>)}
              </select>
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label>Study hours / day</label>
              <input type="number" min="0" max="14" value={P.collegeHours} onChange={e=>up("collegeHours",e.target.value)} placeholder="0"/>
              <span className="field-hint">Enter 0 if not applicable</span>
            </div>
            <div className="field">
              <label>Work hours / day</label>
              <input type="number" min="0" max="14" value={P.workHours} onChange={e=>up("workHours",e.target.value)} placeholder="0"/>
            </div>
          </div>
          <div className="field">
            <label>Business goal (optional)</label>
            <input value={P.businessGoal} onChange={e=>up("businessGoal",e.target.value)} placeholder="e.g. Launch Shopify store by August"/>
          </div>
        </div>
      )}

      {step===2 && (
        <div className="fgrp">
          <div className="field">
            <label>Top goals (pick all that apply)</label>
            <div className="chips">
              {GOALS.map(g=>(
                <div key={g} className={`chip ${P.goals.includes(g)?"on":""}`} onClick={()=>tog("goals",g)}>{g}</div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Your main 90-day goal (in your own words)</label>
            <textarea value={P.mainGoal} onChange={e=>up("mainGoal",e.target.value)} placeholder="By the end of 90 days I want to..."/>
          </div>
        </div>
      )}

      {step===3 && (
        <div className="fgrp">
          <div className="field range-wrap">
            <label>Average daily energy (1 = exhausted, 10 = peak)</label>
            <input type="range" min="1" max="10" value={P.energyLevel} onChange={e=>up("energyLevel",Number(e.target.value))}/>
            <div className="range-labels">
              <span>1 · Exhausted</span>
              <span className="range-val">{P.energyLevel} / 10</span>
              <span>10 · Peak</span>
            </div>
          </div>
          <div className="field">
            <label>Free hours per day (realistic)</label>
            <select value={P.freeHours} onChange={e=>up("freeHours",e.target.value)}>
              {["< 1","1","2","3","4","5+"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Constraints or challenges</label>
            <textarea value={P.constraints} onChange={e=>up("constraints",e.target.value)}
              placeholder="e.g. Exam in 3 weeks, irregular shifts, anxiety in mornings, chronic fatigue..."/>
          </div>
        </div>
      )}

      {step===4 && (
        <div className="fgrp">
          <div className="field">
            <label>Focus areas (choose your habit categories)</label>
            <div className="chips">
              {HABITS_CATS.map(c=>(
                <div key={c} className={`chip ${P.categories.includes(c)?"on":""}`} onClick={()=>tog("categories",c)}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="btn-row">
        {step>0 && <button className="btn btn-ghost" onClick={back}>← Back</button>}
        {step<STEPS.length-1
          ? <button className="btn btn-amber" onClick={next}>Continue →</button>
          : <button className="btn btn-amber" onClick={()=>onComplete(P)}>Generate My Plan ✦</button>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GENERATING SCREEN
───────────────────────────────────────────────────────────────────────────── */
function Generating({ profile, onReady, supabase, onPlanGenerated }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    streamClaude(
      buildPlanPrompt(profile),
      chunk => setText(t=>t+chunk),
      async (fullText) => {
        setDone(true);
      
        let parsedPlan: Record<string, unknown>;
      
        try {
          const cleaned = fullText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
      
          const parsed = JSON.parse(cleaned);
      
          parsedPlan = {
            ...parsed,
            aiPlanText:
              typeof parsed.aiPlanText === "string"
                ? parsed.aiPlanText
                : fullText,
            generatedAt: new Date().toISOString(),
            profileSnapshot: profile,
          };
        } catch {
          parsedPlan = {
            aiPlanText: fullText,
            generatedAt: new Date().toISOString(),
            profileSnapshot: profile,
          };
        }
      
        setSaving(true);
      
        try {
          await saveCurrentPlan(supabase, parsedPlan);
          onPlanGenerated(parsedPlan);
        } catch (e) {
          console.error("Failed to save plan:", e);
          setErr("Plan generated, but failed to save. Do not refresh. Check Supabase/database.");
          return;
        } finally {
          setSaving(false);
        }
      },
      e => setErr(e)
    );
  }, []);

  const renderText = (raw) =>
    raw.split("\n").map((line, i) => {
      const isHeader = /^[A-Z][A-Z &\/\-']+$/.test(line.trim()) && line.trim().length > 3;
      return isHeader
        ? <span key={i} className="gh">{line}</span>
        : <span key={i}>{line}{"\n"}</span>;
    });

  return (
    <div className="wiz fu">
      <div className="wiz-step">✦ AI GENERATION</div>
      <h2 className="wiz-title">Building Your Plan</h2>
      <p className="wiz-sub">Claude is analyzing your profile and generating a personalized MACP routine.</p>

      <div className="gen-box">
        <div className="gen-header">
          {!done && <div className="gen-dot"/>}
          {done && <span style={{color:"var(--green)",fontSize:"1rem"}}>✓</span>}
          <div className="gen-title">
            {done ? "MACP PLAN COMPLETE" : "GENERATING YOUR PERSONALIZED ROUTINE..."}
          </div>
        </div>
        <div className="gen-body">
          {!text && !err && (
            <div className="gen-spinner">
              <div className="spinner"/>
              Analyzing schedule, goals, and energy level...
            </div>
          )}
          {err && <div style={{color:"var(--red)",fontSize:".88rem"}}>Error: {err}<br/>Check that the API is connected.</div>}
          {text && (
            <div className="gen-text">
              {renderText(text)}
              {!done && <span className="gen-cursor"/>}
            </div>
          )}
        </div>
      </div>

      <div className="btn-row">
      {done && !saving && (
  <button className="btn btn-amber" onClick={onReady}>
    Open My Dashboard →
  </button>
)}

{done && saving && (
  <button className="btn btn-amber" disabled style={{ opacity: 0.6 }}>
    Saving your plan…
  </button>
)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────────────────── */
function Dashboard({ profile, setProfile, plan = null, supabase, userId }) { 
  const tier = tierFor(profile.week || 1);

  const pd = (plan as any)?.dashboard ?? null;

  const timeline = pd?.dailyFlow
    ? pd.dailyFlow.map((f: any) => ({
        time: f.time,
        name: f.title,
        note: f.description,
      }))
    : makeTimeline(profile);

  const nowMin = nowMinutes();

  const [habits, setHabits] = useState(() =>
    pd?.habits?.length
      ? pd.habits.map((h: any) => ({ ...h, tier: 1 }))
      : makeHabits(profile, tier.level)
  );
  const [checked, setChecked] = useState({});
  const [frogDone, setFrogDone] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [energy, setEnergy] = useState(null);
const [progressReady, setProgressReady] = useState(false);
const [celebrate, setCelebrate] = useState(false);
  const [newHabit, setNewHabit] = useState({ name:"", tag:"work" });
  const [showAdd, setShowAdd] = useState(false);
  const progressSnapshot = () => ({
    habits_snapshot: habits,
    plan_snapshot: plan || {},
  });
  
  const persistProgress = async (next: {
    checked?: Record<string, boolean>;
    frog_done?: boolean;
    energy?: string | null;
  } = {}) => {
    if (!userId) return;
  
    try {
      await saveTodayProgress(supabase, userId, {
        checked: next.checked ?? checked,
        frog_done: next.frog_done ?? frogDone,
        energy: next.energy ?? energy,
        ...progressSnapshot(),
      });
    } catch (error) {
      console.error("Failed to save daily progress:", error);
    }
  };
  
  useEffect(() => {
    async function loadTodayProgress() {
      if (!userId) {
        setProgressReady(true);
        return;
      }
  
      setProgressReady(false);
  
      try {
        const saved = await getTodayProgress(supabase, userId);
  
        if (saved) {
          setChecked(saved.checked || {});
          setFrogDone(Boolean(saved.frog_done));
          setEnergy(saved.energy || null);
        }
      } catch (error) {
        console.error("Failed to load daily progress:", error);
      } finally {
        setProgressReady(true);
      }
    }
  
    loadTodayProgress();
  }, [supabase, userId]);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [analytics, setAnalytics] = useState({
    weekCompletion: 0,
    streak: 0,
    bestPct: 0,
    savedDays: 0,
    weekPcts: [0, 0, 0, 0, 0, 0, 0],
  });
  
  const dayPct = (row: any) => {
    if (!row) return 0;
  
    const habits = row.habits_snapshot || [];
    const checked = row.checked || {};
    const total = habits.length || Object.keys(checked).length || 0;
  
    if (!total) return 0;
  
    const done = Object.values(checked).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };
  
  useEffect(() => {
    async function loadDashboardAnalytics() {
      if (!userId) {
        setAnalyticsReady(true);
        return;
      }
      
      setAnalyticsReady(false);
  
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
  
        const rows = await getProgressMonth(supabase, userId, year, month);
  
        const byDate: Record<string, any> = {};
        rows.forEach((row: any) => {
          byDate[row.progress_date] = row;
        });
  
        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);
  
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  
        const weekDays = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          return d.toISOString().slice(0, 10);
        });
  
        const weekPcts = weekDays.map((date) => dayPct(byDate[date]));
        const weekCompletion = Math.round(
          weekPcts.reduce((sum, n) => sum + n, 0) / weekPcts.length
        );
  
        let streak = 0;
        const cursor = new Date(today);
  
        while (true) {
          const key = cursor.toISOString().slice(0, 10);
          const pct = dayPct(byDate[key]);
  
          if (pct <= 0) break;
  
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }
  
        const bestPct = rows.length
          ? Math.max(...rows.map((row: any) => dayPct(row)))
          : 0;
  
          setAnalytics({
            weekCompletion,
            streak,
            bestPct,
            savedDays: rows.length,
            weekPcts,
          });
        } catch (error) {
          console.error("Failed to load dashboard analytics:", error);
        } finally {
          setAnalyticsReady(true);
        }
    }
  
    loadDashboardAnalytics();
  }, [supabase, userId]);
  if (!progressReady || !analyticsReady) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--amber)",
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          letterSpacing: ".02em",
        }}
      >
        Loading MACP…
      </div>
    );
  }
  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = habits.length ? Math.round((doneCount/habits.length)*100) : 0;
  const weekDots =
  analytics.weekPcts?.length === 7
    ? analytics.weekPcts
    : [0, 0, 0, 0, 0, 0, 0];

const streak = weekDots.map((pct) => pct > 0);

  const toggleHabit = (id) => {
    const wasChecked = checked[id];
    const nextChecked = { ...checked, [id]: !checked[id] };
  
    setChecked(nextChecked);
    persistProgress({ checked: nextChecked });
  
    const nextDoneCount = Object.values(nextChecked).filter(Boolean).length;
  
    if (!wasChecked && nextDoneCount === habits.length) {
      setTimeout(() => setCelebrate(true), 300);
      setTimeout(() => setCelebrate(false), 3200);
    }
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    const h = { id:`u${Date.now()}`, name:newHabit.name.trim(), tag:newHabit.tag, tier:2, custom:true };
    setHabits(hs=>[...hs,h]);
    setProfile(p=>({...p, customHabits:[...(p.customHabits||[]), {name:h.name,tag:h.tag}]}));
    setNewHabit({name:"",tag:"work"});
    setShowAdd(false);
  };

  const removeHabit = (id) => setHabits(hs=>hs.filter(h=>h.id!==id));

  const frogTask =
  pd?.frogTask?.title ||
  profile.businessGoal ||
  profile.mainGoal ||
  "Your highest-leverage task today";

const frogDesc =
  pd?.frogTask?.description ||
  "This is the task that, when done, makes the rest of the day feel like a bonus. Brian Tracy's rule: do it before email, before social, before anything else.";

  return (
    <>
      {focusMode && (
        <FocusMode
          task={frogTask}
          onExit={()=>setFocusMode(false)}
          onDone={() => {
            setFrogDone(true);
            setFocusMode(false);
            persistProgress({ frog_done: true });
          }}
        />
      )}
      {celebrate && (
        <div className="celebrate" onClick={()=>setCelebrate(false)}>
          <div className="celebrate-box">
            <div className="celebrate-emoji">🏆</div>
            <div className="celebrate-title">All Habits Done!</div>
            <div className="celebrate-sub">
              You just compounded your identity.<br/>
              <span style={{color:"var(--amber)",fontStyle:"italic"}}>"{profile.name || "Champion"} is the type of person who shows up every day."</span>
            </div>
          </div>
        </div>
      )}

      <div className="dash">
        {/* Header */}
        <div className="dash-top fu">
          <div>
            <div className="dash-greet">
              Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"},{" "}
              <span>{profile.name || "Champion"}</span>
            </div>
            <div className="dash-date">{todayLabel()}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
            <div className="tier-pill">
              <div className="tier-pip" style={{background:tier.color}}/>
              <div className="tier-name">{tier.label}</div>
              <div className="tier-week">W{profile.week||1}</div>
            </div>
          </div>
        </div>

        {/* Energy check-in */}
        {progressReady && !energy && (
          <div className="card fu fu1" style={{marginBottom:20}}>
            <div className="card-hd">
              <div className="card-hd-l"><span className="card-icon">⚡</span><span className="card-title">Daily Check-in — How's your energy today?</span></div>
            </div>
            <div className="card-body">
              <div className="checkin-row">
                {ENERGY_LEVELS.map(e=>(
                  <button key={e.v}
                    className={`energy-btn ${energy===e.v?"sel":""}`}
                    style={energy===e.v?{borderColor:e.c,color:e.c,background:`${e.c}14`}:{}}
                    onClick={() => {
                      setEnergy(e.v);
                      persistProgress({ energy: e.v });
                    }}>
                    {e.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {energy && energy==="low" && (
          <div className="card fu fu1" style={{marginBottom:20,borderColor:"rgba(58,124,191,0.3)",background:"rgba(58,124,191,0.04)"}}>
            <div className="card-body" style={{display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:"1.5rem"}}>🌊</span>
              <div>
                <div style={{fontWeight:600,marginBottom:4}}>Low-Energy Mode Activated</div>
                <div style={{fontSize:".83rem",color:"var(--text-mid)"}}>Today's minimum: <strong>
  {pd?.lowEnergyFallback?.length
    ? pd.lowEnergyFallback.join(" · ")
    : "Frog task + hydrate + 10-min journal"}
</strong>. That's it. Showing up is the win.</div>
              </div>
              <button onClick={()=>setEnergy(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:"1.1rem"}}>×</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats fu fu2">
          <div className="stat">
            <div className="stat-lbl">Habits Today</div>
            <div className="stat-val">{doneCount}<span className="stat-unit">/{habits.length}</span></div>
            <div className={`stat-note ${doneCount>0?"pos":""}`}>{doneCount===0?"Not started yet":doneCount===habits.length?"All done! 🏆":"Keep going →"}</div>
          </div>
          <div className="stat">
            <div className="stat-lbl">Current Week</div>
            <div className="stat-val">{analytics.weekCompletion}<span className="stat-unit">%</span></div>
<div className="stat-note pos">Weekly average</div>
          </div>
          <div className="stat">
            <div className="stat-lbl">Streak</div>
            <div className="stat-val">{analytics.streak}<span className="stat-unit">days</span></div>
<div className={`stat-note ${analytics.streak > 0 ? "pos" : ""}`}>
  {analytics.streak > 0 ? "Keep it alive" : "Start today"}
</div>
          </div>
          <div className="stat">
  <div className="stat-lbl">Personal Best</div>
  <div className="stat-val">
    {analytics.bestPct}<span className="stat-unit">%</span>
  </div>
  <div className="stat-note pos">
    {analytics.savedDays} saved days this month
  </div>
</div>
        </div>

        {/* Main grid */}
        <div className="dgrid">
          <div className="dleft">
            {/* Frog Task */}
            <div className="card frog-card fu fu3">
              <div className="frog-hd">
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:"1.1rem"}}>🐸</span>
                  <span className="frog-tag">EAT THE FROG · HIGHEST LEVERAGE TASK</span>
                </div>
              </div>
              <div className="frog-body">
                <div className="frog-task">{frogTask}</div>
                <div className="frog-why">
                {frogDesc}.
                </div>
                <div className="frog-actions">
                  <button
                    className={`frog-done-btn ${frogDone?"done":""}`}
                    onClick={() => {
                      if (!frogDone) {
                        setFrogDone(true);
                        persistProgress({ frog_done: true });
                      }
                    }}
                  >{frogDone?"✓ Frog eaten!":"Mark Complete"}</button>
                  {!frogDone && (
                    <button className="focus-btn" onClick={()=>setFocusMode(true)}>
                      ⏱ Focus Mode (25 min)
                    </button>
                  )}
                </div>
              </div>
            </div>
            {plan?.aiPlanText && (
  <div className="card fu fu3" style={{ marginBottom: 16 }}>
    <div className="card-hd">
      <div className="card-hd-l">
        <span className="card-icon">✦</span>
        <span className="card-title">Your AI-Generated MACP Plan</span>
      </div>
    </div>

    <div className="card-body">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: ".78rem",
          lineHeight: 1.75,
          color: "var(--text-mid)",
          whiteSpace: "pre-wrap",
          maxHeight: 340,
          overflowY: "auto",
        }}
      >
        {plan.aiPlanText}
      </div>
    </div>
  </div>
)}
            {/* Habit stack */}
            <div className="card fu fu4">
              <div className="card-hd">
                <div className="card-hd-l">
                  <span className="card-icon">✓</span>
                  <span className="card-title">Today's Habit Stack</span>
                </div>
                <button className="card-action" onClick={()=>setShowAdd(s=>!s)}>+ Add habit</button>
              </div>
              <div className="card-body">
                <div className="habit-list">
                  {habits.map(h=>(
                    <div key={h.id} className="habit-row">
                      <div className={`hcheck ${checked[h.id]?"done":""}`} onClick={()=>toggleHabit(h.id)}>
                        {checked[h.id]?"✓":""}
                      </div>
                      <div className={`hname ${checked[h.id]?"done":""}`}>{h.name}</div>
                      <span className={`htag htag-${h.tag}`}>{h.tag}</span>
                      {h.custom && (
                        <button className="hdel" onClick={()=>removeHabit(h.id)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {showAdd && (
                  <div className="add-habit-row">
                    <input
                      className="add-habit-input"
                      value={newHabit.name}
                      onChange={e=>setNewHabit(n=>({...n,name:e.target.value}))}
                      onKeyDown={e=>e.key==="Enter"&&addHabit()}
                      placeholder="New habit name..."
                      autoFocus
                    />
                    <select
                      className="add-habit-select"
                      value={newHabit.tag}
                      onChange={e=>setNewHabit(n=>({...n,tag:e.target.value}))}
                    >
                      <option value="morning">morning</option>
                      <option value="work">work</option>
                      <option value="health">health</option>
                      <option value="business">business</option>
                      <option value="evening">evening</option>
                    </select>
                    <button className="add-habit-btn" onClick={addHabit}>Add</button>
                  </div>
                )}
              </div>
            </div>

            {/* Streak */}
            <div className="card fu fu5">
              <div className="card-hd">
                <div className="card-hd-l"><span className="card-icon">🔥</span><span className="card-title">This Week's Streak</span></div>
              </div>
              <div className="card-body">
                <div className="streak-grid">
                  {DAY_ABBRS.map((d,i)=>(
                    <div key={d} className="sday">
                      <div className={`sday-dot ${i===6?"today":streak[i]?"hit":"missed"}`}>
                        {streak[i]?"✓":i===6?"→":""}
                      </div>
                      <div className="sday-lbl">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="dright">
            <ProgressRing pct={pct}/>

            {/* Daily Timeline */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-l"><span className="card-icon">⏱</span><span className="card-title">Daily Flow</span></div>
              </div>
              <div className="card-body">
                <div className="tl">
                  {timeline.map((item,i)=>{
                    const itemMin = timeToMin(item.time);
                    const next = timeline[i+1];
                    const nextMin = next ? timeToMin(next.time) : itemMin+60;
                    const isPast = nowMin > nextMin;
                    const isNow  = nowMin >= itemMin && nowMin < nextMin;
                    return (
                      <div key={i} className="tl-row">
                        <div className="tl-spine">
                          <div className={`tl-dot ${isPast?"past":isNow?"now":""}`}/>
                          {i<timeline.length-1 && <div className={`tl-line ${isPast?"past":""}`}/>}
                        </div>
                        <div className="tl-content">
                          <div className="tl-time" style={isNow?{color:"var(--amber)"}:{}}>{item.time}</div>
                          <div className="tl-name" style={isNow?{color:"var(--text)",fontWeight:700}:isPast?{color:"var(--text-dim)"}:{}}>{item.name}</div>
                          <div className="tl-note">{item.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
/* ─────────────────────────────────────────────────────────────────────────────
   CALENDAR PAGE
───────────────────────────────────────────────────────────────────────────── */
function CalendarPage({ supabase, userId }) {
  const today = new Date().toISOString().slice(0, 10);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;

  const loadMonth = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getProgressMonth(supabase, userId, year, month);
      setRows(data || []);
    } catch (error) {
      console.error("Failed to load progress month:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const byDate = rows.reduce((acc, row) => {
    acc[row.progress_date] = row;
    return acc;
  }, {});

  const monthName = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month - 1, d));
  }

  const completionFor = (row) => {
    if (!row) return 0;
    const habits = row.habits_snapshot || [];
    const checked = row.checked || {};
    const total = habits.length || Object.keys(checked).length || 0;
    if (!total) return 0;
    const done = Object.values(checked).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  const selectDay = async (dateKey) => {
    if (!userId) return;

    try {
      const data = await getProgressByDate(supabase, userId, dateKey);
      setSelected(
        data || {
          progress_date: dateKey,
          checked: {},
          frog_done: false,
          energy: null,
          habits_snapshot: [],
          plan_snapshot: {},
        }
      );
    } catch (error) {
      console.error("Failed to load day progress:", error);
    }
  };

  const shiftMonth = (amount) => {
    setSelected(null);
    setCursor(new Date(year, month - 1 + amount, 1));
  };

  const selectedHabits = selected?.habits_snapshot || [];
  const selectedChecked = selected?.checked || {};
  const selectedPct = completionFor(selected);

  return (
    <div className="dash">
      <div className="dash-top fu">
        <div>
          <div className="dash-greet">
            Progress <span>Calendar</span>
          </div>
          <div className="dash-date">
            Daily habit history · saved per day
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-ghost" onClick={() => shiftMonth(-1)}>
            ←
          </button>
          <div className="tier-pill">
            <div className="tier-pip" style={{ background: "var(--amber)" }} />
            <div className="tier-name">{monthName}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => shiftMonth(1)}>
            →
          </button>
        </div>
      </div>

      <div className="dgrid">
        <div className="dleft">
          <div className="card fu fu1">
            <div className="card-hd">
              <div className="card-hd-l">
                <span className="card-icon">◌</span>
                <span className="card-title">
                  {loading ? "Loading month..." : "Monthly Progress"}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {DAY_ABBRS.map((d) => (
                  <div
                    key={d}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: ".62rem",
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      letterSpacing: ".1em",
                      textAlign: "center",
                      paddingBottom: 8,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 8,
                }}
              >
                {cells.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;

                  const dateKey = date.toISOString().slice(0, 10);
                  const row = byDate[dateKey];
                  const pct = completionFor(row);
                  const isToday = dateKey === today;

                  return (
                    <button
                      key={dateKey}
                      onClick={() => selectDay(dateKey)}
                      style={{
                        minHeight: 86,
                        borderRadius: "var(--r)",
                        border: isToday
                          ? "1px solid rgba(212,146,42,0.75)"
                          : "1px solid var(--border)",
                        background: row
                          ? "var(--surface2)"
                          : "rgba(255,255,255,0.015)",
                        color: row ? "var(--text)" : "var(--text-dim)",
                        cursor: "pointer",
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: ".72rem",
                          color: isToday ? "var(--amber)" : "inherit",
                        }}
                      >
                        {date.getDate()}
                      </span>

                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: row
                            ? `conic-gradient(var(--amber) ${pct}%, var(--border2) 0)`
                            : "var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "var(--surface)",
                            display: "block",
                          }}
                        />
                      </span>

                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: ".58rem",
                          color: row ? "var(--text-mid)" : "var(--text-dim)",
                        }}
                      >
                        {row ? `${pct}%` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="dright">
          <div className="card fu fu2">
            <div className="card-hd">
              <div className="card-hd-l">
                <span className="card-icon">✓</span>
                <span className="card-title">Day Detail</span>
              </div>
            </div>

            <div className="card-body">
              {!selected && (
                <div style={{ color: "var(--text-mid)", fontSize: ".86rem" }}>
                  Click any day to inspect saved habit progress.
                </div>
              )}

              {selected && (
                <>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--amber)",
                      fontSize: ".7rem",
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    {selected.progress_date}
                  </div>

                  <div className="ring-center" style={{ marginBottom: 18 }}>
                    <div className="ring-pct">{selectedPct}%</div>
                    <div className="ring-lbl">Completed</div>
                  </div>

                  <div className="info-row">
                    <span className="info-lbl">Frog Task</span>
                    <span className="info-val">
                      {selected.frog_done ? "Done ✓" : "Not done"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-lbl">Energy</span>
                    <span className="info-val">
                      {selected.energy || "Not logged"}
                    </span>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <div className="card-title" style={{ marginBottom: 10 }}>
                      Habits
                    </div>

                    <div className="habit-list">
                      {selectedHabits.length === 0 && (
                        <div style={{ color: "var(--text-dim)", fontSize: ".82rem" }}>
                          No saved habits for this day.
                        </div>
                      )}

                      {selectedHabits.map((h) => {
                        const done = Boolean(selectedChecked[h.id]);
                        return (
                          <div key={h.id} className="habit-row">
                            <div className={`hcheck ${done ? "done" : ""}`}>
                              {done ? "✓" : ""}
                            </div>
                            <div className={`hname ${done ? "done" : ""}`}>
                              {h.name}
                            </div>
                            <span className={`htag htag-${h.tag || "work"}`}>
                              {h.tag || "work"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────────────────
   WEEKLY REVIEW
───────────────────────────────────────────────────────────────────────────── */
function WeeklyReview({ profile, plan = null }) {
  const [scores, setScores] = useState({ consistency:0, energy:0, focus:0 });
  const [notes, setNotes] = useState("");
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const tier = tierFor(profile.week||1);

  const simsCompletion = 71;

  const run = async () => {
    setLoading(true); setInsight(""); setDone(false);
    await streamClaude(
      buildReviewPrompt(profile, scores, notes, simsCompletion),
      c => setInsight(t=>t+c),
      () => { setLoading(false); setDone(true); },
      () => setLoading(false)
    );
  };

  const renderInsight = (raw) =>
    raw.split("\n").map((line,i)=>{
      const isH = /^[A-Z][A-Z &\/\-']+$/.test(line.trim()) && line.trim().length>3;
      return isH ? <span key={i} className="rh">{line}</span> : <span key={i}>{line}{"\n"}</span>;
    });

  return (
    <div className="rev fu">
      <div className="wiz-step">WEEKLY REVIEW · WEEK {profile.week||1}</div>
      <h2 className="rev-h1">How Was This Week?</h2>
      <p className="rev-sub">
        Honest reflection is the compound interest of habit systems.<br/>
        <span style={{fontFamily:"var(--font-mono)",fontSize:".72rem",color:"var(--amber)"}}>{tier.label}</span>
      </p>
      {(plan as any)?.dashboard?.weeklyReviewFocus && (
  <div style={{
    marginBottom:28,
    padding:"14px 18px",
    background:"var(--amber-dim)",
    border:"1px solid rgba(212,146,42,0.3)",
    borderRadius:"var(--r)",
    fontFamily:"var(--font-mono)",
    fontSize:".74rem",
    lineHeight:1.6,
    color:"var(--text)",
  }}>
    <span style={{color:"var(--amber)",fontWeight:600,letterSpacing:".08em"}}>
      ✦ YOUR FOCUS THIS WEEK
    </span>
    <br/>
    {(plan as any).dashboard.weeklyReviewFocus}
  </div>
)}
      {/* Completion stat */}
      <div className="rev-section">
        <div className="rev-sec-title">Habit Completion This Week</div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"3.5rem",fontWeight:700,color:"var(--amber)",lineHeight:1}}>{simsCompletion}%</div>
          <div>
            <div style={{fontSize:".9rem",fontWeight:600}}>
              {simsCompletion>=80?"Strong week — you're compounding.":simsCompletion>=60?"Decent — one more push needed.":"Restart mode. Small wins matter."}
            </div>
            <div style={{fontSize:".78rem",color:"var(--text-dim)",marginTop:4}}>Target: 80% or above</div>
          </div>
        </div>
        <div style={{marginTop:16,height:6,background:"var(--border)",borderRadius:99,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${simsCompletion}%`,background:simsCompletion>=80?"var(--green)":simsCompletion>=60?"var(--amber)":"var(--red)",borderRadius:99,transition:"width 1s ease"}}/>
        </div>
      </div>

      {/* Star ratings */}
      <div className="rev-section">
        <div className="rev-sec-title">Self-Rate Your Week</div>
        <div className="star-grid">
          <StarRating label="Consistency" value={scores.consistency} onChange={v=>setScores(s=>({...s,consistency:v}))}/>
          <StarRating label="Energy Mgmt" value={scores.energy} onChange={v=>setScores(s=>({...s,energy:v}))}/>
          <StarRating label="Deep Focus" value={scores.focus} onChange={v=>setScores(s=>({...s,focus:v}))}/>
        </div>
      </div>

      {/* Notes */}
      <div className="rev-section">
        <div className="rev-sec-title">Your Reflection</div>
        <div className="field">
          <label>What worked? What didn't? What surprised you?</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            style={{minHeight:110}}
            placeholder="This week I managed to... I struggled with... I noticed that my energy was..."/>
        </div>
      </div>

      <div style={{marginBottom:28}}>
        <button className="btn btn-amber" onClick={run} disabled={loading}>
          {loading ? "Analyzing your week..." : "✦ Generate AI Weekly Insight"}
        </button>
      </div>

      {(insight||loading) && (
        <div className="rev-insight si">
          <div className="rev-insight-hd">
            {loading && <div className="spinner"/>}
            {!loading && <span style={{color:"var(--green)"}}>✓</span>}
            <span style={{fontFamily:"var(--font-mono)",fontSize:".65rem",letterSpacing:".14em",textTransform:"uppercase",color:"var(--amber)"}}>
              MACP WEEKLY INSIGHT
            </span>
          </div>
          <div className="rev-insight-body">
            {renderInsight(insight)}
            {loading && <span className="gen-cursor"/>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SETTINGS / PROFILE
───────────────────────────────────────────────────────────────────────────── */
function Settings({ profile, setProfile, onReset }) {
  const tier = tierFor(profile.week||1);
  const [week, setWeek] = useState(profile.week||1);

  const updateWeek = (w) => {
    setWeek(w);
    setProfile(p=>({...p, week:w}));
  };

  const exportJSON = () => {
    const data = {
      profile,
      exportedAt: new Date().toISOString(),
      tier: tier.label,
      timeline: makeTimeline(profile),
    };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="macp_plan.json"; a.click();
  };

  const exportCSV = () => {
    const habits = makeHabits(profile, tier.level);
    const rows = [["id","name","tag","tier"],...habits.map(h=>[h.id,`"${h.name}"`,h.tag,h.tier])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="macp_habits.csv"; a.click();
  };

  return (
    <div className="set fu">
      <div className="wiz-step">SETTINGS & PROFILE</div>
      <h2 className="set-h1">Your MACP Profile</h2>
      <p className="set-sub">Adjust your week, tier, and export your plan at any time.</p>

      {/* Profile info */}
      <div className="set-section">
        <div className="set-sec-title">Profile</div>
        <div className="card">
          <div className="card-body">
            {[
              ["Name", profile.name||"—"],
              ["Situation", profile.situation||"—"],
              ["Wake time", profile.wakeTime],
              ["Study hours/day", profile.collegeHours||"0"],
              ["Work hours/day", profile.workHours||"0"],
              ["Energy level", `${profile.energyLevel}/10`],
              ["Business goal", profile.businessGoal||"—"],
            ].map(([l,v])=>(
              <div key={l} className="info-row">
                <span className="info-lbl">{l}</span>
                <span className="info-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier / Week selector */}
      <div className="set-section">
        <div className="set-sec-title">Progression — Current Week</div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
          <button className="btn btn-ghost" style={{padding:"10px 18px"}} onClick={()=>updateWeek(Math.max(1,week-1))}>−</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"2.5rem",fontWeight:700,lineHeight:1}}>{week}</div>
            <div style={{fontFamily:"var(--font-mono)",fontSize:".62rem",color:"var(--text-dim)",letterSpacing:".12em",textTransform:"uppercase"}}>Week</div>
          </div>
          <button className="btn btn-ghost" style={{padding:"10px 18px"}} onClick={()=>updateWeek(Math.min(12,week+1))}>+</button>
          <div style={{flex:1,textAlign:"right"}}>
            <div className="tier-pill" style={{justifyContent:"flex-end"}}>
              <div className="tier-pip" style={{background:tier.color}}/>
              <div className="tier-name">{tier.label}</div>
            </div>
          </div>
        </div>
        <div className="tier-strip">
          {[
            {w:[0,0],l:"Assessment",n:"Week 0"},
            {w:[1,2],l:"Foundation",n:"Wk 1–2"},
            {w:[3,5],l:"Momentum", n:"Wk 3–5"},
            {w:[6,12],l:"Optimized",n:"Wk 6–12"},
          ].map((t,i)=>{
            const active = (week>=t.w[0] && week<=t.w[1]) || (i===3 && week>=6);
            return (
              <div key={i} className={`tier-seg ${active?"active":""}`} onClick={()=>updateWeek(t.w[0])}>
                <div className="tier-seg-num">Tier {i}</div>
                <div className="tier-seg-name">{t.l}</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:".55rem",color:"var(--text-dim)",marginTop:3}}>{t.n}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Placeholder library */}
      <div className="set-section">
        <div className="set-sec-title">Template Placeholders (Live Values)</div>
        <div className="card">
          <div className="card-body" style={{fontFamily:"var(--font-mono)",fontSize:".72rem",lineHeight:2.1}}>
            {[
              [`{{user_name}}`, profile.name||"—"],
              [`{{wake_time}}`, profile.wakeTime],
              [`{{college_hours}}`, profile.collegeHours||"0"],
              [`{{work_hours}}`, profile.workHours||"0"],
              [`{{business_goal}}`, profile.businessGoal||"—"],
              [`{{energy_level}}`, `${profile.energyLevel}/10`],
              [`{{tier_level}}`, tier.label],
              [`{{current_week}}`, `Week ${profile.week||1}`],
              [`{{daily_frog}}`, profile.businessGoal||profile.mainGoal||"Priority task"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid var(--border)",padding:"2px 0"}}>
                <span style={{color:"var(--amber)"}}>{k}</span>
                <span style={{color:"var(--text-mid)"}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="set-section">
        <div className="set-sec-title">Export Your Plan</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <button className="btn btn-main" onClick={exportJSON}>⬇ Export JSON</button>
          <button className="btn btn-main" onClick={exportCSV}>⬇ Export CSV (Habits)</button>
          <button className="btn btn-ghost" onClick={onReset} style={{marginLeft:"auto",color:"var(--red)",borderColor:"rgba(201,82,82,0.3)"}}>
            ↺ Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LANDING
───────────────────────────────────────────────────────────────────────────── */
function Landing({
  onStart,
  onDashboard = () => {},
}: {
  onStart: () => void;
  onDashboard?: () => void;
}) {
  const { isSignedIn } = useAuth(); // Checks if a user is logged in
  const { openSignIn } = useClerk(); // Opens the popup modal dynamically
  const supabase = useSupabase();

  const handleAssessmentClick = async () => {
    if (!isSignedIn) {
      openSignIn({ mode: "modal" });
      return;
    }
  
    try {
      const profile = await getMyProfile(supabase);
  
      if (profile?.onboarding_completed) {
        onDashboard();
        return;
      }
  
      onStart();
    } catch (error) {
      console.error("Failed to check profile:", error);
      onStart();
    }
  };

  return (
    <div className="land">
      {/* --- CLERK AUTHENTICATION HEADER (FIXED POSITION) --- */}
      <header style={{ position: 'absolute', top: '8px', right: '16px', zIndex: 100 }}>
        <SignedOut>
          <SignInButton mode="modal">
          <button
  style={{
    background: "var(--amber)",
    color: "#07080a",
    border: "1px solid rgba(212,146,42,0.55)",
    borderRadius: "var(--r)",
    padding: "8px 16px",
    fontFamily: "var(--font-body)",
    fontSize: ".86rem",
    fontWeight: 600,
    letterSpacing: ".03em",
    cursor: "pointer",
    boxShadow: "0 0 18px rgba(212,146,42,0.22)",
  }}
>
  Sign In
</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </header>
      {/* ------------------------------------ */}
      <div className="land-eyebrow fu">M · A · C · P SYSTEM</div>
      <h1 className="land-h1 fu fu1">
        Turn your schedule<br/>into a <em>compounding</em><br/>habit machine
      </h1>
      <p className="land-sub fu fu2">
        MACP ingests your real schedule, energy, and goals — then builds a personalized daily system you'll actually follow, using the best frameworks in behavioral science.
      </p>
      <div className="land-frameworks fu fu3">
        {["Atomic Habits","Eat That Frog","Drive","Progressive Tiers","AI-Powered","Weekly Review","Frog Task Engine","Streak Tracking"].map(f=>(
          <span key={f} className="fw-badge">{f}</span>
        ))}
      </div>
      <button className="land-cta fu fu4" onClick={handleAssessmentClick}>
  Begin Your Assessment →
</button>
      <div className="fu fu5" style={{fontFamily:"var(--font-mono)",fontSize:".62rem",letterSpacing:".1em",color:"var(--text-dim)",marginTop:8}}>
        Takes 3 minutes · Personalized by Claude AI · No fluff
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   APP SHELL
───────────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState("landing");
const [profile, setProfile] = useState<any>(null);
const [plan, setPlan] = useState<any>(null);
const [booting, setBooting] = useState(true);

  const supabase = useSupabase();
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    async function checkSavedUser() {
      if (!isLoaded) return;
  
      if (!isSignedIn) {
        setBooting(false);
        return;
      }
  
      try {
        const savedProfile = await getMyProfile(supabase);
  
        if (savedProfile?.onboarding_completed) {
          setProfile(savedProfile.onboarding_answers);
  
          const hasSavedPlan =
            savedProfile.current_plan &&
            Object.keys(savedProfile.current_plan).length > 0;
  
          if (hasSavedPlan) {
            setPlan(savedProfile.current_plan);
            setScreen("dashboard");
          } else {
            setScreen("generating");
          }
        }
      } catch (error) {
        console.error("Failed to load saved user:", error);
      } finally {
        setBooting(false);
      }
    }
  
    checkSavedUser();
  }, [isLoaded, isSignedIn, supabase]);

  const handleWizardComplete = async (p) => {
    setProfile(p);
  
    try {
      await completeOnboarding(supabase, p);
      setScreen("generating");
    } catch (error) {
      console.error("Failed to save onboarding:", error);
      alert("Your assessment could not be saved. Please try again.");
    }
  };
  const handlePlanGenerated = (generatedPlan) => {
    setPlan(generatedPlan);
  };
  const handlePlanReady      = ()  => setScreen("dashboard");
  const handleReset          = ()  => { setProfile(null); setScreen("landing"); };

  const NAV = profile ? [
    { id:"dashboard", label:"Dashboard" },
    { id:"calendar", label:"Calendar" },
    { id:"review", label:"Weekly Review" },
    { id:"settings", label:"Profile & Export" },
  ] : [];
  if (booting) {
    return (
      <>
        <style>{STYLES}</style>
        <div
          className="app-shell grain"
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div>Loading MACP…</div>
        </div>
      </>
    );
  }
  return (
    <>
      <style>{STYLES}</style>
      <div className="app-shell grain">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-logo" onClick={()=>profile&&setScreen("dashboard")}>
            MACP<span> system</span>
          </div>
          <div className="topbar-nav">
            {NAV.map(n=>(
              <button key={n.id} className={`topbar-btn ${screen===n.id?"active":""}`} onClick={()=>setScreen(n.id)}>
                {n.label}
              </button>
            ))}
            {!profile && screen!=="landing" && (
              <button className="topbar-btn" onClick={()=>setScreen("landing")}>← Home</button>
            )}
          </div>
          {profile && (
            <div className="topbar-tag">{tierFor(profile.week||1).label}</div>
          )}
        </div>

        {/* Page */}
        <div className="page">
        {screen==="landing" && (
  <Landing
    onStart={() => setScreen("wizard")}
    onDashboard={() => setScreen("dashboard")}
  />
)}
          {screen==="wizard"     && <Wizard onComplete={handleWizardComplete}/>}
          {screen==="generating" && (
  <Generating
    profile={profile}
    onReady={handlePlanReady}
    supabase={supabase}
    onPlanGenerated={handlePlanGenerated}
  />
)}
          {profile && ["dashboard", "calendar", "review", "settings"].includes(screen) && (
  <>
    <div style={{ display: screen === "dashboard" ? "block" : "none" }}>
      <Dashboard
        profile={profile}
        setProfile={setProfile}
        plan={plan}
        supabase={supabase}
        userId={userId}
      />
    </div>

    <div style={{ display: screen === "calendar" ? "block" : "none" }}>
      <CalendarPage
        supabase={supabase}
        userId={userId}
      />
    </div>

    <div style={{ display: screen === "review" ? "block" : "none" }}>
      <WeeklyReview profile={profile} plan={plan} />
    </div>

    <div style={{ display: screen === "settings" ? "block" : "none" }}>
      <Settings
        profile={profile}
        setProfile={setProfile}
        onReset={handleReset}
      />
    </div>
  </>
)}
        </div>
      </div>
    </>
  );
}