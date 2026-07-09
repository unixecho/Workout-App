/**
 * Workout Player — full-screen takeover, no tab bar, the product's
 * centerpiece screen (FD.md §6). Placeholder. Port from
 * `claude design/workout player/Workout Player.dc.html`.
 */
export default async function WorkoutPlayerPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  return (
    <main style={{ padding: "calc(var(--safe-top) + 20px) 20px 40px" }}>
      <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Workout
      </h1>
      <p style={{ color: "var(--ink-dim)" }}>
        Placeholder for day {dayId} — port from the approved mockup next.
      </p>
    </main>
  );
}
