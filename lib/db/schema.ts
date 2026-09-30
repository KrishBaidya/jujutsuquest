// Drizzle mirror of drizzle/0000_init.sql. The SQL file is what gets applied
// (it also holds the ledger trigger); keep the two in sync by hand.
import {
  bigserial,
  boolean,
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export type DbGrade = "g4" | "g3" | "g2" | "semi1" | "g1";
export type QuestCategory = "explore" | "wellness" | "social" | "skill" | "event";
export type VerificationMethod = "photo" | "qr";
export type MissionStatus = "accepted" | "in_review" | "completed" | "rejected";
export type SubmissionStatus = "approved" | "rejected" | "in_review";
export type LedgerReason = "quest" | "black_flash" | "badge" | "seed" | "adjust";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const hostels = pgTable("hostels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  crest: text("crest").notNull(),
  color: text("color").notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  uid: text("uid").notNull().unique(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  hostelId: text("hostel_id").references(() => hostels.id),
  role: text("role").$type<"student" | "reviewer">().notNull().default("student"),
  /** Maintained by the ce_ledger trigger. Never write directly. */
  ce: integer("ce").notNull().default(0),
  /** Maintained by the ce_ledger trigger. Never write directly. */
  grade: text("grade").$type<DbGrade>().notNull().default("g4"),
  createdAt: createdAt(),
});

export const locations = pgTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kanji: text("kanji").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  imageUrl: text("image_url"),
  /** Server only. What Gemini compares a photo against. */
  referenceDescription: text("reference_description").notNull().default(""),
  /** Server only. sha256 hex of the printed QR token. */
  qrTokenHash: text("qr_token_hash"),
  createdAt: createdAt(),
});

export const quests = pgTable("quests", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<QuestCategory>().notNull(),
  grade: text("grade").$type<DbGrade>().notNull(),
  ce: integer("ce").notNull(),
  locationId: text("location_id")
    .notNull()
    .references(() => locations.id),
  verification: text("verification").$type<VerificationMethod>().notNull(),
  verifyHint: text("verify_hint").notNull().default(""),
  isBounty: boolean("is_bounty").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: text("status").$type<"open" | "pending" | "closed">().notNull().default("open"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: createdAt(),
});

export const missions = pgTable(
  "missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questId: text("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    status: text("status").$type<MissionStatus>().notNull().default("accepted"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [unique().on(t.userId, t.questId)],
);

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  missionId: uuid("mission_id")
    .notNull()
    .references(() => missions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  method: text("method").$type<VerificationMethod>().notNull(),
  /** Object key in the storage bucket; null for QR. */
  photoKey: text("photo_key"),
  status: text("status").$type<SubmissionStatus>().notNull(),
  confidence: real("confidence"),
  reason: text("reason"),
  blackFlash: boolean("black_flash").notNull().default(false),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  createdAt: createdAt(),
});

export const ceLedger = pgTable("ce_ledger", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").$type<LedgerReason>().notNull(),
  questId: text("quest_id").references(() => quests.id, { onDelete: "set null" }),
  submissionId: uuid("submission_id").references(() => submissions.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: createdAt(),
});

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kanji: text("kanji").notNull(),
  description: text("description").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);

export const archivePosts = pgTable("archive_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationId: text("location_id").references(() => locations.id, { onDelete: "set null" }),
  imageKey: text("image_key").notNull(),
  caption: text("caption").notNull().default(""),
  status: text("status").$type<"visible" | "in_review" | "hidden">().notNull().default("visible"),
  createdAt: createdAt(),
});

export const archiveLikes = pgTable(
  "archive_likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => archivePosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export type User = typeof users.$inferSelect;
export type Hostel = typeof hostels.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type LedgerEntry = typeof ceLedger.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type ArchivePost = typeof archivePosts.$inferSelect;
