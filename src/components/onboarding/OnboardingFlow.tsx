"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatSlider } from "@/components/StatSlider";
import { completeOnboarding } from "@/app/onboarding/actions";
import { generateWeek, type Equipment, type Goal } from "@/lib/plan/generate";

// Hardcoded production origin for auth redirects — falls back to the
// current origin so localhost still works without setting this locally.
// Avoids depending on window.location.origin in production, which is what
// sent test magic links to localhost during development.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const EASE = "cubic-bezier(.4,0,.2,1)";
const TRANSITION_MS = 350;
const BUILDING_MS = 600;

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
// Fixed vocabulary only — the exercise-adaptation system (docs/TD.md,
// `exercises.adaptations`) can only act on these known tags. Free text here
// would just be a string with no functional effect on plan generation.
const LIMITATION_TAGS = ["Knee", "Shoulder", "Back", "Wrist", "Ankle", "Hip", "Elbow", "Neck"];

const GOALS: { id: Goal; label: string; blurb: string; icon: ReactElement }[] = [
  {
    id: "lose_weight",
    label: "Lose weight",
    blurb: "Steady fat loss without losing strength",
    icon: (
      <path d="M3 7l6 6 4-4 8 8M21 17v-5M21 17h-5" />
    ),
  },
  {
    id: "build_muscle",
    label: "Build muscle",
    blurb: "Hypertrophy focus with progressive volume",
    icon: <path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10" />,
  },
  {
    id: "get_stronger",
    label: "Get stronger",
    blurb: "Heavy compounds, low reps, big lifts",
    icon: <path d="M6 6v12M18 6v12M2 9v6M22 9v6M6 12h12" />,
  },
  {
    id: "endurance",
    label: "Endurance",
    blurb: "Conditioning, intervals, longer sessions",
    icon: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  },
  {
    id: "stay_healthy",
    label: "Stay healthy",
    blurb: "Balanced training, energy, longevity",
    icon: <path d="M12 20s-7-4.6-9-9c-1.3-3 1-7 4.5-7C10 4 12 6.5 12 6.5S14 4 16.5 4C20 4 22.3 8 21 11c-2 4.4-9 9-9 9z" />,
  },
];

const AVATAR_TINTS: [string, string][] = [
  ["rgba(61,139,253,0.14)", "#3D8BFD"],
  ["rgba(48,209,88,0.14)", "#30D158"],
  ["rgba(255,159,10,0.14)", "#FF9F0A"],
];

interface Props {
  /** 0 shows the auth screen; 1 skips straight past it (already signed in). */
  initialStep: 0 | 1;
  initialProfile: {
    handle: string | null;
    displayName: string | null;
    age: number | null;
    heightCm: number | null;
    weightKg: number | null;
    unitPref: "metric" | "imperial";
    goal: Goal | null;
    targetWeightKg: number | null;
    weekdayAvailability: number[] | null;
    equipment: Equipment;
    limitations: string[] | null;
  } | null;
}

