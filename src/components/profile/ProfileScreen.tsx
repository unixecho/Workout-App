"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/Sheet";
import {
  deleteAccount,
  updateBodyStats,
  updateNotificationPref,
  updateTraining,
  updateUnits,
  updateVisibility,
} from "@/app/(tabs)/profile/actions";
import { regenerateWeek } from "@/app/(tabs)/plan/actions";
import { StatSlider } from "@/components/StatSlider";
import { useI18n } from "@/lib/i18n/client";
import { setLocale } from "@/lib/i18n/actions";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const LIMITATION_TAGS = ["Knee", "Shoulder", "Back", "Wrist", "Ankle", "Hip", "Elbow", "Neck"];
const GOALS: [string, string][] = [
  ["lose_weight", "Lose weight"],
  ["build_muscle", "Build muscle"],
  ["get_stronger", "Get stronger"],
  ["endurance", "Endurance"],
  ["stay_healthy", "Stay healthy"],
];

interface Props {
  displayName: string;
  handle: string;
  email: string;
  joined: string;
  stats: { streak: number; badges: number; workouts: number };
  body: { age: number | null; heightCm: number | null; weightKg: number | null };
  unitPref: "metric" | "imperial";
  goal: string;
  weekdayAvailability: number[];
  equipment: string;
  limitations: string[];
  notif: { reminder: boolean; friendActivity: boolean; badgeEarned: boolean };
  visibility: "friends" | "private";
}

type EditSheet = null | "body" | "goal" | "availability" | "equipment" | "limitations";

