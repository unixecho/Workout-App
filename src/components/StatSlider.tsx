"use client";

/**
 * iOS-quality stat slider (STYLE.md motion bar): thin filled track, large
 * white thumb with :active scale, big tabular-nums readout. Value is always
 * the canonical metric number — `format` owns the display (so imperial is a
 * pure presentation concern).
 */
const THUMB = 28; // keep in sync with .stat-slider thumb width in globals.css

export function StatSlider({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const clamped = Math.min(max, Math.max(min, value));
  const frac = (clamped - min) / (max - min);
  // Align the fill edge with the thumb *center*, which the browser insets by
  // half the thumb width at each end — otherwise the colored portion drifts
  // out of ratio with the thumb near the extremes.
  const fillStop = `calc(${frac * 100}% + ${(0.5 - frac) * THUMB}px)`;
  return (
    <div style={{ padding: "12px 4px 6px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-dim)" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
          {format(clamped)}
        </div>
      </div>
      <input
        type="range"
        className="stat-slider"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          ["--track-fill" as string]: `linear-gradient(to right, var(--blue) ${fillStop}, var(--fill-resting) ${fillStop})`,
        }}
      />
    </div>
  );
}
