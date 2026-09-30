import Link from "next/link";
import { ChevronRight, Clock, Flame, Snowflake, Swords, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  hostelById,
  hostelDuel,
  hostelFixtures,
  hostels,
  me,
  type Fixture,
  type Hostel,
} from "@/lib/mock-data";
import { CountUp } from "@/components/app/count-up";
import { Reveal } from "@/components/app/reveal";
import { Scroller } from "@/components/app/scroller";

function Crest({ hostel, size = "md" }: { hostel: Hostel; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-[22%] font-display font-extrabold text-white",
        size === "lg" && "size-[72px] text-[38px] lg:size-[88px] lg:text-[46px]",
        size === "md" && "size-10 text-xl",
        size === "sm" && "size-7 text-sm",
      )}
      style={{
        background: `linear-gradient(145deg, ${hostel.color}, ${hostel.color}99)`,
        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.18), 0 0 ${size === "lg" ? 28 : 12}px ${hostel.color}77`,
      }}
      aria-hidden
    >
      {hostel.crest}
    </span>
  );
}

/** This week's head-to-head for the student's hostel. `compact` drops the contributor lists. */
export function HostelDuel({ compact = false }: { compact?: boolean }) {
  const home = hostelById(hostelDuel.home.id);
  const away = hostelById(hostelDuel.away.id);
  const total = hostelDuel.home.ce + hostelDuel.away.ce;
  const homePct = Math.round((hostelDuel.home.ce / total) * 100);
  const lead = hostelDuel.home.ce - hostelDuel.away.ce;
  const sides = [
    { hostel: home, data: hostelDuel.home, mine: home.id === me.hostel },
    { hostel: away, data: hostelDuel.away, mine: away.id === me.hostel },
  ];

  return (
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-lg border border-night-600 bg-night-800 p-4 lg:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${home.color}33, transparent 55%), radial-gradient(ellipse at 100% 0%, ${away.color}33, transparent 55%)`,
        }}
      />
      <div className="relative flex items-center justify-between text-[13px]">
        <span className="flex items-center gap-1.5 font-bold">
          <Swords className="size-4 text-cursed-300" aria-hidden />
          Hostel duel · week {hostelDuel.week}
        </span>
        <span className="flex h-6 items-center gap-1 rounded-full bg-night-950 px-2.5 font-bold text-ember-500">
          <Clock className="size-3.5" aria-hidden />
          {hostelDuel.endsIn} left
        </span>
      </div>

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {sides.map(({ hostel, data, mine }, i) => (
          <div
            key={hostel.id}
            className={cn("rise-in flex flex-col items-center gap-1.5 text-center", i === 1 && "order-3")}
            style={{ animationDelay: `${i * 140}ms` }}
          >
            <span className={cn(!compact && "float")} style={{ animationDelay: `${i * 900}ms` }}>
              <Crest hostel={hostel} size={compact ? "md" : "lg"} />
            </span>
            <span className="flex items-center gap-1.5 font-display text-lg font-extrabold">
              {hostel.name}
              {mine && (
                <span className="rounded-full bg-cursed-500 px-1.5 py-px font-body text-[11px] font-bold text-night-950">
                  yours
                </span>
              )}
            </span>
            <span className="font-display text-2xl font-extrabold lg:text-[32px]" style={{ color: hostel.color }}>
              <CountUp value={data.ce} />
            </span>
          </div>
        ))}
        <span className="stamp-in order-2 flex size-11 items-center justify-center rounded-[10px] bg-seal-600 font-display text-xl font-extrabold text-washi-100 shadow-[inset_0_0_0_2px_#D8392B,inset_0_0_0_3px_#EFE9DC]">
          対
        </span>
      </div>

      {/* tug of war */}
      <div className="relative flex flex-col gap-1.5">
        <div
          className="flex h-3.5 overflow-hidden rounded-full bg-night-700"
          role="img"
          aria-label={`${home.name} ${homePct}%, ${away.name} ${100 - homePct}%`}
        >
          <div
            className="gauge-fill h-full"
            style={{ width: `${homePct}%`, background: home.color, boxShadow: `0 0 14px ${home.color}` }}
          />
          <div className="h-full w-0.5 bg-washi-100" />
          <div className="h-full flex-1" style={{ background: away.color, opacity: 0.85 }} />
        </div>
        <div className="flex justify-between text-[13px] text-mist-300">
          <span>{homePct}%</span>
          <span className="font-bold text-mist-100">
            {lead >= 0 ? home.name : away.name} leads by {Math.abs(lead).toLocaleString("en-US")} CE
          </span>
          <span>{100 - homePct}%</span>
        </div>
      </div>

      {compact ? (
        <Link
          href="/rank?view=hostels"
          scroll={false}
          className="relative flex items-center justify-center gap-1 text-[13px] font-bold text-cursed-300 hover:text-mist-100"
        >
          See the full duel
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <>
          <div className="relative grid grid-cols-2 gap-3">
            {sides.map(({ hostel, data }) => (
              <div key={hostel.id} className="flex flex-col gap-1.5 rounded bg-night-950/60 p-3">
                <span className="text-[13px] text-mist-500">Top contributors</span>
                {data.top.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-2 text-[13px]">
                    <span className="w-3 font-display font-extrabold text-mist-500">{i + 1}</span>
                    <span className={cn("flex-1 truncate", t.isMe && "font-bold text-cursed-300")}>
                      {t.isMe ? "You" : t.name}
                    </span>
                    <span className="font-display font-extrabold">+{t.ce.toLocaleString("en-US")}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="relative flex items-center gap-2 rounded border border-dashed border-gold-400/50 bg-gold-400/10 px-3 py-2 text-[13px]">
            <Trophy className="size-4 flex-none text-gold-400" aria-hidden />
            <span>
              <strong>Stake:</strong> {hostelDuel.stake}.
            </span>
          </p>
        </>
      )}
    </section>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const hot = streak > 0;
  const Icon = hot ? Flame : Snowflake;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 text-[11px] font-bold",
        hot ? "bg-ember-500/15 text-ember-500" : "bg-azure-500/15 text-azure-500",
      )}
    >
      <Icon className={cn("size-3", hot && streak >= 3 && "flame")} aria-hidden />
      {hot ? "W" : "L"}
      {Math.abs(streak)}
    </span>
  );
}

