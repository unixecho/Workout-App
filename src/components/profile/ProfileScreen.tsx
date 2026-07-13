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
import { weekdayDisplayOrder } from "@/lib/i18n";
import { setLocale } from "@/lib/i18n/actions";

const LIMITATION_TAGS = ["Knee", "Shoulder", "Back", "Wrist", "Ankle", "Hip", "Elbow", "Neck"];
const GOAL_KEYS = ["lose_weight", "build_muscle", "get_stronger", "endurance", "stay_healthy"];

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
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", marginTop: 2 }}>{t.profile.joined(p.joined)}</div>
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {(
            [
              [`🔥 ${p.stats.streak}`, t.profile.statStreak],
              [String(p.stats.badges), t.profile.statBadges],
              [String(p.stats.workouts), t.profile.statWorkouts],
            ] as const
          ).map(([val, label]) => (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 6px", background: "var(--fill-resting)", border: "1px solid var(--card-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{val}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-dim)" }}>{label}</div>
            </div>
          ))}
        </div>

        <Group label={t.profile.groupAccount}>
          <Row label={t.profile.email} value={p.email} />
          <Row
            label={t.profile.language}
            value={t.profile.languageNames[locale]}
            onClick={() => {
              const next = locale === "en" ? "he" : "en";
              startTransition(() => setLocale(next));
            }}
          />
        </Group>

        <Group label={t.profile.groupBodyGoal}>
          <Row
            label={t.profile.bodyStats}
            value={`${p.body.age ?? "—"} ${t.profile.yrs} · ${p.body.heightCm ?? "—"} ${t.profile.cm} · ${p.body.weightKg ?? "—"} ${t.common.kg}`}
            onClick={() => {
              setAge(p.body.age ?? 28);
              setHeight(p.body.heightCm ?? 178);
              setWeight(p.body.weightKg ?? 82);
              setSheet("body");
            }}
          />
          <Row
            label={t.profile.units}
            value={units === "metric" ? "kg · cm" : "lb · ft-in"}
            onClick={() => {
              const next = units === "metric" ? "imperial" : "metric";
              setUnits(next);
              startTransition(() => updateUnits(next));
            }}
          />
          <Row label={t.profile.goal} value={t.profile.goals[goal] ?? "—"} onClick={() => setSheet("goal")} />
        </Group>

        <Group label={t.profile.groupTraining}>
          <Row
            label={t.profile.availability}
            value={t.profile.daysPerWeek(committedDays.filter(Boolean).length)}
            onClick={() => {
              setDays(committedDays);
              setSheet("availability");
            }}
          />
          <Row label={t.profile.equipment} value={t.library.equipment[equip === "full_gym" ? "full_gym" : equip] ?? equip} onClick={() => setSheet("equipment")} />
          <Row label={t.profile.limitations} value={limits.map((l) => t.profile.limitTags[l] ?? l).join(", ") || t.profile.none} onClick={() => setSheet("limitations")} />
        </Group>

        <Group label={t.profile.groupNotifications}>
          <ToggleRow label={t.profile.notifReminder} on={notif.reminder} onToggle={(v) => { setNotif({ ...notif, reminder: v }); startTransition(() => updateNotificationPref("workout_reminder_enabled", v)); }} />
          <ToggleRow label={t.profile.notifFriendActivity} on={notif.friendActivity} onToggle={(v) => { setNotif({ ...notif, friendActivity: v }); startTransition(() => updateNotificationPref("friend_activity_enabled", v)); }} />
          <ToggleRow label={t.profile.notifBadgeEarned} on={notif.badgeEarned} onToggle={(v) => { setNotif({ ...notif, badgeEarned: v }); startTransition(() => updateNotificationPref("badge_earned_enabled", v)); }} />
        </Group>

        <Group label={t.profile.groupPrivacy}>
          <Row
            label={t.profile.activityVisibility}
            value={vis === "friends" ? t.profile.visFriends : t.profile.visPrivate}
            onClick={() => {
              const next = vis === "friends" ? "private" : "friends";
              setVis(next);
              startTransition(() => updateVisibility(next));
            }}
          />
        </Group>

        <Group label={t.profile.groupAbout}>
          <Row label={t.profile.version} value="1.0.0" />
        </Group>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 28 }}>
          <button onClick={signOut} style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-dim)", padding: "6px 20px" }}>
            {t.profile.signOut}
          </button>
          <button onClick={() => setDeleteOpen(true)} style={{ fontSize: 13, fontWeight: 600, color: "var(--red)", padding: "6px 20px" }}>
            {t.profile.deleteAccount}
          </button>
        </div>
      </div>

      {/* ===== Body stats sheet ===== */}
      <Sheet open={sheet === "body"} onClose={() => setSheet(null)} title={t.profile.bodyStats}>
        <StatSlider label={t.profile.age} value={age} min={13} max={90} format={(v) => `${v} ${t.profile.yrs}`} onChange={setAge} />
        <StatSlider
          label={t.profile.height}
          value={height}
          min={120}
          max={220}
          format={(v) => {
            if (units === "metric") return `${Math.round(v)} ${t.profile.cm}`;
            const inches = Math.round(v / 2.54);
            return `${Math.floor(inches / 12)}'${inches % 12}"`;
          }}
          onChange={setHeight}
        />
        <StatSlider
          label={t.profile.weight}
          value={weight}
          min={35}
          max={200}
          format={(v) => (units === "metric" ? `${Math.round(v)} ${t.common.kg}` : `${Math.round(v * 2.2046)} lb`)}
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
      <Sheet open={sheet === "goal"} onClose={() => setSheet(null)} title={t.profile.goal}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {GOAL_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setGoal(key)}
              style={{
                width: "100%",
                textAlign: "start",
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
              {t.profile.goals[key]}
            </button>
          ))}
        </div>
        <SaveButton pending={pending} onClick={() => saveTraining({ goal })} />
      </Sheet>

      {/* ===== Availability sheet ===== */}
      <Sheet open={sheet === "availability"} onClose={closeAvailabilitySheet} title={t.profile.trainingDays}>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", padding: "4px 0 8px" }}>
          {weekdayDisplayOrder(locale).map((i) => (
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
              {t.today.weekLetters[i]}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dim)", textAlign: "center", marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
          {t.profile.daysPerWeek(days.filter(Boolean).length)}
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
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6 }}>{t.profile.discardTitle}</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-dim)", lineHeight: 1.5, marginBottom: 18 }}>
              {t.profile.discardBlurb}
            </div>
            <button
              onClick={() => {
                setDays(committedDays);
                setConfirmDiscardDays(false);
                setSheet(null);
              }}
              style={{ width: "100%", padding: 13, borderRadius: 12, background: "rgba(255,69,58,0.14)", color: "var(--red)", fontSize: 15, fontWeight: 700 }}
            >
              {t.profile.discard}
            </button>
            <button
              onClick={() => setConfirmDiscardDays(false)}
              style={{ width: "100%", padding: 13, borderRadius: 12, background: "var(--fill-resting)", color: "var(--ink)", fontSize: 15, fontWeight: 700, marginTop: 8 }}
            >
              {t.profile.keepEditing}
            </button>
          </div>
        </div>
      )}

      {/* ===== Equipment sheet ===== */}
      <Sheet open={sheet === "equipment"} onClose={() => setSheet(null)} title={t.profile.equipment}>
        <div style={{ display: "flex", background: "var(--fill-resting)", borderRadius: 10, padding: 2, marginBottom: 6 }}>
          {(["none", "park", "basic", "full_gym"] as const).map((key) => (
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
              {t.profile.equipmentShort[key]}
            </button>
          ))}
        </div>
        <SaveButton pending={pending} onClick={() => saveTraining({ equipment: equip })} />
      </Sheet>

      {/* ===== Limitations sheet ===== */}
      <Sheet open={sheet === "limitations"} onClose={() => setSheet(null)} title={t.profile.limitations}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-faint)", marginBottom: 12 }}>
          {t.profile.limitationsBlurb}
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
                {t.profile.limitTags[tag] ?? tag}
              </button>
            );
          })}
        </div>
        <SaveButton pending={pending} onClick={() => saveTraining({ limitations: limits })} />
      </Sheet>

      {/* ===== Regenerate prompt after training changes (FD §10) ===== */}
      <Sheet open={regenPrompt} onClose={() => setRegenPrompt(false)} title={t.profile.settingsSaved}>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-dim)", marginBottom: 14 }}>
          {t.profile.regenPromptBlurb}
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
          {pending ? t.plan.regenerating : t.profile.regenRemaining}
        </button>
        <button onClick={() => setRegenPrompt(false)} style={{ width: "100%", padding: 14, borderRadius: 12, background: "var(--fill-resting)", color: "var(--ink)", fontSize: 15, fontWeight: 700, marginTop: 8 }}>
          {t.profile.keepAsIs}
        </button>
      </Sheet>

      {/* ===== Delete account ===== */}
      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t.profile.deleteTitle}>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-dim)", marginBottom: 14 }}>
          {t.profile.deleteBlurb} <b style={{ color: "var(--ink)" }}>{p.handle}</b>
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
                setDeleteError(err instanceof Error ? err.message : t.profile.deleteFailed);
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
          {pending ? t.profile.deleting : t.profile.deleteForever}
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
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)", textAlign: "end", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      {onClick && <span className="dir-flip" style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>}
    </>
  );
  const style: React.CSSProperties = { display: "flex", alignItems: "center", width: "100%", textAlign: "start", padding: "14px 16px", gap: 12, borderTop: "1px solid var(--hairline)", marginTop: -1 };
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
        <span style={{ position: "absolute", top: 3, insetInlineStart: on ? 23 : 3, width: 24, height: 24, borderRadius: 999, background: "#fff", transition: "inset-inline-start .25s cubic-bezier(.4,0,.2,1)", boxShadow: "0 2px 6px rgba(0,0,0,0.35)" }} />
      </button>
    </div>
  );
}

function SaveButton({ pending, disabled, onClick }: { pending: boolean; disabled?: boolean; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      disabled={pending || disabled}
      onClick={onClick}
      style={{ width: "100%", padding: 15, borderRadius: 12, background: "var(--blue)", color: "#fff", fontSize: 15, fontWeight: 700, marginTop: 8, opacity: pending || disabled ? 0.6 : 1 }}
    >
      {pending ? t.common.saving : t.common.save}
    </button>
  );
}