export function ProfileScreen(p: Props) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [notif, setNotif] = useState(p.notif);
  const [vis, setVis] = useState(p.visibility);
  const [units, setUnits] = useState(p.unitPref);
  const [sheet, setSheet] = useState<EditSheet>(null);
  const [regenPrompt, setRegenPrompt] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Edit drafts (initialized when a sheet opens)
  const [age, setAge] = useState(p.body.age ?? 28);
  const [height, setHeight] = useState(p.body.heightCm ?? 178);
  const [weight, setWeight] = useState(p.body.weightKg ?? 82);
  const [goal, setGoal] = useState(p.goal);
  const daysFromAvailability = (avail: number[]) => {
    const w = [false, false, false, false, false, false, false];
    avail.forEach((i) => (w[i] = true));
    return w;
  };
  const [days, setDays] = useState<boolean[]>(() => daysFromAvailability(p.weekdayAvailability));
  const [committedDays, setCommittedDays] = useState<boolean[]>(days);
  const [confirmDiscardDays, setConfirmDiscardDays] = useState(false);
  const daysDirty = days.some((v, i) => v !== committedDays[i]);
  const closeAvailabilitySheet = () => {
    if (daysDirty) setConfirmDiscardDays(true);
    else setSheet(null);
  };
  const [equip, setEquip] = useState(p.equipment);
  const [limits, setLimits] = useState<string[]>(p.limitations);

  const initials = p.displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/onboarding");
    router.refresh();
  };

  /**
   * Save a training-affecting change (FD §10). Availability regenerates the
   * remaining week automatically — a plan with sessions on days you can't
   * train is simply wrong, so there's nothing to ask. Other fields (goal,
   * equipment, limitations) still offer regeneration as a choice.
   */
  const saveTraining = (fields: Parameters<typeof updateTraining>[0]) =>
    startTransition(async () => {
      await updateTraining(fields);
      if (fields.weekdayAvailability !== undefined) {
        await regenerateWeek(true);
        setCommittedDays(days);
        router.refresh();
        setSheet(null);
      } else {
        setSheet(null);
        setRegenPrompt(true);
      }
    });

  return (
    <main style={{ minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ padding: "calc(var(--safe-top) + 24px) 20px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: "rgba(61,139,253,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "var(--blue)", flexShrink: 0 }}>
            {initials || "?"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>{p.displayName}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)" }}>@{p.handle}</div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", marginTop: 2 }}>Joined {p.joined}</div>
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {(
            [
              [`🔥 ${p.stats.streak}`, "day streak"],
              [String(p.stats.badges), "badges"],
              [String(p.stats.workouts), "workouts"],
            ] as const
          ).map(([val, label]) => (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 6px", background: "var(--fill-resting)", border: "1px solid var(--card-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{val}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-dim)" }}>{label}</div>
            </div>
          ))}
        </div>

        <Group label="Account">
          <Row label="Email" value={p.email} />
          <Row
            label={t.profile.language}
            value={t.profile.languageNames[locale]}
            onClick={() => {
              const next = locale === "en" ? "he" : "en";
              startTransition(() => setLocale(next));
            }}
          />
        </Group>

        <Group label="Body & Goal">
          <Row
            label="Body stats"
            value={`${p.body.age ?? "—"} yrs · ${p.body.heightCm ?? "—"} cm · ${p.body.weightKg ?? "—"} kg`}
            onClick={() => {
              setAge(p.body.age ?? 28);
              setHeight(p.body.heightCm ?? 178);
              setWeight(p.body.weightKg ?? 82);
              setSheet("body");
            }}
          />
          <Row
            label="Units"
            value={units === "metric" ? "kg · cm" : "lb · ft-in"}
            onClick={() => {
              const next = units === "metric" ? "imperial" : "metric";
              setUnits(next);
              startTransition(() => updateUnits(next));
            }}
          />
          <Row label="Goal" value={GOALS.find(([k]) => k === goal)?.[1] ?? "—"} onClick={() => setSheet("goal")} />
        </Group>

        <Group label="Training">
          <Row
            label="Availability"
            value={`${committedDays.filter(Boolean).length} days/week`}
            onClick={() => {
              setDays(committedDays);
              setSheet("availability");
            }}
          />
          <Row label="Equipment" value={equip === "full_gym" ? "Full gym" : equip === "basic" ? "Basic" : equip === "park" ? "Park" : "None"} onClick={() => setSheet("equipment")} />
          <Row label="Limitations" value={limits.join(", ") || "None"} onClick={() => setSheet("limitations")} />
        </Group>

        <Group label="Notifications">
          <ToggleRow label="Workout reminder" on={notif.reminder} onToggle={(v) => { setNotif({ ...notif, reminder: v }); startTransition(() => updateNotificationPref("workout_reminder_enabled", v)); }} />
          <ToggleRow label="Friend activity" on={notif.friendActivity} onToggle={(v) => { setNotif({ ...notif, friendActivity: v }); startTransition(() => updateNotificationPref("friend_activity_enabled", v)); }} />
          <ToggleRow label="Badge earned" on={notif.badgeEarned} onToggle={(v) => { setNotif({ ...notif, badgeEarned: v }); startTransition(() => updateNotificationPref("badge_earned_enabled", v)); }} />
        </Group>

        <Group label="Privacy">
          <Row
            label="Activity visibility"
            value={vis === "friends" ? "Friends" : "Private"}
            onClick={() => {
              const next = vis === "friends" ? "private" : "friends";
              setVis(next);
              startTransition(() => updateVisibility(next));
            }}
          />
        </Group>

        <Group label="About">
          <Row label="Version" value="1.0.0" />
        </Group>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 28 }}>
          <button onClick={signOut} style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-dim)", padding: "6px 20px" }}>
            Sign out
          </button>
          <button onClick={() => setDeleteOpen(true)} style={{ fontSize: 13, fontWeight: 600, color: "var(--red)", padding: "6px 20px" }}>
            Delete account
          </button>
        </div>
      </div>

      {/* ===== Body stats sheet ===== */}
      <Sheet open={sheet === "body"} onClose={() => setSheet(null)} title="Body stats">
        <StatSlider label="Age" value={age} min={13} max={90} format={(v) => `${v} yrs`} onChange={setAge} />
        <StatSlider
          label="Height"
          value={height}
          min={120}
          max={220}
          format={(v) => {
            if (units === "metric") return `${Math.round(v)} cm`;
            const inches = Math.round(v / 2.54);
            return `${Math.floor(inches / 12)}'${inches % 12}"`;
          }}
          onChange={setHeight}
        />
        <StatSlider
          label="Weight"
          value={weight}
          min={35}
          max={200}
          format={(v) => (units === "metric" ? `${Math.round(v)} kg` : `${Math.round(v * 2.2046)} lb`)}
          onChange={setWeight}
        />
        <SaveButton
          pending={pending}
          onClick={() =>
            startTransition(async () => {
              await updateBodyStats(age, Math.round(height), Math.round(weight * 10) / 10);
              setSheet(null);
            })
          }
        />
      </Sheet>

      {/* ===== Goal sheet ===== */}
      <Sheet open={sheet === "goal"} onClose={() => setSheet(null)} title="Goal">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {GOALS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setGoal(key)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                background: goal === key ? "rgba(61,139,253,0.14)" : "var(--fill-resting)",
                color: goal === key ? "var(--blue)" : "var(--ink)",
                border: `1px solid ${goal === key ? "rgba(61,139,253,0.45)" : "var(--card-border)"}`,
                transition: "background .2s ease, color .2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <SaveButton pending={pending} onClick={() => saveTraining({ goal })} />
      </Sheet>

      {/* ===== Availability sheet ===== */}
      <Sheet open={sheet === "availability"} onClose={closeAvailabilitySheet} title="Training days">
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", padding: "4px 0 8px" }}>
          {WEEKDAY_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => {
                const w = [...days];
                w[i] = !w[i];
                setDays(w);
              }}
              style={{
                flex: 1,
                aspectRatio: "1",
                maxWidth: 44,
                borderRadius: 999,
                border: `1px solid ${days[i] ? "rgba(61,139,253,0.45)" : "var(--card-border)"}`,
                background: days[i] ? "rgba(61,139,253,0.18)" : "rgba(255,255,255,0.04)",
                color: days[i] ? "var(--blue)" : "var(--ink-faint)",
                fontSize: 13,
                fontWeight: 700,
                transition: "background .2s ease, color .2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dim)", textAlign: "center", marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
          {days.filter(Boolean).length} days/week
        </div>
        <SaveButton
          pending={pending}
          disabled={days.filter(Boolean).length === 0}
          onClick={() => saveTraining({ weekdayAvailability: days.map((on, i) => (on ? i : -1)).filter((i) => i >= 0) })}
        />
      </Sheet>

      {/* ===== Unsaved-changes guard for the availability sheet ===== */}
      {confirmDiscardDays && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setConfirmDiscardDays(false)} />
          <div style={{ position: "relative", width: "100%", maxWidth: 320, background: "var(--bg-elev)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6 }}>Discard changes?</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-dim)", lineHeight: 1.5, marginBottom: 18 }}>
              You changed your training days but haven&rsquo;t saved. Leaving now discards the change.
            </div>
            <button
              onClick={() => {
                setDays(committedDays);
                setConfirmDiscardDays(false);
                setSheet(null);
              }}
              style={{ width: "100%", padding: 13, borderRadius: 12, background: "rgba(255,69,58,0.14)", color: "var(--red)", fontSize: 15, fontWeight: 700 }}
            >
              Discard
            </button>
            <button
              onClick={() => setConfirmDiscardDays(false)}
              style={{ width: "100%", padding: 13, borderRadius: 12, background: "var(--fill-resting)", color: "var(--ink)", fontSize: 15, fontWeight: 700, marginTop: 8 }}
            >
              Keep editing
            </button>
          </div>
        </div>
      )}

      {/* ===== Equipment sheet ===== */}
      <Sheet open={sheet === "equipment"} onClose={() => setSheet(null)} title="Equipment">
        <div style={{ display: "flex", background: "var(--fill-resting)", borderRadius: 10, padding: 2, marginBottom: 6 }}>
          {(
            [
              ["none", "None"],
              ["park", "Park"],
              ["basic", "Basic"],
              ["full_gym", "Full gym"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setEquip(key)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: equip === key ? "rgba(61,139,253,0.18)" : "transparent",
                color: equip === key ? "var(--blue)" : "var(--ink-dim)",
                transition: "background .2s ease, color .2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <SaveButton pending={pending} onClick={() => saveTraining({ equipment: equip })} />
      </Sheet>

      {/* ===== Limitations sheet ===== */}
      <Sheet open={sheet === "limitations"} onClose={() => setSheet(null)} title="Limitations">
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-faint)", marginBottom: 12 }}>
          Areas to protect — drives which exercises get adapted or skipped.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          {LIMITATION_TAGS.map((tag) => {
            const on = limits.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => setLimits(on ? limits.filter((t) => t !== tag) : [...limits, tag])}
                style={{
                  border: `1px solid ${on ? "rgba(61,139,253,0.45)" : "var(--card-border)"}`,
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: on ? "rgba(61,139,253,0.18)" : "var(--fill-resting)",
                  color: on ? "var(--blue)" : "var(--ink-dim)",
                  transition: "background .15s ease, border-color .15s ease",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <SaveButton pending={pending} onClick={() => saveTraining({ limitations: limits })} />
      </Sheet>

      {/* ===== Regenerate prompt after training changes (FD §10) ===== */}
      <Sheet open={regenPrompt} onClose={() => setRegenPrompt(false)} title="Settings saved">
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-dim)", marginBottom: 14 }}>
          Your training settings changed. Regenerate the remaining days of this week? Completed days are kept.
        </div>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await regenerateWeek();
              setRegenPrompt(false);
            })
          }
          style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(61,139,253,0.14)", color: "var(--blue)", fontSize: 15, fontWeight: 700 }}
        >
          {pending ? "Regenerating…" : "Regenerate remaining days"}
        </button>
        <button onClick={() => setRegenPrompt(false)} style={{ width: "100%", padding: 14, borderRadius: 12, background: "var(--fill-resting)", color: "var(--ink)", fontSize: 15, fontWeight: 700, marginTop: 8 }}>
          Keep as is
        </button>
      </Sheet>

      {/* ===== Delete account ===== */}
      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account?">
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-dim)", marginBottom: 14 }}>
          This permanently deletes your profile, plan, history, badges and friendships. It cannot be undone. Type{" "}
          <b style={{ color: "var(--ink)" }}>{p.handle}</b> to confirm.
        </div>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={p.handle}
          autoCapitalize="none"
          style={{ width: "100%", background: "var(--fill-resting)", border: "1px solid var(--card-border)", borderRadius: 12, padding: "14px 16px", color: "var(--ink)", fontSize: 16, fontWeight: 600, outline: "none", marginBottom: 12 }}
        />
        {deleteError && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 10 }}>{deleteError}</div>}
        <button
          disabled={confirmText.toLowerCase().trim() !== p.handle || pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteAccount(confirmText);
              } catch (err) {
                setDeleteError(err instanceof Error ? err.message : "Failed — try again.");
              }
            })
          }
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            background: confirmText.toLowerCase().trim() === p.handle ? "rgba(255,69,58,0.2)" : "var(--fill-resting)",
            color: confirmText.toLowerCase().trim() === p.handle ? "var(--red)" : "var(--ink-faint)",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {pending ? "Deleting…" : "Delete forever"}
        </button>
      </Sheet>
    </main>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-faint)", margin: "0 4px 8px" }}>{label}</div>
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const inner = (
    <>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)", textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      {onClick && <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>}
    </>
  );
  const style: React.CSSProperties = { display: "flex", alignItems: "center", width: "100%", textAlign: "left", padding: "14px 16px", gap: 12, borderTop: "1px solid var(--hairline)", marginTop: -1 };
  return onClick ? (
    <button onClick={onClick} style={style}>
      {inner}
    </button>
  ) : (
    <div style={style}>{inner}</div>
  );
}

function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12, borderTop: "1px solid var(--hairline)", marginTop: -1 }}>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</span>
      <button
        role="switch"
        aria-checked={on}
        onClick={() => onToggle(!on)}
        style={{ width: 50, height: 30, borderRadius: 999, background: on ? "var(--blue)" : "rgba(255,255,255,0.12)", position: "relative", transition: "background .25s ease", flexShrink: 0 }}
      >
        <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: 999, background: "#fff", transition: "left .25s cubic-bezier(.4,0,.2,1)", boxShadow: "0 2px 6px rgba(0,0,0,0.35)" }} />
      </button>
    </div>
  );
}

function SaveButton({ pending, disabled, onClick }: { pending: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      disabled={pending || disabled}
      onClick={onClick}
      style={{ width: "100%", padding: 15, borderRadius: 12, background: "var(--blue)", color: "#fff", fontSize: 15, fontWeight: 700, marginTop: 8, opacity: pending || disabled ? 0.6 : 1 }}
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
