import { Shell } from "@/components/app/shell";
import { TopNav } from "@/components/app/app-nav";

export default function FlowLayout({ children }: LayoutProps<"/">) {
  return (
    <Shell grid={false} wide className="lg:bg-grid-night">
      <TopNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </Shell>
  );
}
