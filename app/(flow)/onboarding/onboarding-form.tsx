"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getSessionCard, signIn } from "@/lib/actions/auth";
import { Action, Kanji } from "@/components/app/primitives";
import { GRADES, gradeProgress } from "@/lib/grades";
import { Stage } from "@/components/app/shell";
import { PageTransition } from "@/components/app/transitions";
import { cn } from "@/lib/utils";

const UID_PATTERN = /^[A-Z0-9]{2,6}(-[A-Z0-9]{1,6}){1,3}$/;
const DEPARTMENTS = ["Finance", "Analytics", "Marketing", "Operations", "HR", "Insurance"];

type Card = { name: string; department: string; hostel: string | null; ce: number };
const field =
  "h-[52px] w-full rounded-lg border border-night-700 bg-night-800 lg:bg-night-900 px-4 text-base text-mist-100 outline-none placeholder:text-mist-500 focus-visible:border-cursed-500 focus-visible:ring-[3px] focus-visible:ring-cursed-500/20";

export function OnboardingForm({ hostels }: { hostels: { id: string; name: string; crest: string }[] }) {
  const [step, setStep] = useState<"form" | "card">("form");
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [hostelId, setHostelId] = useState("");
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [school, setSchool] = useState("");
  const [touched, setTouched] = useState(false);

  const uidOk = UID_PATTERN.test(uid.trim().toUpperCase());
  const valid = name.trim().length > 1 && uidOk && school !== "" && hostelId !== "";

  if (step === "card" && card) {
    const p = gradeProgress(card.ce);
    const g = GRADES[p.grade];
    return (
      <Stage className="lg:bg-night-950">
      <div className="rise-in flex flex-1 flex-col items-center gap-5 bg-night-950 px-7 pb-8 pt-8">
        <Kanji className="brush mt-2 text-[96px] leading-none">呪</Kanji>
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="font-display text-[28px] font-extrabold leading-[1.2]">Welcome, sorcerer.</h1>
          <p className="text-[15px] text-mist-300">Every mission you complete feeds your energy.</p>
        </div>
        <div className="relative mt-2 w-full">
          <div className="absolute -inset-6 bg-[radial-gradient(ellipse_at_center,rgba(143,163,184,0.28),transparent_68%)]" />
          <div className="paper relative flex flex-col gap-4 rounded px-[22px] py-6 shadow-[inset_0_0_0_1px_#DDD5C3,inset_0_0_0_6px_#EFE9DC,inset_0_0_0_7px_#4A3426]">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-sumi-600">Sorcerer rank</span>
                <span className="font-display text-[40px] font-extrabold leading-[1.1]">{g.label}</span>
              </div>
              <span
                className="inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-bold"
                style={{ borderColor: g.color }}
              >
                <span className="size-2 rounded-full" style={{ background: g.color }} />
                {g.feel}
              </span>
            </div>
            <div className="ink-divider !opacity-45" />
            <div className="grid grid-cols-2 gap-2.5 text-[13px] text-sumi-600">
              <div className="flex flex-col">
                <span>Name</span>
                <span className="text-[15px] font-bold text-sumi-900">{card.name}</span>
              </div>
              <div className="flex flex-col">
                <span>{card.hostel ?? "Department"}</span>
                <span className="text-[15px] font-bold text-sumi-900">{card.department}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[28px] font-extrabold">
                  {card.ce.toLocaleString("en-IN")} <span className="text-[15px]">CE</span>
                </span>
                <span className="text-[13px] text-sumi-600">
                  {p.ceiling === null ? "Top grade" : `${p.toNext.toLocaleString("en-IN")} CE to next grade`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-washi-500">
                <div className="h-full rounded-full" style={{ width: `${Math.round(p.ratio * 100)}%`, background: g.color }} />
              </div>
            </div>
          </div>
          <div className="relative mx-auto mt-3.5 flex w-max max-w-full items-center gap-2 rounded-lg border border-night-600 bg-night-700 px-3.5 py-2.5 text-[13px]">
            <Kanji className="text-[17px] text-cursed-300">呪</Kanji>
            <span>
              <strong>CE</strong> is Cursed Energy. Earn it to rank up.
            </span>
          </div>
        </div>
        <Action href="/board" className="mt-auto w-full">
          See the board
        </Action>
      </div>
      </Stage>
    );
  }

  return (
    <PageTransition>
    <form
      noValidate
      className="bg-grid-night flex flex-1 flex-col gap-7 px-7 pb-8 pt-8 lg:mx-auto lg:grid lg:w-full lg:max-w-[1000px] lg:flex-none lg:grid-cols-2 lg:items-center lg:gap-x-20 lg:gap-y-8 lg:bg-none lg:px-8 lg:py-24"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!valid || pending) return;
        setError(null);
        setPending(true);
        void (async () => {
          try {
            const res = await signIn({ name, uid, department: school, hostelId });
            if (!res.ok) return setError(res.error);
            const next = await getSessionCard();
            if (!next) return setError("Signed in, but your profile could not be loaded. Try again.");
            setCard(next);
            setStep("card");
          } catch {
            setError("Something went wrong. Try again.");
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div className="relative flex h-[150px] items-center lg:col-start-1 lg:row-start-1 lg:h-[220px]">
        <div className="absolute -left-5 top-0 h-40 w-[180px] bg-[radial-gradient(circle,rgba(61,139,255,0.35),transparent_65%)]" />
        <Kanji className="brush float relative text-[132px] leading-none lg:text-[220px]">呪</Kanji>
      </div>
      <div className="flex flex-col gap-2 lg:col-start-1 lg:row-start-2 lg:self-start">
        <h1 className="font-display text-[32px] font-extrabold leading-[1.2] lg:text-[56px] lg:leading-[1.1]">Enter the domain.</h1>
        <p className="text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          Campus life, turned into missions. Four details and you&apos;re in. No password needed.
        </p>
      </div>
      <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:self-end lg:rounded-t-2xl lg:border lg:border-b-0 lg:border-night-700 lg:bg-night-800 lg:p-8 lg:pb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Your name</span>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Aarav Mehta"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Student UID</span>
          <input
            className={cn(field, "tracking-[0.04em]", touched && !uidOk && "border-flash-500")}
            value={uid}
            onChange={(e) => setUid(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            placeholder="BIM-2026-0417"
            aria-invalid={touched && !uidOk}
          />
          {touched && !uidOk && (
            <span className="text-[13px] text-flash-500">Use the format BIM-2026-0417.</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Choose your school</span>
          <div className="relative">
            <select
              className={cn(field, "appearance-none pr-10", school === "" && "text-mist-500")}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            >
              <option value="">Select a department</option>
              {DEPARTMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-mist-300" />
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mist-300">Choose your hostel</span>
          <div className="relative">
            <select
              className={cn(field, "appearance-none pr-10", hostelId === "" && "text-mist-500")}
              value={hostelId}
              onChange={(e) => setHostelId(e.target.value)}
            >
              <option value="">Select a hostel</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-mist-300" />
          </div>
        </label>
      </div>
      <div className="mt-auto flex flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:-mt-8 lg:self-start lg:rounded-b-2xl lg:border lg:border-t-0 lg:border-night-700 lg:bg-night-800 lg:p-8 lg:pt-4">
        <Action type="submit" disabled={pending || (touched && !valid)}>
          {pending ? "Entering..." : "Enter the domain"}
          <ArrowRight className="size-5" aria-hidden />
        </Action>
        {error && (
          <p role="alert" className="text-center text-[13px] text-flash-500">
            {error}
          </p>
        )}
        <p className="text-center text-[13px] text-mist-500">Your student UID is your key to the board.</p>
      </div>
    </form>
    </PageTransition>
  );
}
