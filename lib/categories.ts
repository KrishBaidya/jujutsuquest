import type { QuestCategory } from "@/lib/db/schema";

export type CategoryKey = QuestCategory;

export const CATEGORIES: { key: CategoryKey; k: string; label: string }[] = [
  { key: "explore", k: "探", label: "Explore" },
  { key: "wellness", k: "癒", label: "Wellness" },
  { key: "social", k: "縁", label: "Social" },
  { key: "skill", k: "技", label: "Skill" },
  { key: "event", k: "祭", label: "Event" },
];

export const categoryOf = (key: CategoryKey) => CATEGORIES.find((c) => c.key === key)!;
