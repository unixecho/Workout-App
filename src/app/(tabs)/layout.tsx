import { TabBar } from "@/components/TabBar";

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <div style={{ flex: 1, overflowY: "auto", overscrollBehaviorY: "none" }}>
        {children}
      </div>
      <TabBar />
    </div>
  );
}
