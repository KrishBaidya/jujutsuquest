import { redirect } from "next/navigation";
import { BottomBar, SideRail, TopStrip } from "@/components/nav";
import { getViewer } from "@/lib/queries/session";

// Every screen here needs a student; anyone else enrols first.
export default async function MainLayout({ children }: LayoutProps<"/">) {
  const user = await getViewer();
  if (!user) redirect("/onboarding");
  const nav = { name: user.name, initials: user.initials, ce: user.ce, grade: user.display };
  return (
    <div className="atmosphere min-h-dvh">
      <SideRail user={nav} />
      <TopStrip user={nav} />
      <div className="pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[92px]">{children}</div>
      <BottomBar />
    </div>
  );
}
