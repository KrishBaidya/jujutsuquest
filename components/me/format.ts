export const CATEGORY_KANJI: Record<string, { k: string; label: string }> = {
  explore: { k: "探", label: "Explore" },
  wellness: { k: "癒", label: "Wellness" },
  social: { k: "縁", label: "Social" },
  skill: { k: "技", label: "Skill" },
  event: { k: "祭", label: "Event" },
};

export function relativeTime(date: Date, now = Date.now()) {
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "38m left", "3h left", "2d left", or null when there is no expiry. */
export function timeLeft(expiresAt: Date | null, now = Date.now()) {
  if (!expiresAt) return null;
  const min = Math.round((expiresAt.getTime() - now) / 60000);
  if (min <= 0) return "Expired";
  if (min < 60) return `${min}m left`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}
