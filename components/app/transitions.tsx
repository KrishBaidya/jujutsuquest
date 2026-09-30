import { ViewTransition } from "react";

const DIRECTIONAL = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "ink-fade",
} as const;

/**
 * Wraps a page's content so route changes animate. Must sit in the page, not a
 * layout: layouts persist across navigations so enter/exit never fire there.
 * Links pick the direction with `transitionTypes={["nav-forward" | "nav-back"]}`.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={DIRECTIONAL} exit={DIRECTIONAL} default="none">
      {children}
    </ViewTransition>
  );
}

/** Shared element that morphs between two routes (same `name` on both). */
export function Morph({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

/** Crossfade for content that swaps within the same route (keyed by caller). */
export function Crossfade({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="ink-fade" exit="ink-fade" default="none">
      {children}
    </ViewTransition>
  );
}

export const FORWARD = ["nav-forward"];
export const BACK = ["nav-back"];
