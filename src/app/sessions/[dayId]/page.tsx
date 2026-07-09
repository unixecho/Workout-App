/**
 * Session Editor — pushed screen (no tab bar), reached from Plan Builder.
 * Placeholder. Port from `claude design/Session Editor/Session Editor.dc.html`
 * (FD.md §5).
 */
export default async function SessionEditorPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  return (
    <main style={{ padding: "calc(var(--safe-top) + 20px) 20px 40px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Edit session</h1>
      <p style={{ color: "var(--ink-dim)" }}>
        Placeholder for day {dayId} — port from the approved mockup next.
      </p>
    </main>
  );
}