function Standings() {
  const max = hostels[0].ce;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-extrabold lg:text-[22px]">Hostel standings</h2>
        <span className="text-[13px] text-mist-300">Term total CE</span>
      </div>
      <ol className="flex flex-col rounded-lg border border-night-700 bg-night-800 px-4 py-1">
        {hostels.map((h, i) => {
          const mine = h.id === me.hostel;
          return (
            <Reveal
              as="li"
              key={h.id}
              index={i}
              className={cn(
                "grid grid-cols-[22px_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-3 last:border-b-0",
                mine && "-mx-2 rounded-lg border border-cursed-500 bg-cursed-500/10 px-2 last:border-b",
              )}
            >
              <span className="font-display text-xl font-extrabold text-mist-300">{i + 1}</span>
              <Crest hostel={h} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[15px] font-bold">
                  <span className="truncate">{h.name}</span>
                  <StreakBadge streak={h.streak} />
                </span>
                <div className="h-1.5 overflow-hidden rounded-full bg-night-700">
                  <div
                    className="gauge-fill h-full rounded-full"
                    style={{ width: `${Math.round((h.ce / max) * 100)}%`, background: h.color }}
                  />
                </div>
                <span className="text-[13px] text-mist-300">
                  {h.wins}W–{h.losses}L · {h.members} members · {Math.round(h.ce / h.members)} CE each
                </span>
              </div>
              <span className="font-display text-[17px] font-extrabold">{h.ce.toLocaleString("en-US")}</span>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

function FixtureCard({ fixture }: { fixture: Fixture }) {
  const home = hostelById(fixture.home);
  const away = hostelById(fixture.away);
  const mine = home.id === me.hostel || away.id === me.hostel;
  return (
    <div
      className={cn(
        "flex w-[220px] flex-col gap-2.5 rounded-lg border bg-night-800 p-3.5",
        mine ? "border-cursed-500" : "border-night-700",
      )}
    >
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-mist-300">Week {fixture.week}</span>
        {fixture.live ? (
          <span className="flex items-center gap-1 font-bold text-flash-500">
            <span className="size-1.5 animate-pulse rounded-full bg-flash-500" />
            Live
          </span>
        ) : (
          <span className="text-mist-500">Upcoming</span>
        )}
      </div>
      {[
        { h: home, ce: fixture.homeCe, other: fixture.awayCe },
        { h: away, ce: fixture.awayCe, other: fixture.homeCe },
      ].map(({ h, ce, other }) => (
        <div key={h.id} className="flex items-center gap-2">
          <Crest hostel={h} size="sm" />
          <span className="flex-1 truncate text-[15px] font-bold">{h.name}</span>
          <span
            className={cn(
              "font-display text-[15px] font-extrabold",
              ce !== undefined && other !== undefined && ce < other && "text-mist-500",
            )}
          >
            {ce !== undefined ? ce.toLocaleString("en-US") : "–"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HostelsView() {
  return (
    <div className="flex flex-col gap-7 px-5 pb-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:px-0 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-7">
        <HostelDuel />
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-extrabold lg:text-[22px]">Fixtures</h2>
            <span className="text-[13px] text-mist-300">Other duels and what is next</span>
          </div>
          <Scroller label="Hostel fixtures" className="-mx-5 lg:mx-0" trackClassName="px-5 lg:px-0">
            {hostelFixtures.map((f) => (
              <FixtureCard key={`${f.week}-${f.home}-${f.away}`} fixture={f} />
            ))}
          </Scroller>
        </section>
      </div>
      <Standings />
    </div>
  );
}
