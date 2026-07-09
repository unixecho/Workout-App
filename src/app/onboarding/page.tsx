/**
 * S0 — Splash/Auth. Placeholder. Port from
 * `claude design/onboarding flow/RepUp Onboarding.dc.html` (FD.md §2 S0).
 */
export default function OnboardingSplashPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        gap: 8,
      }}
    >
      <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em" }}>
        RepUp
      </h1>
      <p style={{ color: "var(--ink-dim)" }}>Train smarter, together.</p>
    </main>
  );
}
