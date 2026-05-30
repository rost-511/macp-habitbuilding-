import type { ReactNode } from "react";

export function UpgradePlaceholder() {
  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: ".8rem",
        color: "var(--text-dim)",
        flexWrap: "wrap",
      }}
    >
      <span>More daily generations available with</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: ".68rem",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--amber)",
          background: "var(--amber-dim)",
          border: "1px solid rgba(212,146,42,0.3)",
          borderRadius: "99px",
          padding: "2px 8px",
          whiteSpace: "nowrap",
        }}
      >
        MACP Pro — coming soon
      </span>
    </div>
  );
}

export function PremiumGate({
  isPremium,
  children,
  fallback = null,
}: {
  isPremium: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return isPremium ? <>{children}</> : <>{fallback}</>;
}
