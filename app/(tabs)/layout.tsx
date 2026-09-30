import { Shell } from "@/components/app/shell";
import { BottomNav, TopNav } from "@/components/app/app-nav";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <Shell wide>
      <TopNav />
      <div className="flex-1 pb-[88px] lg:pb-0">{children}</div>
      <BottomNav />
    </Shell>
  );
}
