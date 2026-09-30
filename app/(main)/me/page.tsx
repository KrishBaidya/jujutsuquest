import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES, GRADE_ORDER, GRADE_THRESHOLDS, gradeProgress } from "@/lib/grades";
import { parseUid } from "@/lib/uid";
import { getViewer } from "@/lib/queries/session";
import { getMissions, getProfile } from "@/lib/queries/me";
import { getLocations } from "@/lib/queries/locations";
import { residueCount } from "@/lib/queries/residue";
import { Ce, CeBar, GradeSeal, Screen, Section } from "@/components/ui";
import { SignOutButton } from "@/components/me/sign-out";

export const metadata: Metadata = { title: "Sorcerer" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const REASON: Record<string, string> = {
  quest: "Exorcism",
  black_flash: "Black Flash",
  badge: "Seal",
  seed: "Earlier record",
  adjust: "Adjustment",
};

export default async function MePage() {
  const user = (await getViewer())!;
  const [profile, missions, locations, posts] = await Promise.all([
    getProfile(user),
    getMissions(user.id),
    getLocations(user.id),
    residueCount(user.id),
  ]);
  const uid = parseUid(user.uid);
  const g = GRADES[user.display];
  const p = gradeProgress(user.ce);
  const next = p.next ? GRADES[p.next] : null;
  const cleared = locations.filter((l) => l.cleared).length;
  const earned = profile.badges.filter((b) => b.earnedAt).length;

  const stats = [
    { k: "番", label: "Campus rank", value: `#${profile.rank}` },
    { k: "祓", label: "Exorcised", value: String(missions.completed.length) },
    { k: "帳", label: "Veils lifted", value: `${cleared}/${locations.length}` },
    { k: "痕", label: "Residue left", value: String(posts) },
  ];

  return (
    <Screen>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        {/* Student ID */}
        <div className="paper paper-frame relative overflow-hidden p-6 sm:p-8">
          <span aria-hidden className="kanji pointer-events-none absolute -bottom-10 -right-4 text-[220px] leading-none text-blood/[0.06]">
            呪
          </span>
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-[0.3em] text-paper-muted">
                呪術高専 · CHANDIGARH BRANCH
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.3em] text-blood">STUDENT IDENTIFICATION · 学生証</p>
            </div>
            {profile.hostel && (
              <span className="seal size-14 flex-none rotate-[-6deg] text-[28px]" title={profile.hostel.name}>
                {profile.hostel.crest}
              </span>
            )}
          </div>

          <div className="relative mt-6 flex items-center gap-5">
            <GradeSeal grade={user.display} size={76} />
            <div className="min-w-0">
              <h1 className="font-display text-[28px] leading-[1.05] sm:text-[34px]">{user.name}</h1>
              <p className="mt-1 text-[13px] text-paper-muted">
                {g.label} sorcerer{profile.special && " · Special Grade seat"}
                {user.role === "reviewer" && " · Senior reviewer"}
              </p>
            </div>
          </div>

          <p className="relative mt-6 font-mono text-[30px] font-semibold tracking-[0.14em] sm:text-[36px]">{user.uid}</p>
          <dl className="relative mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-paper-ink/15 pt-3 text-[12px] sm:grid-cols-4">
            {[
              ["Batch", uid ? String(uid.year) : "—"],
              ["Course", uid?.course ?? "—"],
              ["Student no.", uid?.number ?? "—"],
              ["Hostel", profile.hostel?.name ?? "Day scholar"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">{k}</dt>
                <dd className="font-display text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="relative mt-2 text-[12px] text-paper-muted">{uid?.courseName ?? user.department}</p>
          {/* barcode-ish flourish */}
          <div aria-hidden className="relative mt-5 h-7 bg-[repeating-linear-gradient(90deg,var(--color-paper-ink)_0_2px,transparent_2px_4px,var(--color-paper-ink)_4px_5px,transparent_5px_9px)] opacity-70" />
        </div>

        {/* Energy + stats */}
        <div className="flex flex-col gap-4">
          <div className="panel p-5">
            <div className="flex items-baseline justify-between">
              <p className="kicker">Cursed energy</p>
              {next && (
                <p className="text-[12px] text-fg-muted">
                  {p.toNext.toLocaleString("en-IN")} to <span className="kanji" style={{ color: next.color }}>{next.kanji}</span>
                </p>
              )}
            </div>
            <Ce value={user.ce} className="mt-1 block text-[46px] leading-none" />
            <CeBar ratio={p.ratio} color={next?.color ?? g.color} className="mt-3" />
            {/* Grade ladder */}
            <ol className="mt-4 grid grid-cols-6 gap-1">
              {GRADE_ORDER.map((k) => {
                const gg = GRADES[k];
                const reached = k === "special" ? user.display === "special" : user.ce >= GRADE_THRESHOLDS[k];
                const current = k === user.display;
                return (
                  <li
                    key={k}
                    className={cn("flex flex-col items-center gap-0.5 border-t-2 pt-1.5", reached ? "" : "opacity-35")}
                    style={{ borderColor: reached ? gg.color : "var(--color-ink-500)" }}
                  >
                    <span className={cn("kanji text-[13px]", current && "scale-125")} style={{ color: gg.color }}>
                      {gg.kanji}
                    </span>
                    <span className="font-mono text-[9px] text-fg-faint">
                      {k === "special" ? "TOP 4" : GRADE_THRESHOLDS[k].toLocaleString("en-IN")}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="panel flex items-center gap-3 p-4">
                <span className="kanji text-[28px] text-blood">{s.k}</span>
                <div>
                  <p className="font-display text-[22px] leading-none">{s.value}</p>
                  <p className="mt-1 text-[11px] text-fg-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {user.role === "reviewer" && (
            <Link href="/me/review" className="paper group flex items-center gap-3 px-4 py-3.5">
              <span className="kanji text-[28px] text-blood">審</span>
              <div className="flex-1">
                <p className="font-display text-[16px]">Review queue</p>
                <p className="text-[12px] text-paper-muted">
                  {profile.reviewCount} {profile.reviewCount === 1 ? "submission waits" : "submissions wait"} for a senior sorcerer
                </p>
              </div>
              <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-x-10 lg:grid-cols-2">
        <Section n={1} title="Seals" right={<span className="font-mono text-[12px] text-fg-muted">{earned}/{profile.badges.length}</span>}>
          <ul className="grid grid-cols-4 gap-2.5">
            {profile.badges.map((b) => {
              const has = !!b.earnedAt;
              return (
                <li key={b.id} className="flex flex-col items-center gap-1.5 text-center" title={b.description}>
                  <span
                    className={cn(
                      "flex size-16 items-center justify-center",
                      has ? "seal text-[30px]" : "border border-dashed border-ink-500 text-[26px] text-ink-400 kanji",
                    )}
                  >
                    {b.kanji}
                  </span>
                  <span className={cn("text-[11px] font-bold leading-tight", has ? "text-fg" : "text-fg-faint")}>{b.name}</span>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section n={2} title="Ledger">
          {profile.history.length ? (
            <ol className="flex flex-col">
              {profile.history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 border-b border-ink-700 py-2.5">
                  <span className="w-14 font-mono text-[11px] text-fg-faint">{dateFmt.format(h.createdAt)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">{h.questTitle ?? h.note ?? REASON[h.reason]}</p>
                    <p className="text-[11px] text-fg-faint">{REASON[h.reason] ?? h.reason}</p>
                  </div>
                  <Ce value={h.amount} sign className={cn("text-[15px]", h.reason === "black_flash" ? "text-blood-bright" : "")} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[14px] text-fg-muted">No cursed energy recorded yet.</p>
          )}
        </Section>
      </div>

      <div className="mt-4 flex justify-center">
        <SignOutButton />
      </div>
    </Screen>
  );
}
