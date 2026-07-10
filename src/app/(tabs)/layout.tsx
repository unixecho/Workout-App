import { TabBar } from "@/components/TabBar";
import { createClient } from "@/lib/supabase/server";

export default async function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let friendRequests = 0;
  if (user) {
    const { count } = await supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .eq("addressee_id", user.id)
      .eq("status", "pending");
    friendRequests = count ?? 0;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <div style={{ flex: 1, overflowY: "auto", overscrollBehaviorY: "none" }}>
        {children}
      </div>
      <TabBar friendRequests={friendRequests} userId={user?.id ?? null} />
    </div>
  );
}
