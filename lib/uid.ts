// Student UIDs look like 25BCS10001: two-digit intake year, course code, five-digit student number.

export const UID_PATTERN = /^(\d{2})([A-Z]{2,4})(\d{5})$/;
export const UID_EXAMPLE = "25BCS10001";

const COURSES: Record<string, string> = {
  BCS: "B.E. Computer Science",
  BAI: "B.E. CSE (AI & ML)",
  BIT: "B.E. Information Technology",
  BEC: "B.E. Electronics & Comm.",
  BEE: "B.E. Electrical",
  BME: "B.E. Mechanical",
  BCV: "B.E. Civil",
  BCA: "Bachelor of Computer Applications",
  BBA: "Bachelor of Business Admin.",
  BCO: "Bachelor of Commerce",
  BSC: "Bachelor of Science",
  BAR: "Bachelor of Architecture",
  BPH: "Bachelor of Pharmacy",
  BDS: "Bachelor of Design",
  MBA: "Master of Business Admin.",
  MCA: "Master of Computer Applications",
};

export type ParsedUid = {
  uid: string;
  /** Four-digit intake year. */
  year: number;
  course: string;
  /** Full course name when known, otherwise the code. */
  courseName: string;
  number: string;
};

/** Upper-cases, drops spaces and dashes. */
export const normaliseUid = (raw: string) => raw.toUpperCase().replace(/[\s-]+/g, "");

export function parseUid(raw: string): ParsedUid | null {
  const uid = normaliseUid(raw);
  const m = UID_PATTERN.exec(uid);
  if (!m) return null;
  const [, yy, course, number] = m;
  return { uid, year: 2000 + Number(yy), course, courseName: COURSES[course] ?? course, number };
}
