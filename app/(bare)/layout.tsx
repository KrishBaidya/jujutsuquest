export default function BareLayout({ children }: LayoutProps<"/">) {
  return <div className="atmosphere min-h-dvh">{children}</div>;
}
