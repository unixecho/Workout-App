"use client";

import { useEffect, useState, type ReactNode } from "react";

/** iOS-style bottom sheet: grabber, dim+blur backdrop, slide-up. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: shown ? 1 : 0,
          transition: "opacity .3s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--bg-elev)",
          borderRadius: "16px 16px 0 0",
          border: "1px solid var(--card-border)",
          borderBottom: "none",
          padding: "8px 20px calc(var(--safe-bottom) + 20px)",
          transform: shown ? "translateY(0)" : "translateY(100%)",
          transition: "transform .32s cubic-bezier(.4,0,.2,1)",
          maxHeight: "80dvh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.18)", margin: "4px auto 14px" }} />
        {title && (
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>{title}</div>
        )}
        {children}
      </div>
    </div>
  );
}
