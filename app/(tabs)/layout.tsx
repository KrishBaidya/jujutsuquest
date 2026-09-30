import { redirect } from "next/navigation";
import { Shell } from "@/components/app/shell";
import { BottomNav, TopNav } from "@/components/app/app-nav";
import { getCurrentUser } from "@/lib/session";
import { initialsOf } from "@/lib/queries/session";

// Every tab needs a student; anyone else goes through onboarding first.
export default async function TabsLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");
  return (
    <Shell wide>
      <TopNav user={{ ce: user.ce, name: user.name, initials: initialsOf(user.name) }} />
      <div className="flex-1 pb-[88px] lg:pb-0">{children}</div>
      <BottomNav />
    </Shell>
  );
}
