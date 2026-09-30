"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CircleCheck, Footprints, Info, QrCode, RefreshCw, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryOf, me, type CategoryKey, type Verification } from "@/lib/mock-data";
import { Action, CeGauge, Kanji, Segmented } from "@/components/app/primitives";
import { CountUp } from "@/components/app/count-up";
import { BACK } from "@/components/app/transitions";

export type Outcome = "success" | "rejected" | "flash" | "promotion";
type Step = "scan" | "reading" | "rejected" | "flash" | "seal" | "promotion";

type QuestLite = { id: string; title: string; ce: number; location: string; category: CategoryKey };

const FLASH_CHANCE = 0.1;
const READ_MS = 2400;

export function VerifyFlow({
  quest,
  initialMode,
  forcedOutcome,
}: {
  quest: QuestLite;
  initialMode: Verification;
  forcedOutcome?: Outcome;
}) {
  const [mode, setMode] = useState<Verification>(initialMode);
  const [step, setStep] = useState<Step>("scan");
  const [outcome, setOutcome] = useState<Outcome>("success");
  const [retries, setRetries] = useState(2);

  const capture = useCallback(() => {
    // Real capture (getUserMedia / QR decode / geolocation) plugs in here.
    setOutcome(forcedOutcome ?? (Math.random() < FLASH_CHANCE ? "flash" : "success"));
    setStep("reading");
  }, [forcedOutcome]);

  const finishReading = useCallback(
    (o: Outcome) => {
      setStep(o === "rejected" ? "rejected" : o === "flash" ? "flash" : o === "promotion" ? "promotion" : "seal");
    },
    [],
  );

  const earned = outcome === "flash" ? Math.round(quest.ce * 2.5) : quest.ce;

  switch (step) {
    case "scan":
      return <Scanner quest={quest} mode={mode} setMode={setMode} onCapture={capture} />;
    case "reading":
      return <Reading onDone={() => finishReading(outcome)} />;
    case "rejected":
      return (
        <Rejected
          title={quest.title}
          retries={retries}
          onRetake={() => {
            setRetries((r) => Math.max(0, r - 1));
            setOutcome("success");
            setStep("scan");
          }}
        />
      );
    case "flash":
      return <BlackFlash base={quest.ce} total={earned} onNext={() => setStep("seal")} />;
    case "promotion":
      return <Promotion />;
    case "seal":
      return <Seal quest={quest} earned={earned} />;
  }
}

/* ---------- 07 scan ---------- */

const MODE_META = {
  photo: { title: "Frame the subject", Icon: Camera },
  qr: { title: "Point at the QR on the notice board", Icon: QrCode },
  walk: { title: "Keep walking, tracking is on", Icon: Footprints },
} as const;

function Scanner({
  quest,
  mode,
  setMode,
  onCapture,
}: {
  quest: QuestLite;
  mode: Verification;
  setMode: (m: Verification) => void;
  onCapture: () => void;
}) {
  const meta = MODE_META[mode];
  return (
    <div className="relative flex min-h-dvh lg:min-h-[720px] flex-1 flex-col overflow-hidden bg-[repeating-linear-gradient(135deg,#0c0a14_0_14px,#100d1b_14px_28px)]">
      <span className="absolute left-6 top-[200px] font-mono text-[13px] text-mist-500">live camera feed</span>
      <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+16px)] flex items-center justify-between">
        <Link href="/missions" transitionTypes={BACK} aria-label="Close scanner" className="flex size-12 items-center justify-center rounded-full bg-night-800/90">
          <X className="size-[22px]" />
        </Link>
        <div className="flex h-10 items-center rounded-full bg-night-800/90 px-4 text-[15px] font-bold">
          {mode === "qr" ? "Scan checkpoint 3 of 3" : quest.title.length > 28 ? "Verify mission" : quest.title}
        </div>
        <button type="button" aria-label="Toggle torch" className="flex size-12 items-center justify-center rounded-full bg-night-800/90">
          <Zap className="size-[22px]" />
        </button>
      </div>

      <button
        type="button"
        onClick={onCapture}
        aria-label={mode === "qr" ? "Simulate a QR scan" : mode === "walk" ? "Simulate reaching the goal" : "Take photo"}
        className="absolute left-1/2 top-[250px] size-[260px] -translate-x-1/2 lg:top-[120px] lg:size-[230px]"
      >
        {[
          "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
          "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
          "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-lg",
          "right-0 bottom-0 border-r-4 border-b-4 rounded-br-lg",
        ].map((c) => (
          <span key={c} className={cn("absolute size-11 border-cursed-300", c)} />
        ))}
        <span className="scan-sweep absolute inset-x-3.5 top-28 h-0.5 bg-cursed-300 shadow-[0_0_16px_4px_rgba(61,139,255,0.7)]" />
      </button>

      <div className="mt-auto flex flex-col items-center gap-2 bg-gradient-to-b from-transparent via-night-950 to-night-950 px-6 pb-10 pt-24 text-center">
        <span className="flex items-center gap-2 text-[17px] font-bold">
          <meta.Icon className="size-5" aria-hidden />
          {meta.title}
        </span>
        <span className="text-[15px] text-mist-300">
          {quest.title} · {quest.location}
        </span>
        <Segmented
          label="Verification method"
          value={mode}
          onChange={setMode}
          className="mt-3.5 !rounded-full p-1"
          items={[
            { value: "photo", label: <><Camera className="size-4" aria-hidden />Photo</> },
            { value: "qr", label: <><QrCode className="size-4" aria-hidden />QR</> },
            { value: "walk", label: <><Footprints className="size-4" aria-hidden />Walk</> },
          ]}
        />
        <Action onClick={onCapture} size="md" className="mt-3 w-full max-w-[300px]">
          {mode === "photo" ? "Capture" : mode === "qr" ? "Scan now" : "I've arrived"}
        </Action>
        {mode === "qr" && <span className="mt-1 text-[13px] text-cursed-300">Code won&apos;t scan? Enter it by hand</span>}
      </div>
    </div>
  );
}

