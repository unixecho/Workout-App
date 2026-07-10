"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  {
    href: "/today",
    label: "Today",
    icon: (active: boolean) => (
      <path
        d="M13 2L5 13h5l-1 9 9-12h-6l1-8z"
        fill={active ? "var(--blue)" : "none"}
        stroke={active ? "none" : "var(--ink-faint)"}
        strokeWidth={active ? 0 : 2}
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/plan",
    label: "Plan",
    icon: (active: boolean) => (
      <path
        d="M4 6h16M4 12h16M4 18h11"
        stroke={active ? "var(--blue)" : "var(--ink-faint)"}
        strokeWidth={2}
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/stats",
    label: "Stats",
    icon: (active: boolean) => (
      <path
        d="M5 20V11M12 20V4M19 20v-6"
        stroke={active ? "var(--blue)" : "var(--ink-faint)"}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: (active: boolean) => {
      const stroke = active ? "var(--blue)" : "var(--ink-faint)";
      return (
        <>
          <circle cx={9} cy={8} r={3} stroke={stroke} strokeWidth={1.8} fill="none" />
          <path
            d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={17} cy={9} r={2.4} stroke={stroke} strokeWidth={1.8} fill="none" />
          <path
            d="M16 14.4c2.6-.4 4.7 1.2 4.7 3.9"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    },
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => {
      const stroke = active ? "var(--blue)" : "var(--ink-faint)";
      return (
        <>
          <circle cx={12} cy={8} r={3.4} stroke={stroke} strokeWidth={1.9} fill="none" />
          <path
            d="M5 20c0-3.8 3.1-5.8 7-5.8s7 2 7 5.8"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    },
  },
];

export function TabBar({ friendRequests = 0, userId = null }: { friendRequests?: number; userId?: string | null }) {
  const pathname = usePathname();
  const [requests, setRequests] = useState(friendRequests);

  // Keep in sync with the server count after accept/decline (router.refresh
  // re-runs the layout and passes a fresh prop).
  useEffect(() => setRequests(friendRequests), [friendRequests]);

  // Live bump when a new incoming request lands while the app is open.
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      await supabase.realtime.setAuth(session?.access_token ?? null);
      channel = supabase
        .channel("tabbar-requests")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "friend_requests", filter: `addressee_id=eq.${userId}` },
          () => setRequests((n) => n + 1),
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: "flex",
        padding: `9px 8px calc(var(--safe-bottom) + 8px)`,
        background:
          "linear-gradient(0deg, rgba(10,13,18,0.96) 60%, rgba(10,13,18,0.72))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--hairline)",
      }}
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const badge = tab.href === "/friends" ? requests : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "transform .12s ease",
            }}
          >
            <div style={{ position: "relative" }}>
              <svg width={25} height={25} viewBox="0 0 24 24">
                {tab.icon(active)}
              </svg>
              {badge > 0 && (
                <span
                  aria-label={`${badge} friend request${badge > 1 ? "s" : ""}`}
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -8,
                    minWidth: 17,
                    height: 17,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "var(--red)",
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 800,
                    lineHeight: "17px",
                    textAlign: "center",
                    fontVariantNumeric: "tabular-nums",
                    boxShadow: "0 0 0 2px var(--bg)",
                  }}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: active ? "var(--blue)" : "var(--ink-faint)",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
