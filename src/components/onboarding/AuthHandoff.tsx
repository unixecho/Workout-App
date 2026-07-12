"use client";

import { useEffect, useState, type CSSProperties } from "react";

const EASE = "cubic-bezier(.4,0,.2,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const EXIT_MS = 240;

/**
 * Animated interstitial shown between tapping "Continue with Google" and the
 * actual OAuth redirect: explains the hop to Google and exactly what RepUp
 * receives (name + email, nothing else) before handing off.
 */
export function AuthHandoff({
  open,
  busy,
  error,
  onContinue,
  onClose,
}: {
  open: boolean;
  busy: boolean;
  error: string | null;
  onContinue: () => void;
  onClose: () => void;
}) {
  // Keep mounted through the exit animation
  const [shown, setShown] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setShown(true);
      setClosing(false);
      return;
    }
    setClosing(true);
    const t = setTimeout(() => {
      setShown(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!shown) return null;

  const rows: [string, string, string][] = [
    ["🔒", "Only your name & email", "That's everything Google shares with RepUp."],
    ["⚡", "One tap, no passwords", "Your Google account is the key — nothing new to remember."],
    ["🙈", "Nothing posted, ever", "RepUp can't read your Gmail, files, or contacts."],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in with Google"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background:
          "radial-gradient(ellipse 80% 40% at 85% -5%, rgba(61,139,253,0.13), transparent 60%), var(--bg)",
        display: "flex",
        flexDirection: "column",
        padding: "calc(var(--safe-top) + 14px) 20px calc(var(--safe-bottom) + 28px)",
        opacity: closing ? 0 : 1,
        transition: `opacity ${EXIT_MS}ms ease`,
        animation: "handoff-in .3s ease backwards",
        overflowY: "auto",
      }}
    >
      {/* Back */}
      <button
        aria-label="Back"
        className="press"
        onClick={onClose}
        style={{
          alignSelf: "flex-start",
          width: 36,
          height: 36,
          borderRadius: 999,
          background: "var(--fill-resting)",
          color: "var(--ink-dim)",
          fontSize: 20,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: `rise-in .45s ${EASE} .05s backwards`,
        }}
      >
        ‹
      </button>

      {/* Handoff visual */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: 300,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
          <Tile delay={0.1}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 8v8" />
              <path d="M17 8v8" />
              <path d="M4 10v4" />
              <path d="M20 10v4" />
              <path d="M7 12h10" />
            </svg>
          </Tile>

          {/* flowing dots */}
          <div style={{ display: "flex", gap: 7 }} aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--blue)",
                  animation: `handoff-dot 1.5s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>

          <Tile delay={0.22} style={{ background: "#fff", border: "1px solid rgba(255,255,255,0.9)" }}>
            <GoogleG size={26} />
          </Tile>
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
            animation: `rise-in .5s ${EASE} .18s backwards`,
          }}
        >
          A quick hop to Google
        </h1>
        <p
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: "var(--ink-dim)",
            lineHeight: 1.45,
            margin: "10px 0 0",
            maxWidth: 300,
            animation: `rise-in .5s ${EASE} .26s backwards`,
          }}
        >
          Google confirms it&rsquo;s you, then sends you straight back here. Here&rsquo;s the deal:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26, width: "100%", maxWidth: 360 }}>
          {rows.map(([icon, title, blurb], i) => (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                textAlign: "start",
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                borderRadius: "var(--radius-panel)",
                padding: "12px 14px",
                animation: `rise-in .5s ${EASE} ${0.34 + i * 0.09}s backwards`,
              }}
            >
              <span style={{ fontSize: 20 }} aria-hidden>
                {icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 1, lineHeight: 1.4 }}>{blurb}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: `rise-in .5s ${EASE} .55s backwards` }}>
        {error && (
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--red)", textAlign: "center" }}>{error}</div>
        )}
        <button
          onClick={onContinue}
          disabled={busy}
          className="press"
          style={{
            width: "100%",
            borderRadius: 12,
            padding: 15,
            fontSize: 15,
            fontWeight: 700,
            background: "#fff",
            color: "#1a1c1e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? (
            <>
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  border: "2.5px solid rgba(26,28,30,0.25)",
                  borderTopColor: "#1a1c1e",
                  animation: "spin .7s linear infinite",
                }}
              />
              Connecting to Google…
            </>
          ) : (
            <>
              <GoogleG size={18} />
              Continue with Google
            </>
          )}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="press"
          style={{ padding: 8, fontSize: 14, fontWeight: 600, color: "var(--ink-dim)" }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function Tile({ children, delay, style }: { children: React.ReactNode; delay: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 18,
        background: "rgba(61,139,253,0.14)",
        border: "1px solid rgba(61,139,253,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: `handoff-pop .55s ${SPRING} ${delay}s backwards`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GoogleG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
