/**
 * Branded pre-workout loader (FD: entering the player should feel like an
 * event, not a spinner): a barbell outline draws itself in, a stick figure
 * reps inside it, "RepUp" fades up, and speed-lines sweep past. Pure
 * SVG/CSS — no client JS, renders instantly as the route segment streams.
 */
export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "var(--bg)",
      }}
    >
      <div style={{ position: "relative", width: 220, height: 150 }}>
        {/* Speed lines */}
        <svg viewBox="0 0 220 150" width={220} height={150} style={{ position: "absolute", inset: 0 }} aria-hidden>
          {[28, 60, 122, 134].map((y, i) => (
            <line
              key={y}
              x1={-70}
              x2={-10}
              y1={y}
              y2={y}
              stroke="rgba(61,139,253,0.35)"
              strokeWidth={3}
              strokeLinecap="round"
              style={{ animation: `repup-line 1.1s linear ${i * 0.22}s infinite` }}
            />
          ))}
        </svg>

        {/* Barbell outline drawing itself */}
        <svg viewBox="0 0 220 150" width={220} height={150} style={{ position: "absolute", inset: 0 }} aria-hidden>
          <g fill="none" stroke="var(--blue)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
            {/* bar */}
            <path d="M30 75 H190" strokeDasharray={160} style={{ animation: "repup-draw 1.6s cubic-bezier(.4,0,.2,1) both" }} />
            {/* left plates */}
            <rect x={38} y={47} width={14} height={56} rx={5} strokeDasharray={150} style={{ animation: "repup-draw 1.6s cubic-bezier(.4,0,.2,1) .25s both" }} />
            <rect x={56} y={56} width={11} height={38} rx={4} strokeDasharray={110} style={{ animation: "repup-draw 1.6s cubic-bezier(.4,0,.2,1) .4s both" }} />
            {/* right plates */}
            <rect x={168} y={47} width={14} height={56} rx={5} strokeDasharray={150} style={{ animation: "repup-draw 1.6s cubic-bezier(.4,0,.2,1) .25s both" }} />
            <rect x={153} y={56} width={11} height={38} rx={4} strokeDasharray={110} style={{ animation: "repup-draw 1.6s cubic-bezier(.4,0,.2,1) .4s both" }} />
          </g>

          {/* Stick figure squatting the bar (SMIL loop, pauses at the bottom) */}
          <g stroke="var(--ink)" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: "repup-fade .5s ease .9s both" }}>
            <circle r={7} fill="var(--ink)" stroke="none" cx={110} cy={52}>
              <animate attributeName="cy" values="52;66;66;52" keyTimes="0;0.4;0.6;1" calcMode="spline" keySplines=".42 0 .58 1;0 0 1 1;.42 0 .58 1" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <polyline points="110,60 110,96">
              <animate attributeName="points" values="110,60 110,96;110,74 110,102;110,74 110,102;110,60 110,96" keyTimes="0;0.4;0.6;1" calcMode="spline" keySplines=".42 0 .58 1;0 0 1 1;.42 0 .58 1" dur="2.6s" repeatCount="indefinite" />
            </polyline>
            <polyline points="110,96 98,118 96,132">
              <animate attributeName="points" values="110,96 98,118 96,132;110,102 90,110 92,132;110,102 90,110 92,132;110,96 98,118 96,132" keyTimes="0;0.4;0.6;1" calcMode="spline" keySplines=".42 0 .58 1;0 0 1 1;.42 0 .58 1" dur="2.6s" repeatCount="indefinite" />
            </polyline>
            <polyline points="110,96 122,118 124,132">
              <animate attributeName="points" values="110,96 122,118 124,132;110,102 130,110 128,132;110,102 130,110 128,132;110,96 122,118 124,132" keyTimes="0;0.4;0.6;1" calcMode="spline" keySplines=".42 0 .58 1;0 0 1 1;.42 0 .58 1" dur="2.6s" repeatCount="indefinite" />
            </polyline>
            <polyline points="110,64 92,75">
              <animate attributeName="points" values="110,64 92,75;110,78 92,75;110,78 92,75;110,64 92,75" keyTimes="0;0.4;0.6;1" calcMode="spline" keySplines=".42 0 .58 1;0 0 1 1;.42 0 .58 1" dur="2.6s" repeatCount="indefinite" />
            </polyline>
            <polyline points="110,64 128,75">
              <animate attributeName="points" values="110,64 128,75;110,78 128,75;110,78 128,75;110,64 128,75" keyTimes="0;0.4;0.6;1" calcMode="spline" keySplines=".42 0 .58 1;0 0 1 1;.42 0 .58 1" dur="2.6s" repeatCount="indefinite" />
            </polyline>
          </g>
        </svg>
      </div>

      <div style={{ textAlign: "center", animation: "repup-rise .6s cubic-bezier(.4,0,.2,1) .5s both" }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Rep<span style={{ color: "var(--blue)" }}>Up</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 4 }}>Loading your session…</div>
      </div>

      <style>{`
        @keyframes repup-draw { from { stroke-dashoffset: 160; opacity: .4; } to { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes repup-line { 0% { transform: translateX(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateX(300px); opacity: 0; } }
        @keyframes repup-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes repup-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001s !important; }
        }
      `}</style>
    </div>
  );
}
