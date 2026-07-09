/**
 * Exercise Library — detail view (also used as picker mode from the Session
 * Editor). Placeholder (FD.md §7).
 */
export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main style={{ padding: "calc(var(--safe-top) + 20px) 20px 40px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{slug}</h1>
      <p style={{ color: "var(--ink-dim)" }}>
        Placeholder — port from the approved mockup next.
      </p>
    </main>
  );
}
