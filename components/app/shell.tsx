import { cn } from "@/lib/utils";
import { PageTransition } from "./transitions";

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

/** 1100 px centered content column used on desktop (plus 32 px gutters). */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <PageTransition>
      <div className={cn("w-full lg:mx-auto lg:max-w-[1164px] lg:px-8 lg:py-12", className)}>
        {children}
      </div>
    </PageTransition>
  );
}

const STAGE_WIDTH = {
  narrow: "lg:max-w-[480px]",
  form: "lg:max-w-[640px]",
} as const;

/**
 * A full-screen phone flow (scanner, ceremony, form). On desktop it becomes a
 * framed card centred under the top nav instead of stretching edge to edge.
 */
export function Stage({
  children,
  width = "narrow",
  className,
}: {
  children: React.ReactNode;
  width?: keyof typeof STAGE_WIDTH;
  className?: string;
}) {
  return (
    <PageTransition>
      <div
        className={cn(
          "relative flex flex-1 flex-col lg:mx-auto lg:my-10 lg:min-h-[720px] lg:w-full lg:flex-none lg:overflow-hidden lg:rounded-2xl lg:border lg:border-night-700 lg:bg-night-900 lg:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]",
          STAGE_WIDTH[width],
          className,
        )}
      >
        {children}
      </div>
    </PageTransition>
  );
}