export function OnboardingFlow({ initialStep, initialProfile }: Props) {
  const supabase = createClient();

  const [step, setStep] = useState<number>(initialStep);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [phase, setPhase] = useState<"idle" | "start" | "run">("idle");
  const [mounted, setMounted] = useState(false);
  const lockRef = useRef(false);
  const buildTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // S0
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // S1
  const [avatarTint, setAvatarTint] = useState(0);
  const [handle, setHandle] = useState(initialProfile?.handle ?? "");
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [name, setName] = useState(initialProfile?.displayName ?? "");

  // S2
  const [metric, setMetric] = useState(initialProfile?.unitPref !== "imperial");
  const [age, setAge] = useState(initialProfile?.age ?? 28);
  const [heightCm, setHeightCm] = useState(initialProfile?.heightCm ?? 178);
  const [weightKg, setWeightKg] = useState(initialProfile?.weightKg ?? 82);

  // S3
  const [goal, setGoal] = useState<Goal | null>(initialProfile?.goal ?? null);
  const [target, setTarget] = useState(
    initialProfile?.targetWeightKg ? String(Math.round(initialProfile.targetWeightKg)) : "75",
  );

  // S4
  const [weekOn, setWeekOn] = useState<boolean[]>(() => {
    if (initialProfile?.weekdayAvailability?.length) {
      const w = [false, false, false, false, false, false, false];
      initialProfile.weekdayAvailability.forEach((i) => (w[i] = true));
      return w;
    }
    return [true, true, false, true, true, false, false];
  });
  const [equip, setEquip] = useState<Equipment>(initialProfile?.equipment ?? "basic");
  const [limitations, setLimitations] = useState<string[]>(initialProfile?.limitations ?? []);

  // S5
  const [building, setBuilding] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(buildTimerRef.current);
      clearTimeout(handleTimerRef.current);
    },
    [],
  );

  function nav(n: number, d: 1 | -1) {
    if (lockRef.current || n < 0 || n > 5 || n === step) return;
    lockRef.current = true;
    setPrev(step);
    setDir(d);
    setPhase("start");
    setStep(n);
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase("run")));
    setTimeout(() => {
      setPrev(null);
      setPhase("idle");
      lockRef.current = false;
    }, TRANSITION_MS + 40);

    if (n === 5) {
      setBuilding(true);
      setRevealed(false);
      setAccepted(false);
      clearTimeout(buildTimerRef.current);
      buildTimerRef.current = setTimeout(() => {
        setBuilding(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
      }, BUILDING_MS);
    }
  }

  const goNext = () => nav(step + 1, 1);
  const goBack = () => nav(step - 1, -1);

  function screenStyle(i: number): CSSProperties {
    const tr = `transform ${TRANSITION_MS}ms ${EASE}, opacity ${TRANSITION_MS}ms ${EASE}`;
    if (i === step) {
      if (phase === "start" && prev !== null) {
        return {
          transform: `translateX(${dir > 0 ? 60 : -60}px)`,
          opacity: 0,
          transition: "none",
          visibility: "visible",
          pointerEvents: "auto",
        };
      }
      return { transform: "translateX(0px)", opacity: 1, transition: tr, visibility: "visible", pointerEvents: "auto" };
    }
    if (i === prev) {
      if (phase === "start") {
        return { transform: "translateX(0px)", opacity: 1, transition: "none", visibility: "visible", pointerEvents: "none" };
      }
      return {
        transform: `translateX(${dir > 0 ? -40 : 40}px)`,
        opacity: 0,
        transition: tr,
        visibility: "visible",
        pointerEvents: "none",
      };
    }
    return { transform: "translateX(0px)", opacity: 0, transition: "none", visibility: "hidden", pointerEvents: "none" };
  }

  function toImperial() {
    setMetric(false);
    setTarget(String(Math.round((parseFloat(target) || 75) * 2.2046)));
  }
  function toMetric() {
    setMetric(true);
    setTarget(String(Math.round((parseFloat(target) || 165) / 2.2046)));
  }

  // Slider readouts — heightCm/weightKg stay canonical metric, imperial is
  // purely a display format.
  const fmtHeight = (cm: number) => {
    if (metric) return `${Math.round(cm)} cm`;
    const inches = Math.round(cm / 2.54);
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  };
  const fmtWeight = (kg: number) => (metric ? `${Math.round(kg)} kg` : `${Math.round(kg * 2.2046)} lb`);

  // Surface auth errors Supabase returns either in the URL hash (implicit
  // flow) or as query params forwarded by /auth/callback (PKCE flow \u2014 a
  // code-exchange failure). Without this the user silently lands back on
  // step 0 with no explanation.
  useEffect(() => {
    const hashParams = window.location.hash ? new URLSearchParams(window.location.hash.slice(1)) : null;
    const queryParams = new URLSearchParams(window.location.search);
    const params = hashParams?.get("error_code") || hashParams?.get("error") ? hashParams : queryParams;
    const code = params.get("error_code");
    const err = params.get("error");
    if (!code && !err) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL only exists client-side, must be read post-mount
    setAuthError(params.get("error_description") ?? "Sign-in failed. Please try again.");
    // Clean the hash/query so a refresh doesn\u2019t re-show a stale error
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function handleGoogleSignIn() {
    setAuthError(null);
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL ?? window.location.origin}/auth/callback` },
    });
    if (error) {
      setAuthError(error.message);
      setAuthBusy(false);
    }
    // On success the browser navigates away to Google immediately.
  }

  function onHandleChange(v: string) {
    const cleaned = v.replace(/\s/g, "").toLowerCase();
    setHandle(cleaned);
    clearTimeout(handleTimerRef.current);
    if (cleaned.length < 3) {
      setHandleStatus("idle");
      return;
    }
    setHandleStatus("checking");
    handleTimerRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_handle_available", { check_handle: cleaned });
      if (error) {
        setHandleStatus("idle");
        return;
      }
      setHandleStatus(data ? "ok" : "taken");
    }, 450);
  }

  function toggleLimitation(tag: string) {
    setLimitations((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const activeDays = weekOn;
  const daysPerWeek = activeDays.filter(Boolean).length;
  const week = goal ? generateWeek(goal, activeDays) : [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const targetKg = metric ? parseFloat(target) || weightKg : (parseFloat(target) || weightKg * 2.2046) / 2.2046;
  const paceWeeks = Math.max(4, Math.round(Math.abs(weightKg - targetKg) / 0.5));

  async function handleAcceptPlan() {
    setAccepted(true);
    setSaveError(null);
    try {
      await completeOnboarding({
        handle,
        displayName: name,
        age,
        heightCm: Math.round(heightCm),
        weightKg: Math.round(weightKg * 10) / 10,
        unitPref: metric ? "metric" : "imperial",
        goal: goal ?? "stay_healthy",
        targetWeightKg: goal === "lose_weight" ? Math.round(targetKg * 10) / 10 : null,
        activeDays,
        equipment: equip,
        limitations,
      });
    } catch (err) {
      // completeOnboarding ends with redirect("/today"), which Next.js
      // implements by throwing a special NEXT_REDIRECT error — rethrow it so
      // the framework can perform the navigation instead of it flashing here
      // as a real error for an instant.
      if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setAccepted(false);
      setSaveError(err instanceof Error ? err.message : "Something went wrong — try again.");
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 80% 40% at 85% -5%, rgba(61,139,253,0.13), transparent 60%), radial-gradient(ellipse 70% 35% at 10% 108%, rgba(48,209,88,0.08), transparent 60%), var(--bg)",
      }}
    >
      {/* Progress header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          background: "linear-gradient(to bottom, rgba(10,13,18,0.96), rgba(10,13,18,0))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "calc(var(--safe-top) + 14px) 20px 14px",
          }}
        >
          <button
            aria-label="Back"
            onClick={goBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "var(--fill-resting)",
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "opacity .2s ease, transform .15s ease, background .15s ease",
              opacity: step > 0 ? 1 : 0,
              pointerEvents: step > 0 ? "auto" : "none",
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 6l-6 6 6 6" />
            </svg>
          </button>
          <div style={{ flex: 1, display: "flex", gap: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  background: i <= step ? "var(--blue)" : "rgba(255,255,255,0.10)",
                  transition: "background .3s ease",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--ink-dim)",
              fontVariantNumeric: "tabular-nums",
              minWidth: 26,
              textAlign: "right",
            }}
          >
            {step + 1}/6
          </div>
        </div>
      </div>

      {/* S0 — Splash / Auth */}
      <Screen style={screenStyle(0)}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.92)",
            transition: `opacity .6s ${EASE}, transform .6s ${EASE}`,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(61,139,253,0.14)",
              border: "1px solid rgba(61,139,253,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 8v8" />
              <path d="M17 8v8" />
              <path d="M4 10v4" />
              <path d="M20 10v4" />
              <path d="M7 12h10" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>RepUp</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-dim)", marginTop: 10 }}>
            Train smarter, together
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            opacity: mounted ? 1 : 0,
            transition: `opacity .6s ${EASE} .15s`,
          }}
        >
          {authError && (
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--red)", textAlign: "center" }}>{authError}</div>
          )}
          <PrimaryTintButton onClick={handleGoogleSignIn} disabled={authBusy}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                background: "rgba(61,139,253,0.22)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              G
            </span>
            Continue with Google
          </PrimaryTintButton>
        </div>
      </Screen>

      {/* S1 — Profile */}
      <Screen style={screenStyle(1)}>
        <StepEyebrow n={2} />
        <h1 style={titleStyle}>Set up your profile</h1>
        <div style={subtitleStyle}>How you&rsquo;ll appear to friends.</div>

        <button
          aria-label="Change avatar"
          onClick={() => setAvatarTint((avatarTint + 1) % 3)}
          style={{
            alignSelf: "center",
            width: 96,
            height: 96,
            borderRadius: 999,
            border: "1px solid var(--card-border)",
            background: AVATAR_TINTS[avatarTint][0],
            color: AVATAR_TINTS[avatarTint][1],
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            marginBottom: 8,
            transition: "background .25s ease, transform .15s ease",
          }}
        >
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7l1.5-2.5h5L16 7" />
            <rect x={3} y={7} width={18} height={13} rx={3} />
            <circle cx={12} cy={13.5} r={4} />
          </svg>
        </button>
        <div style={{ alignSelf: "center", fontSize: 12.5, fontWeight: 600, color: "var(--ink-faint)", marginBottom: 28 }}>
          Tap to change
        </div>

        <div style={fieldLabelStyle}>Handle</div>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 600, color: "var(--ink-faint)" }}>
            @
          </span>
          <input
            type="text"
            placeholder="handle"
            value={handle}
            onChange={(e) => onHandleChange(e.target.value)}
            autoCapitalize="none"
            style={{ ...inputStyle(), padding: "14px 44px 14px 34px" }}
          />
          {handleStatus === "checking" && (
            <span
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                marginTop: -8,
                width: 16,
                height: 16,
                borderRadius: 999,
                border: "2px solid rgba(255,255,255,0.12)",
                borderTopColor: "var(--blue)",
                animation: "spin .7s linear infinite",
              }}
            />
          )}
          {handleStatus === "ok" && (
            <span style={{ position: "absolute", right: 14, top: "50%", marginTop: -10 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12.5l5 5 11-11" />
              </svg>
            </span>
          )}
        </div>
        <div
          style={{
            minHeight: 18,
            fontSize: 12.5,
            fontWeight: 600,
            color:
              handleStatus === "ok" ? "var(--green)" : handleStatus === "taken" ? "var(--red)" : "var(--ink-faint)",
            margin: "0 0 18px 4px",
            transition: "color .2s ease",
          }}
        >
          {handleStatus === "ok"
            ? `@${handle} is available`
            : handleStatus === "taken"
              ? `@${handle} is already taken`
              : handleStatus === "checking"
                ? "Checking availability…"
                : " "}
        </div>

        <div style={fieldLabelStyle}>Display name</div>
        <input type="text" placeholder="Jordan Reyes" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle()} />

        <div style={{ flex: 1 }} />
        <PrimaryTintButton onClick={goNext} disabled={!handle || handleStatus !== "ok" || !name} style={{ marginTop: 24 }}>
          Continue
        </PrimaryTintButton>
      </Screen>

      {/* S2 — Body stats */}
      <Screen style={screenStyle(2)}>
        <StepEyebrow n={3} />
        <h1 style={titleStyle}>Tell us about you</h1>
        <div style={subtitleStyle}>Used to estimate training loads.</div>

        <div style={cardStyle}>
          <StatSlider label="Age" value={age} min={13} max={90} format={(v) => `${v} yrs`} onChange={setAge} />
          <Hairline />
          <StatSlider label="Height" value={heightCm} min={120} max={220} format={fmtHeight} onChange={setHeightCm} />
          <Hairline />
          <StatSlider label="Weight" value={weightKg} min={35} max={200} format={fmtWeight} onChange={setWeightKg} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dim)", paddingLeft: 4 }}>Units</div>
          <SegmentedControl
            options={[
              { key: "metric", label: "kg · cm" },
              { key: "imperial", label: "lb · ft-in" },
            ]}
            value={metric ? "metric" : "imperial"}
            onChange={(k) => (k === "metric" ? toMetric() : toImperial())}
          />
        </div>

        <div style={{ flex: 1 }} />
        <PrimaryTintButton onClick={goNext} style={{ marginTop: 24 }}>
          Continue
        </PrimaryTintButton>
      </Screen>

      {/* S3 — Goal */}
      <Screen style={screenStyle(3)}>
        <StepEyebrow n={4} />
        <h1 style={titleStyle}>What&rsquo;s your goal?</h1>
        <div style={{ ...subtitleStyle, marginBottom: 24 }}>We&rsquo;ll shape your plan around it.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {GOALS.map((g) => (
            <div key={g.id}>
              <button
                onClick={() => setGoal(g.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 16,
                  padding: 16,
                  background: goal === g.id ? "rgba(61,139,253,0.10)" : "var(--card)",
                  border: `1.5px solid ${goal === g.id ? "var(--blue)" : "var(--card-border)"}`,
                  color: "var(--ink)",
                  transition: "background .2s ease, border-color .2s ease, transform .15s ease",
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(61,139,253,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    {g.icon}
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{g.label}</span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-dim)", marginTop: 2 }}>
                    {g.blurb}
                  </span>
                </span>
              </button>

              {g.id === "lose_weight" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: goal === "lose_weight" ? "1fr" : "0fr",
                    transition: `grid-template-rows .35s ${EASE}`,
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        padding: "2px 4px 8px",
                        opacity: goal === "lose_weight" ? 1 : 0,
                        transition: "opacity .3s ease",
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          style={{ ...inputStyle(), padding: "14px 90px 14px 16px", fontVariantNumeric: "tabular-nums" }}
                        />
                        <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "var(--ink-faint)" }}>
                          target {metric ? "kg" : "lb"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-dim)", paddingLeft: 4 }}>
                        At this pace: ~{paceWeeks} weeks <span style={{ color: "var(--ink-faint)" }}>— estimate, not a promise</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <PrimaryTintButton onClick={goNext} disabled={!goal} style={{ marginTop: 24 }}>
          Continue
        </PrimaryTintButton>
      </Screen>

      {/* S4 — Availability */}
      <Screen style={screenStyle(4)}>
        <StepEyebrow n={5} />
        <h1 style={titleStyle}>When can you train?</h1>
        <div style={{ ...subtitleStyle, marginBottom: 24 }}>We&rsquo;ll fit the plan to your week.</div>

        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Days per week</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 2 }}>Most people do best with 3&ndash;5</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <RoundStepperButton
                label="−"
                tinted={false}
                ariaLabel="Fewer days"
                onClick={() => {
                  const w = [...weekOn];
                  for (let i = 6; i >= 0; i--) {
                    if (w[i]) {
                      w[i] = false;
                      break;
                    }
                  }
                  setWeekOn(w);
                }}
              />
              <div style={{ fontSize: 38, fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 34, textAlign: "center" }}>
                {daysPerWeek}
              </div>
              <RoundStepperButton
                label="+"
                tinted
                ariaLabel="More days"
                onClick={() => {
                  const w = [...weekOn];
                  const order = [2, 5, 0, 3, 1, 4, 6];
                  for (const i of order) {
                    if (!w[i]) {
                      w[i] = true;
                      break;
                    }
                  }
                  setWeekOn(w);
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {WEEKDAY_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => {
                  const w = [...weekOn];
                  w[i] = !w[i];
                  setWeekOn(w);
                }}
                style={{
                  flex: 1,
                  aspectRatio: "1",
                  maxWidth: 44,
                  borderRadius: 999,
                  border: `1px solid ${weekOn[i] ? "rgba(61,139,253,0.45)" : "var(--card-border)"}`,
                  background: weekOn[i] ? "rgba(61,139,253,0.18)" : "rgba(255,255,255,0.04)",
                  color: weekOn[i] ? "var(--blue)" : "var(--ink-faint)",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "background .2s ease, color .2s ease, border-color .2s ease, transform .15s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 12 }}>Equipment</div>
          <SegmentedControl
            options={[
              { key: "none", label: "None" },
              { key: "park", label: "Park" },
              { key: "basic", label: "Basic" },
              { key: "full_gym", label: "Full gym" },
            ]}
            value={equip}
            onChange={(k) => setEquip(k as Equipment)}
            fill
          />
        </div>

        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
            Anything we should work around?
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", marginBottom: 12 }}>
            Tap any areas to protect — this drives which exercises get adapted or skipped.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LIMITATION_TAGS.map((tag) => {
              const on = limitations.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleLimitation(tag)}
                  style={{
                    border: `1px solid ${on ? "rgba(61,139,253,0.45)" : "var(--card-border)"}`,
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: on ? "rgba(61,139,253,0.18)" : "var(--fill-resting)",
                    color: on ? "var(--blue)" : "var(--ink-dim)",
                    transition: "background .15s ease, border-color .15s ease, transform .15s ease",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <PrimaryTintButton onClick={() => nav(5, 1)} style={{ marginTop: 24 }}>
          Build my plan
        </PrimaryTintButton>
      </Screen>

      {/* S5 — Plan reveal */}
      <Screen style={screenStyle(5)}>
        {building ? (
          <>
            <div style={eyebrowStyle}>Almost there</div>
            <h1 style={titleStyle}>Building your plan&hellip;</h1>
            <div style={{ ...subtitleStyle, marginBottom: 24 }}>Balancing volume across your week.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 76,
                    borderRadius: 16,
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    animation: "pulse 1.2s ease-in-out infinite",
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ ...eyebrowStyle, color: "var(--green)" }}>Step 6 of 6</div>
            <h1 style={titleStyle}>Your week is ready</h1>
            <div style={{ ...subtitleStyle, marginBottom: 24 }}>
              {daysPerWeek} sessions · {7 - daysPerWeek} rest days · built around your goal
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {week.map((day, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 16,
                    padding: "14px 16px",
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? "translateY(0px)" : "translateY(18px)",
                    transition: `opacity .5s ${EASE} ${i * 60}ms, transform .5s ${EASE} ${i * 60}ms`,
                  }}
                >
                  <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        color: day.isRestDay ? "var(--ink-faint)" : "var(--blue)",
                      }}
                    >
                      {dayNames[i]}
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: "stretch", background: "var(--hairline)" }} />
                  {day.isRestDay ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, opacity: 0.55 }}>
                      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 13A8 8 0 1 1 11 4a6.5 6.5 0 0 0 9 9z" />
                      </svg>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink-dim)" }}>Rest day</div>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", marginTop: 2 }}>
                          Recovery · light walk optional
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{day.sessionTitle}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          {day.focusMuscles.map((m) => (
                            <span
                              key={m}
                              style={{
                                fontSize: 11.5,
                                fontWeight: 600,
                                padding: "3px 9px",
                                borderRadius: 999,
                                background: "rgba(61,139,253,0.14)",
                                color: "var(--blue)",
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-dim)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                        {day.estDurationMin} min
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div style={{ flex: 1, minHeight: 24 }} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                opacity: revealed ? 1 : 0,
                transition: "opacity .5s ease .45s",
              }}
            >
              {saveError && (
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--red)", textAlign: "center" }}>{saveError}</div>
              )}
              <button
                onClick={handleAcceptPlan}
                disabled={accepted}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 12,
                  padding: 15,
                  fontSize: 15,
                  fontWeight: 700,
                  background: accepted ? "rgba(48,209,88,0.16)" : "rgba(61,139,253,0.14)",
                  color: accepted ? "var(--green)" : "var(--blue)",
                  transition: "transform .15s ease, background .2s ease, color .2s ease",
                }}
              >
                {accepted ? "Setting up your plan…" : "Accept plan"}
              </button>
              <button
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  background: "var(--fill-resting)",
                  color: "var(--ink)",
                  transition: "transform .15s ease, background .15s ease",
                }}
              >
                Customize
              </button>
            </div>
          </>
        )}
      </Screen>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

function Screen({ style, children }: { style: CSSProperties; children: React.ReactNode }) {
  // Two-layer scroll: the positioned outer element is the scroll container,
  // the inner flex column carries `min-height: 100%` so `flex: 1` spacers
  // still pin the bottom button when content fits, but overflow scrolls
  // cleanly on iOS Safari/Chrome instead of clipping the lower cards.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      <div
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "calc(var(--safe-top) + 92px) 20px calc(var(--safe-bottom) + 28px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StepEyebrow({ n }: { n: number }) {
  return <div style={eyebrowStyle}>Step {n} of 6</div>;
}

function Hairline() {
  return <div style={{ height: 1, background: "var(--hairline)", marginLeft: 16 }} />;
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}>
      <div style={{ flex: 1, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</div>
      {children}
    </div>
  );
}

function RoundStepperButton({
  label,
  tinted,
  ariaLabel,
  onClick,
}: {
  label: string;
  tinted: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "none",
        background: tinted ? "rgba(61,139,253,0.18)" : "rgba(255,255,255,0.08)",
        color: tinted ? "var(--blue)" : "var(--ink)",
        fontSize: 22,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .15s ease, background .15s ease",
      }}
    >
      {label}
    </button>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fill,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  fill?: boolean;
}) {
  return (
    <div style={{ display: "flex", background: "var(--fill-resting)", borderRadius: 10, padding: 2, flex: fill ? 1 : undefined }}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            flex: fill ? 1 : undefined,
            border: "none",
            borderRadius: 8,
            padding: fill ? "9px 0" : "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            background: value === o.key ? "rgba(61,139,253,0.18)" : "transparent",
            color: value === o.key ? "var(--blue)" : "var(--ink-dim)",
            transition: "background .2s ease, color .2s ease, transform .15s ease",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PrimaryTintButton({
  onClick,
  disabled,
  style,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        border: "none",
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        fontWeight: 700,
        background: "rgba(61,139,253,0.14)",
        color: "var(--blue)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "transform .15s ease, background .15s ease",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    background: "var(--fill-resting)",
    border: "1px solid var(--card-border)",
    borderRadius: 12,
    padding: "14px 16px",
    color: "var(--ink)",
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    outline: "none",
  };
}

const eyebrowStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  color: "var(--blue)",
};

const titleStyle: CSSProperties = {
  fontSize: 34,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  margin: "8px 0 6px",
};

const subtitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: "var(--ink-dim)",
  marginBottom: 28,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink-dim)",
  margin: "0 0 8px 4px",
};

const cardStyle: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--card-border)",
  borderRadius: 16,
  overflow: "hidden",
  marginBottom: 16,
};

const statInputStyle: CSSProperties = {
  width: 110,
  background: "transparent",
  border: "none",
  textAlign: "right",
  color: "var(--ink)",
  fontSize: 16,
  fontWeight: 600,
  outline: "none",
  fontVariantNumeric: "tabular-nums",
};

const statUnitStyle: CSSProperties = {
  width: 28,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink-faint)",
};
