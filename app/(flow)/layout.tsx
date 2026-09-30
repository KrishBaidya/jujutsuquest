import { Shell } from "@/components/app/shell";
import { TopNav } from "@/components/app/app-nav";
import { getCurrentUser } from "@/lib/session";
import { initialsOf } from "@/lib/queries/session";

export default async function FlowLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <Shell grid={false} wide className="lg:bg-grid-night">
      <TopNav user={user && { ce: user.ce, name: user.name, initials: initialsOf(user.name) }} />
      <div className="flex flex-1 flex-col">{children}</div>
    </Shell>
  );
}
