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

/**
 * CE needed to hold each stored grade. Mirrors grade_for_ce() in
 * drizzle/0000_init.sql, which is what actually sets users.grade.
 * Special Grade has no threshold: it is the top four Grade 1 students by CE.
 */
export const GRADE_THRESHOLDS = { g4: 0, g3: 500, g2: 1500, semi1: 3000, g1: 5000 } as const;
export const SPECIAL_SEATS = 4;

type StoredGrade = keyof typeof GRADE_THRESHOLDS;
const STORED: StoredGrade[] = ["g4", "g3", "g2", "semi1", "g1"];

/** Progress from the current grade's floor to the next grade's floor. */
export function gradeProgress(ce: number) {
  const grade = [...STORED].reverse().find((g) => ce >= GRADE_THRESHOLDS[g]) ?? "g4";
  const next = STORED[STORED.indexOf(grade) + 1] as StoredGrade | undefined;
  const floor = GRADE_THRESHOLDS[grade];
  const ceiling = next ? GRADE_THRESHOLDS[next] : null;
  return {
    grade,
    next: next ?? null,
    floor,
    ceiling,
    toNext: ceiling === null ? 0 : ceiling - ce,
    ratio: ceiling === null ? 1 : (ce - floor) / (ceiling - floor),
  };
}
