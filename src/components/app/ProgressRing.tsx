// ProgressRing — tiny presentational ring (Project 14D — Task 4). Props only; no state, hooks, or side effects.
export function ProgressRing({ pct }) {
  const r = 52, circ = 2*Math.PI*r;
  const dash = circ*(1-pct/100);
  return (
    <div className="ring-wrap fu fu2">
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
