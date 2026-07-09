/** STYLE.md circular progress ring: r=28, stroke 6, animated dashoffset. */
export function ProgressRing({
  done,
  total,
  size = 64,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={32} cy={32} r={r} fill="none" stroke="var(--hairline)" strokeWidth={6} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke="var(--green)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size >= 64 ? 16 : 13,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {done}
        <span style={{ color: "var(--ink-faint)", fontWeight: 700 }}>/{total}</span>
      </div>
    </div>
  );
}
