import { cn } from "@/lib/utils";

/**
 * Phone-width column on small screens. With `wide`, it opens up to the full
 * viewport at lg so a top nav and 1100 px content column can take over.
 */
export function Shell({
  children,
  className,
  grid = true,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  grid?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-night-950">
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col",
          grid ? "bg-grid-night" : "bg-night-900",
          wide && "lg:max-w-none",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** 1100 px centered content column used on desktop. */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full lg:mx-auto lg:max-w-[1100px] lg:px-0 lg:py-12", className)}>
      {children}
    </div>
  );
}
