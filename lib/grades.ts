export type GradeKey = "g4" | "g3" | "g2" | "semi1" | "g1" | "special";

export const GRADES: Record<
  GradeKey,
  { label: string; color: string; glow: string; feel: string }
> = {
  g4: { label: "Grade 4", color: "#8FA3B8", glow: "143,163,184", feel: "Faint wisp" },
  g3: { label: "Grade 3", color: "#4FA3FF", glow: "79,163,255", feel: "Steady blue" },
  g2: { label: "Grade 2", color: "#3D6BFF", glow: "61,107,255", feel: "Deep cobalt" },
  semi1: { label: "Semi-Grade 1", color: "#8A5BFF", glow: "138,91,255", feel: "Rising storm" },
  g1: { label: "Grade 1", color: "#E0508A", glow: "224,80,138", feel: "Burning rose" },
  special: { label: "Special Grade", color: "#D8392B", glow: "216,57,43", feel: "Red flash" },
};

export const GRADE_ORDER: GradeKey[] = ["g4", "g3", "g2", "semi1", "g1", "special"];
