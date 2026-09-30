import { Shell } from "@/components/app/shell";

export default function FlowLayout({ children }: LayoutProps<"/">) {
  return <Shell grid={false}>{children}</Shell>;
}
