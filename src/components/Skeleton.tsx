/**
 * Shared loading skeleton (STYLE.md: skeletons, never spinners). Rendered
 * by each route segment's loading.tsx so navigation paints instantly while
 * server data streams in — the tab bar lives in the layout above these, so
 * it never blocks on data.
 */
export function ScreenSkeleton({ title, blocks = 3 }: { title?: boolean; blocks?: number }) {
  return (
    <div style={{ padding: "calc(var(--safe-top) + 14px) 18px 24px" }}>
      {title !== false && (
        <>
          <Bar w={90} h={13} />
          <div style={{ height: 10 }} />
          <Bar w={210} h={30} />
          <div style={{ height: 24 }} />
        </>
      )}
      {Array.from({ length: blocks }, (_, i) => (
        <div
          key={i}
          style={{
            height: [120, 76, 90, 76, 110][i % 5],
            borderRadius: 16,
            background: "var(--card)",
            border: "1px solid var(--card-border)",
            marginBottom: 14,
            animation: "pulseSkeleton 1.2s ease-in-out infinite",
            animationDelay: `${i * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

function Bar({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        animation: "pulseSkeleton 1.2s ease-in-out infinite",
      }}
    />
  );
}
