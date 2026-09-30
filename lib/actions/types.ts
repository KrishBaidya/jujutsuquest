// Agreed server action signatures. Each action lives in its own file under
// lib/actions/ with "use server" and must match these types, so UI and logic
// can be built against them independently.
import type { DbGrade, QuestCategory, VerificationMethod } from "@/lib/db/schema";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

// ---- lib/actions/auth.ts ----
/** `hostelId` is only needed the first time a UID signs in. */
export type SignInInput = { name: string; uid: string; hostelId: string };
export type SignIn = (input: SignInInput) => Promise<ActionResult<{ isNew: boolean }>>;
export type SignOut = () => Promise<void>;

// ---- lib/actions/quests.ts ----
export type AcceptQuest = (questId: string) => Promise<ActionResult<{ missionId: string }>>;
export type CreateQuestInput = {
  title: string;
  description: string;
  category: QuestCategory;
  locationId: string;
  verification: VerificationMethod;
  verifyHint: string;
};
/** New quests are created with status "pending" until a reviewer opens them. */
export type CreateQuest = (input: CreateQuestInput) => Promise<ActionResult<{ questId: string }>>;

// ---- lib/actions/submit.ts ----
export type SubmitInput =
  | { questId: string; method: "photo"; photoDataUrl: string }
  | { questId: string; method: "qr"; token: string };

export type SubmitOutcome =
  | {
      status: "approved";
      /** CE actually paid, Black Flash multiplier included. */
      ce: number;
      blackFlash: boolean;
      /** Set when this payout moved the student up a grade. */
      promotedTo: DbGrade | null;
      newBadges: string[];
    }
  | { status: "rejected"; reason: string }
  | { status: "in_review" };

export type SubmitProof = (input: SubmitInput) => Promise<ActionResult<SubmitOutcome>>;

export const BLACK_FLASH_CHANCE = 0.1;
export const BLACK_FLASH_MULTIPLIER = 2.5;

// ---- lib/actions/review.ts ----
export type ReviewSubmission = (
  submissionId: string,
  decision: { approve: true } | { approve: false; reason: string },
) => Promise<ActionResult>;

// ---- lib/actions/residue.ts ----
/** Residue: a student photo left at a campus location. Posted straight to the location's gallery. */
export type LeaveResidue = (input: {
  photoDataUrl: string;
  caption: string;
  locationId: string;
}) => Promise<ActionResult<{ postId: string }>>;
export type ToggleResidueLike = (postId: string) => Promise<ActionResult<{ liked: boolean; likes: number }>>;
