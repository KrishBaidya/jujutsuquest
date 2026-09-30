export type GradeKey = "g4" | "g3" | "g2" | "semi1" | "g1" | "special";

export const GRADES: Record<
  GradeKey,
  { label: string; color: string; glow: string; feel: string }
> = {
  g4: { label: "Grade 4", color: "#6CB4FF", glow: "108,180,255", feel: "Faint wisp" },
  g3: { label: "Grade 3", color: "#5B8CFF", glow: "91,140,255", feel: "Steady blue" },
  g2: { label: "Grade 2", color: "#7A5CFF", glow: "122,92,255", feel: "Deep violet" },
  semi1: { label: "Semi-Grade 1", color: "#A64DE0", glow: "166,77,224", feel: "Rising storm" },
  g1: { label: "Grade 1", color: "#D6409F", glow: "214,64,159", feel: "Burning magenta" },
  special: { label: "Special Grade", color: "#E0202A", glow: "224,32,42", feel: "Red flash" },
};

export const GRADE_ORDER: GradeKey[] = ["g4", "g3", "g2", "semi1", "g1", "special"];