/* ---------- 08 reading ---------- */

function Reading({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / READ_MS);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else doneRef.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-night-950 px-8 pb-16" role="status" aria-live="polite">
      <div className="relative">
        <div className="absolute -inset-[30px] bg-[radial-gradient(circle,rgba(61,139,255,0.3),transparent_70%)]" />
        <div
          className="relative rounded-[10px] p-1"
          style={{ background: `conic-gradient(from 0deg, #9CC4FF 0 ${pct * 100}%, #2A2E38 ${pct * 100}% 100%)` }}
        >
          <div className="placeholder-photo-dark flex h-80 w-[252px] items-end rounded-md p-3">
            <span className="font-mono text-[13px] text-mist-300">captured photo</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-center">
        <span className="font-display text-2xl font-extrabold">Reading cursed residue…</span>
        <span className="text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          Jev is checking your capture against the scouting shot.
        </span>
      </div>
    </div>
  );
}

/* ---------- 09 rejected ---------- */

function Rejected({ title, retries, onRetake }: { title: string; retries: number; onRetake: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-[22px] bg-night-900 px-6 pb-9 pt-[calc(env(safe-area-inset-top)+24px)]">
      <div className="flex items-center gap-3.5">
        <div className="placeholder-photo-dark h-[92px] w-[72px] flex-none rounded opacity-70" />
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-mist-300">{title}</span>
          <h1 className="font-display text-[28px] font-extrabold leading-[1.2]">Not accepted yet</h1>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded bg-washi-100 p-[18px] text-sumi-900 shadow-[inset_0_0_0_1px_#DDD5C3]">
        <span className="flex items-center gap-1.5 text-[13px] text-sumi-600">
          <Info className="size-3.5" aria-hidden />
          What Jev saw
        </span>
        <p className="text-[15px] leading-[1.6]">
          The wall is in frame, but the red fox isn&apos;t. It sits low on the left side of the mural.
        </p>
        <div className="ink-divider !opacity-35" />
        <span className="text-[13px] text-sumi-600">Try this</span>
        <p className="text-[15px] leading-[1.6]">
          Stand by the courtyard bench, face the back wall, and crouch a little.
        </p>
      </div>
      <div className="flex items-center gap-2.5 text-[13px] text-mist-300">
        <RefreshCw className="size-[17px]" aria-hidden />
        {retries > 0 ? `${retries} ${retries === 1 ? "retry" : "retries"} left today. No CE is lost.` : "No retries left today."}
      </div>
      <div className="mt-auto flex flex-col gap-2.5">
        <Action onClick={onRetake} disabled={retries === 0}>
          <Camera className="size-5" aria-hidden />
          Retake photo
        </Action>
        <Action href="/missions" back variant="secondary" size="md">
          Ask a senior sorcerer to review
        </Action>
      </div>
    </div>
  );
}

/* ---------- 10 seal ---------- */

function Seal({ quest, earned }: { quest: QuestLite; earned: number }) {
  const cat = categoryOf(quest.category);
  const total = me.ce + earned;
  const capped = Math.min(total, me.ceTarget);
  return (
    <div className="flex flex-1 flex-col gap-[26px] bg-night-950 px-[30px] pb-9 pt-7">
      <div className="relative">
        <div className="rod-lg" />
        <div className="paper flex flex-col gap-2.5 px-5 pb-[70px] pt-[22px] shadow-[inset_0_0_0_1px_#DDD5C3]">
          <span className="text-[13px] text-sumi-600">
            Mission complete · {cat.k} {cat.label}
          </span>
          <span className="max-w-[220px] font-display text-2xl font-extrabold leading-tight">{quest.title}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-sumi-600">
            <CircleCheck className="size-[17px] text-jade-500" aria-hidden />
            Verified by Jev · 94% match
          </span>
        </div>
        <div className="rod-lg" />
        <div className="absolute bottom-1 right-0 size-[170px] rounded-full border-[3px] border-seal-600/30" />
        <div className="stamp-in absolute bottom-[34px] right-[30px] flex size-[110px] items-center justify-center rounded-[14px] bg-seal-600 shadow-[inset_0_0_0_5px_#D8392B,inset_0_0_0_7px_#EFE9DC,0_4px_0_rgba(0,0,0,0.15)]">
          <Kanji className="text-[64px] leading-none text-washi-100">祓</Kanji>
        </div>
      </div>
      <div className="rise-in flex flex-col items-center gap-1">
        <span className="font-display text-[52px] font-extrabold leading-none text-cursed-300">
          <CountUp value={earned} prefix="+" duration={1100} /> <span className="text-[22px]">CE</span>
        </span>
        <span className="text-[13px] text-mist-300">Cursed Energy added</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="font-display text-[17px] font-extrabold">{total.toLocaleString("en-US")} CE</span>
          <span className="text-mist-300">Grade 2 trial at {me.ceTarget.toLocaleString("en-US")}</span>
        </div>
        <CeGauge value={capped} max={me.ceTarget} />
        <span className="text-[13px] text-mist-300">
          {total >= me.ceTarget ? "Promotion trial unlocked" : `${me.ceTarget - total} CE from your promotion trial`}
        </span>
      </div>
      <div className="mt-auto flex flex-col gap-2.5">
        <Action href="/board" back>Next nearby mission</Action>
        <Action href="/board" back variant="secondary" size="md">
          Back to board
        </Action>
      </div>
    </div>
  );
}

/* ---------- 11 black flash ---------- */

function BlackFlash({ base, total, onNext }: { base: number; total: number; onNext: () => void }) {
  return (
    <button
      type="button"
      onClick={onNext}
      className="flash-in relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-3.5 overflow-hidden bg-black pt-[60px] text-center lg:min-h-[720px]"
      aria-label="Black Flash. Tap to continue"
    >
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" className="shake absolute inset-0 size-full [filter:drop-shadow(0_0_8px_#E5322D)_drop-shadow(0_0_20px_rgba(229,50,45,0.6))]" aria-hidden>
        <polyline className="bolt" points="250,0 210,120 262,150 190,300 236,318 170,440" fill="none" stroke="#E5322D" strokeWidth="5" />
        <polyline className="bolt" style={{ "--i": 1 } as React.CSSProperties} points="40,560 110,520 90,600 180,560 160,640" fill="none" stroke="#E5322D" strokeWidth="3" />
        <polyline className="bolt" style={{ "--i": 2 } as React.CSSProperties} points="390,600 320,650 350,680 270,760 300,780 250,844" fill="none" stroke="#ff5a4f" strokeWidth="4" />
      </svg>
      <Kanji className="relative text-[30px] leading-none tracking-[0.2em]">黒閃</Kanji>
      <span className="relative font-display text-[60px] font-extrabold leading-none text-flash-500 [text-shadow:0_0_24px_rgba(229,50,45,0.8)]">
        Black Flash
      </span>
      <div className="relative mt-7 flex flex-col items-center gap-1.5 bg-black px-4 py-2">
        <span className="font-display text-[40px] font-extrabold leading-none">+{base} × 2.5</span>
        <span className="text-[17px] text-mist-300">{total} CE this mission</span>
      </div>
      <span className="absolute inset-x-0 bottom-10 text-[13px] text-mist-500">Tap to continue</span>
    </button>
  );
}

/* ---------- 12 promotion ---------- */

function Promotion() {
  return (
    <div className="relative flex min-h-dvh lg:min-h-[720px] flex-1 flex-col overflow-hidden bg-[#060709]">
      <div className="absolute left-1/2 top-[360px] size-[420px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(61,139,255,0.32),transparent_62%)]" />
      <div className="relative flex flex-1 flex-col items-center gap-3.5 px-8 pb-9 pt-10 text-center">
        <span className="text-[15px] text-mist-300">Promotion trial passed</span>
        <span className="rise-in relative font-display text-[26px] font-extrabold text-transparent line-through decoration-ember-500/60 [background:linear-gradient(90deg,rgba(240,129,58,0.2),#FF7A2F_45%,rgba(163,166,174,0.15))] [background-clip:text]">
          Grade 3
        </span>
        <span className="brush stamp-in font-display text-[64px] font-extrabold leading-none">Grade 2</span>
        <div className="paper float relative mt-5 flex h-[236px] w-32 flex-col items-center gap-2.5 rounded-[3px] px-0 py-[22px] shadow-[inset_0_0_0_5px_#EFE9DC,inset_0_0_0_7px_#4A3426,0_0_40px_rgba(61,139,255,0.5)]">
          <span className="flex size-10 items-center justify-center rounded-full bg-seal-600 font-display text-xl font-extrabold text-washi-100">
            昇
          </span>
          <span className="font-display text-[46px] font-extrabold leading-[1.05] [writing-mode:vertical-rl]">二級</span>
          <span className="mt-auto text-[13px] font-bold text-sumi-600">Grade 2</span>
        </div>
        <p className="mt-3.5 text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          You can now review Grade 3 and 4 submissions and unseal Grade 2 quests.
        </p>
        <Action href="/me" back className="mt-auto w-full">
          Continue
        </Action>
        <Link href="/me" transitionTypes={BACK} className="text-[13px] text-mist-500">
          Tap anywhere to skip
        </Link>
      </div>
    </div>
  );
}
