export type GradeKey = "g4" | "g3" | "g2" | "semi1" | "g1" | "special";

export const GRADES: Record<
  GradeKey,
  { label: string; short: string; kanji: string; color: string; /** "r g b" for rgb(var / a) */ glow: string; feel: string }
> = {
  g4: { label: "Grade 4", short: "G4", kanji: "四級", color: "#8C8792", glow: "140 135 146", feel: "Faint residue" },
  g3: { label: "Grade 3", short: "G3", kanji: "三級", color: "#5F95C9", glow: "95 149 201", feel: "Steady flow" },
  g2: { label: "Grade 2", short: "G2", kanji: "二級", color: "#5A63E6", glow: "90 99 230", feel: "Deep current" },
  semi1: { label: "Semi-Grade 1", short: "S1", kanji: "準一級", color: "#9A4DFF", glow: "154 77 255", feel: "Rising storm" },
  g1: { label: "Grade 1", short: "G1", kanji: "一級", color: "#E0335A", glow: "224 51 90", feel: "Burning crimson" },
  special: { label: "Special Grade", short: "SP", kanji: "特級", color: "#FF3B2F", glow: "255 59 47", feel: "Beyond measure" },
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
