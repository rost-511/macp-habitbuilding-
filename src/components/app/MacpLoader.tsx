// MacpLoader — presentational boot/setup loader (Project 14D — Task 4). Props only; no state, hooks, or side effects.
export function MacpLoader({ variant = "boot" }: { variant?: "boot" | "setup" }) {
  // Premium post-auth transition — neutral hand-off while we route the user.
  if (variant === "setup") {
    return (
      <div className="setup-wrap grain">
        <div className="setup-pill">M · A · C · P SYSTEM</div>
        <h1 className="setup-title">Opening your <em>system…</em></h1>
        <p className="setup-sub">Checking your setup and sending you to the right place.</p>
        <div className="setup-bar"><div className="setup-bar-fill" /></div>
        <div className="setup-steps">
          <div className="setup-step done"><span className="setup-check">✓</span> Account verified</div>
          <div className="setup-step done"><span className="setup-check">✓</span> Setup checked</div>
          <div className="setup-step pending"><span className="setup-ring" /> Opening MACP</div>
        </div>
      </div>
    );
  }
  // Minimal boot loader (unchanged behavior on app cold-start).
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
        fontSize: ".9rem",
        fontWeight: 700,
        letterSpacing: ".02em",
      }}
    >
      Loading MACP…
    </div>
  );
}
