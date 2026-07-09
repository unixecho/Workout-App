"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/Sheet";
import { deleteAccount, updateNotificationPref, updateVisibility } from "@/app/(tabs)/profile/actions";

interface Props {
  displayName: string;
  handle: string;
  email: string;
  joined: string;
  stats: { streak: number; badges: number; workouts: number };
  body: { age: number | null; heightCm: number | null; weightKg: number | null; units: string; goal: string };
  training: { daysPerWeek: number; equipment: string; limitations: string };
  notif: { reminder: boolean; friendActivity: boolean; badgeEarned: boolean };
  visibility: "friends" | "private";
}

export function ProfileScreen(p: Props) {
  const router = useRouter();
  const [notif, setNotif] = useState(p.notif);
  const [vis, setVis] = useState(p.visibility);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        </Group>

        <Group label="Body & Goal">
          <Row label="Body stats" value={`${p.body.age ?? "—"} yrs · ${p.body.heightCm ?? "—"} cm · ${p.body.weightKg ?? "—"} kg`} />
          <Row label="Units" value={p.body.units} />
          <Row label="Goal" value={p.body.goal} />
        </Group>

        <Group label="Training">
          <Row label="Availability" value={`${p.training.daysPerWeek} days/week`} />
          <Row label="Equipment" value={p.training.equipment} />
          <Row label="Limitations" value={p.training.limitations} />
        </Group>

        <Group label="Notifications">
          <ToggleRow
            label="Workout reminder"
            on={notif.reminder}
            onToggle={(v) => {
              setNotif({ ...notif, reminder: v });
              startTransition(() => updateNotificationPref("workout_reminder_enabled", v));
            }}
          />
          <ToggleRow
            label="Friend activity"
            on={notif.friendActivity}
            onToggle={(v) => {
              setNotif({ ...notif, friendActivity: v });
              startTransition(() => updateNotificationPref("friend_activity_enabled", v));
            }}
          />
          <ToggleRow
            label="Badge earned"
            on={notif.badgeEarned}
            onToggle={(v) => {
              setNotif({ ...notif, badgeEarned: v });
              startTransition(() => updateNotificationPref("badge_earned_enabled", v));
            }}
          />
        </Group>

        <Group label="Privacy">
          <button
            onClick={() => {
              const next = vis === "friends" ? "private" : "friends";
              setVis(next);
              startTransition(() => updateVisibility(next));
            }}
            style={{ display: "flex", alignItems: "center", width: "100%", textAlign: "left", padding: "14px 16px", gap: 12 }}
          >
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Activity visibility</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)", textTransform: "capitalize" }}>{vis}</span>
            <Chevron />
          </button>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12, borderTop: "1px solid var(--hairline)", marginTop: -1 }}>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)", textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
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

function Chevron() {
  return <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>;
}
