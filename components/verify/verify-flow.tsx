"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Camera, CameraOff, ImagePlus, Keyboard, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES, gradeProgress } from "@/lib/grades";
import type { DbGrade, VerificationMethod } from "@/lib/db/schema";
import { submitProof } from "@/lib/actions/submit";
import { BLACK_FLASH_MULTIPLIER, type SubmitInput, type SubmitOutcome } from "@/lib/actions/types";
import { CeBar, GradeSeal, btnClass } from "@/components/ui";

/** Dev-only ceremony previews (?outcome=...); the page never passes one in production. */
export type Preview = "success" | "rejected" | "flash" | "promotion" | "review";
type Step = "scan" | "reading" | "rejected" | "review" | "flash" | "seal" | "promotion";

type QuestLite = { id: string; title: string; ce: number; location: string; hint: string; method: VerificationMethod };

const NEXT_GRADE: Record<DbGrade, DbGrade> = { g4: "g3", g3: "g2", g2: "semi1", semi1: "g1", g1: "g1" };
const MIN_READ_MS = 1800;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function VerifyFlow({
  quest,
  currentCe,
  currentGrade,
  badgeNames,
  alreadyInReview,
  preview,
}: {
  quest: QuestLite;
  currentCe: number;
  currentGrade: DbGrade;
  badgeNames: Record<string, string>;
  alreadyInReview: boolean;
  preview?: Preview;
}) {
  const [step, setStep] = useState<Step>(preview ? "reading" : alreadyInReview ? "review" : "scan");
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const show = useCallback((o: SubmitOutcome) => {
    setOutcome(o);
    setStep(o.status === "approved" ? (o.blackFlash ? "flash" : "seal") : o.status === "rejected" ? "rejected" : "review");
  }, []);

  const submit = useCallback(
    async (input: SubmitInput, photo: string | null) => {
      setError(null);
      setShot(photo);
      setStep("reading");
      try {
        const [res] = await Promise.all([submitProof(input), wait(MIN_READ_MS)]);
        if (!res.ok) {
          setError(res.error);
          setStep("scan");
          return;
        }
        show(res.data);
      } catch {
        setError("We could not reach the server. Check your connection and try again.");
        setStep("scan");
      }
    },
    [show],
  );

  useEffect(() => {
    if (!preview) return;
    const t = setTimeout(() => {
      const base = { ce: quest.ce, blackFlash: false, promotedTo: null, newBadges: ["first-seal"] };
      if (preview === "rejected") show({ status: "rejected", reason: "The fountain is not in frame. Step back and take it again." });
      else if (preview === "review") show({ status: "in_review" });
      else if (preview === "flash") show({ status: "approved", ...base, blackFlash: true, ce: Math.round(quest.ce * BLACK_FLASH_MULTIPLIER) });
      else if (preview === "promotion") show({ status: "approved", ...base, promotedTo: NEXT_GRADE[currentGrade] });
      else show({ status: "approved", ...base });
    }, MIN_READ_MS);
    return () => clearTimeout(t);
  }, [preview, quest.ce, currentGrade, show]);

  switch (step) {
    case "scan":
      return (
        <Scanner
          quest={quest}
          error={error}
          onPhoto={(d) => submit({ questId: quest.id, method: "photo", photoDataUrl: d }, d)}
          onToken={(t) => submit({ questId: quest.id, method: "qr", token: t }, null)}
        />
      );
    case "reading":
      return <Reading shot={shot} method={quest.method} />;
    case "rejected":
      return (
        <Verdict
          kanji="破"
          tone="blood"
          title="The curse slipped away"
          body={outcome?.status === "rejected" ? outcome.reason : "Not accepted."}
          shot={shot}
          actions={
            <>
              <button type="button" onClick={() => setStep("scan")} className={btnClass("blood", "lg", "w-full")}>
                <RefreshCw className="size-5" aria-hidden /> Try again
              </button>
              <Link href={`/quests/${quest.id}`} className={btnClass("ghost", "md", "w-full")}>
                Back to the mission
              </Link>
            </>
          }
        />
      );
    case "review":
      return (
        <Verdict
          kanji="審"
          tone="gold"
          title="Sent to a senior sorcerer"
          body="The residue was unclear, so a reviewer will check your proof. Your CE lands as soon as it is approved."
          shot={shot}
          actions={
            <Link href="/board?tab=active" className={btnClass("bone", "lg", "w-full")}>
              Back to my vows
            </Link>
          }
        />
      );
    case "flash":
      return (
        <BlackFlash
          total={outcome?.status === "approved" ? outcome.ce : quest.ce}
          base={quest.ce}
          onNext={() => setStep("seal")}
        />
      );
    case "seal":
      return outcome?.status === "approved" ? (
        <Seal quest={quest} outcome={outcome} currentCe={currentCe} badgeNames={badgeNames} onPromotion={() => setStep("promotion")} />
      ) : null;
    case "promotion":
      return outcome?.status === "approved" && outcome.promotedTo ? <Promotion to={outcome.promotedTo} /> : null;
  }
}

/* ── Camera ─────────────────────────────────────────────────── */

type CamState = "starting" | "live" | "denied" | "unavailable";

function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CamState>("starting");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    const video = videoRef.current;
    const req = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      : Promise.reject(new Error("unsupported"));
    req
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video) {
          video.srcObject = s;
          await video.play().catch(() => {});
        }
        setState("live");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
    };
  }, [attempt]);
  const retry = useCallback(() => {
    setState("starting");
    setAttempt((n) => n + 1);
  }, []);
  return { videoRef, state, retry };
}

type Detector = { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o?: { formats: string[] }) => Detector;
const detectorCtor = () =>
  typeof window === "undefined" ? undefined : (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;

function frameToJpeg(source: CanvasImageSource, w: number, h: number): string | null {
  if (!w || !h) return null;
  const scale = Math.min(1, 1280 / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

function Scanner({
  quest,
  error,
  onPhoto,
  onToken,
}: {
  quest: QuestLite;
  error: string | null;
  onPhoto: (d: string) => void;
  onToken: (t: string) => void;
}) {
  const isQr = quest.method === "qr";
  const { videoRef, state, retry } = useCamera();
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canScan = useSyncExternalStore(
    () => () => {},
    () => Boolean(detectorCtor()),
    () => false,
  );
  const tokenRef = useRef(onToken);
  useEffect(() => {
    tokenRef.current = onToken;
  });

  useEffect(() => {
    const Ctor = detectorCtor();
    const video = videoRef.current;
    if (!isQr || state !== "live" || !Ctor || !video) return;
    const det = new Ctor({ formats: ["qr_code"] });
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (stopped) return;
      try {
        const v = (await det.detect(video))[0]?.rawValue?.trim();
        if (v && !stopped) {
          stopped = true;
          tokenRef.current(v);
          return;
        }
      } catch {
        // unreadable frame
      }
      timer = setTimeout(tick, 250);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [isQr, state, videoRef]);

  const capture = () => {
    const v = videoRef.current;
    const d = v ? frameToJpeg(v, v.videoWidth, v.videoHeight) : null;
    if (!d) return setNote("The camera is not ready yet. Try again in a moment.");
    setNote(null);
    onPhoto(d);
  };

  // Fallback when the live camera is blocked: the phone's own camera via a file input.
  const fromFile = async (file?: File) => {
    if (!file) return;
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const d = frameToJpeg(bmp, bmp.width, bmp.height);
      bmp.close();
      if (d) onPhoto(d);
    } catch {
      setNote("That photo could not be read.");
    }
  };

  const blocked = state === "denied" || state === "unavailable";
  const showManual = isQr && (manual || !canScan || blocked);
  const message = error ?? note;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-void">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-label="Live camera"
        className={cn("absolute inset-0 size-full object-cover", state !== "live" && "invisible")}
      />
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_42%,transparent,rgb(6_6_8/0.85))]" />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 p-4 pt-[calc(env(safe-area-inset-top)+16px)]">
        <Link href={`/quests/${quest.id}`} aria-label="Close" className="flex size-11 items-center justify-center border border-ink-500 bg-void/70 backdrop-blur">
          <X className="size-5" />
        </Link>
        <div className="min-w-0 text-center">
          <p className="kicker text-fg-muted">{isQr ? "Scan the seal" : "Capture the residue"}</p>
          <p className="truncate font-display text-[15px]">{quest.location}</p>
        </div>
        <span className="size-11" />
      </div>

      {/* sigil frame */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8">
        {state === "live" ? (
          <div className="relative aspect-square w-full max-w-[300px]">
            <svg viewBox="0 0 100 100" className="absolute inset-[-14%] size-[128%] animate-[spin-slow_18s_linear_infinite] text-cursed/50" aria-hidden>
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 3" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="0.25" />
            </svg>
            {["left-0 top-0 border-l-[3px] border-t-[3px]", "right-0 top-0 border-r-[3px] border-t-[3px]", "bottom-0 left-0 border-b-[3px] border-l-[3px]", "bottom-0 right-0 border-b-[3px] border-r-[3px]"].map((c) => (
              <span key={c} className={cn("absolute size-12 border-blood shadow-[0_0_12px_var(--color-blood)]", c)} />
            ))}
            {isQr && (
              <span className="absolute inset-x-3 top-0 h-full overflow-hidden">
                <span className="block h-0.5 w-full animate-[scan_2.2s_ease-in-out_infinite_alternate] bg-blood shadow-[0_0_14px_var(--color-blood)]" />
              </span>
            )}
          </div>
        ) : (
          <div className="flex max-w-xs flex-col items-center gap-4 text-center">
            {state === "starting" ? (
              <span className="kanji animate-pulse text-[72px] text-cursed/50">眼</span>
            ) : (
              <>
                <CameraOff className="size-10 text-fg-muted" aria-hidden />
                <p className="text-[15px] text-fg-muted">
                  {state === "denied" ? "Camera access is blocked. Allow it in your browser settings, or use your phone's camera." : "No live camera here."}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={retry} className={btnClass("ghost", "sm")}>
                    <RefreshCw className="size-4" aria-hidden /> Retry
                  </button>
                  {!isQr && (
                    <button type="button" onClick={() => fileRef.current?.click()} className={btnClass("blood", "sm")}>
                      <ImagePlus className="size-4" aria-hidden /> Use phone camera
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => fromFile(e.target.files?.[0])} />

      {/* bottom panel */}
      <div className="relative z-10 flex flex-col gap-4 border-t border-ink-600 bg-ink-900/90 p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] backdrop-blur-md">
        <div>
          <p className="font-display text-[17px] leading-tight">{quest.title}</p>
          <p className="mt-1 text-[13px] text-fg-muted">
            <span className="kanji text-blood">縛り</span> {quest.hint || (isQr ? "Scan the printed seal." : "Photograph the location.")}
          </p>
        </div>
        {message && (
          <p role="alert" className="border-l-2 border-blood bg-blood/10 px-3 py-2 text-[14px]">
            {message}
          </p>
        )}

        {isQr ? (
          showManual ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) onToken(code.trim());
              }}
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code printed under the seal"
                autoCapitalize="none"
                spellCheck={false}
                className="h-12 min-w-0 flex-1 border border-ink-500 bg-ink-800 px-3 font-mono text-[15px] focus:border-cursed focus:outline-none"
              />
              <button type="submit" className={btnClass("blood", "md", "h-12")}>
                Break seal
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setManual(true)} className="flex items-center justify-center gap-2 text-[13px] font-bold text-fg-muted hover:text-fg">
              <Keyboard className="size-4" aria-hidden /> Type the code instead
            </button>
          )
        ) : (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={capture}
              disabled={state !== "live"}
              aria-label="Capture"
              className="group relative flex size-[76px] items-center justify-center rounded-full border-2 border-bone disabled:opacity-40"
            >
              <span className="absolute inset-1.5 rounded-full bg-blood transition-transform group-active:scale-90" />
              <span className="kanji relative text-[28px] text-bone">祓</span>
            </button>
          </div>
        )}
        {!isQr && state === "live" && (
          <button type="button" onClick={() => fileRef.current?.click()} className="-mt-1 flex items-center justify-center gap-1.5 text-[12px] text-fg-faint hover:text-fg-muted">
            <Camera className="size-3.5" aria-hidden /> Use the phone camera app instead
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Ceremonies ─────────────────────────────────────────────── */

function Reading({ shot, method }: { shot: string | null; method: VerificationMethod }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-void px-6 text-center">
      {shot && (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL
        <img src={shot} alt="" className="absolute inset-0 size-full object-cover opacity-30 grayscale" />
      )}
      <div className="absolute inset-0 bg-cursed-deep/50 mix-blend-multiply" />
      <div className="absolute inset-x-0 top-0 h-full overflow-hidden" aria-hidden>
        <span className="block h-1 w-full animate-[scan_1.6s_linear_infinite] bg-cursed-soft shadow-[0_0_30px_var(--color-cursed)]" />
      </div>
      <div className="relative flex flex-col items-center gap-4" role="status">
        <span className="kanji animate-flicker text-[96px] text-cursed-soft [text-shadow:0_0_40px_var(--color-cursed)]">
          {method === "qr" ? "封" : "探"}
        </span>
        <p className="font-display text-[22px]">{method === "qr" ? "Breaking the seal…" : "Sensing residue…"}</p>
        <p className="text-[14px] text-fg-muted">{method === "qr" ? "Checking the talisman code" : "Gemini is reading your photo"}</p>
      </div>
    </div>
  );
}

function Verdict({
  kanji,
  tone,
  title,
  body,
  shot,
  actions,
}: {
  kanji: string;
  tone: "blood" | "gold";
  title: string;
  body: string;
  shot: string | null;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="relative">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL
          <img src={shot} alt="Your photo" className="h-52 w-40 border border-ink-500 object-cover opacity-70 grayscale" />
        ) : (
          <div className="hatch h-52 w-40 border border-ink-500" />
        )}
        <span
          className={cn(
            "stamp-in absolute -bottom-5 -right-7 flex size-24 items-center justify-center border-4 bg-void/80",
            tone === "blood" ? "border-blood text-blood" : "border-gold text-gold",
          )}
        >
          <span className="kanji text-[52px]">{kanji}</span>
        </span>
      </div>
      <div className="max-w-sm text-center">
        <h1 className="font-display text-[26px] leading-tight">{title}</h1>
        <p className="mt-2 text-[15px] text-fg-muted">{body}</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2.5">{actions}</div>
    </div>
  );
}

function useCountUp(to: number, ms = 1200, from = 0) {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(from + (to - from) * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, from]);
  return v;
}

function BlackFlash({ total, base, onNext }: { total: number; base: number; onNext: () => void }) {
  return (
    <button
      type="button"
      onClick={onNext}
      className="relative flex min-h-dvh w-full animate-[shake_0.5s_ease-out] flex-col items-center justify-center overflow-hidden bg-black text-center"
    >
      <svg viewBox="0 0 400 800" preserveAspectRatio="none" className="absolute inset-0 size-full animate-[bolt_1.4s_ease-out_both]" aria-hidden>
        {[
          "M210 0 L180 180 L240 220 L150 420 L230 470 L120 800",
          "M0 300 L120 330 L90 390 L260 400 L230 450 L400 470",
          "M400 120 L290 250 L330 290 L200 360",
          "M60 800 L140 600 L100 560 L200 470",
        ].map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#ff2a2a" strokeWidth={i === 0 ? 14 : 8} fill="none" opacity="0.5" filter="url(#rough)" />
            <path d={d} stroke="#ffe8e0" strokeWidth={i === 0 ? 3 : 2} fill="none" />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgb(255_42_42/0.35),transparent_55%)]" />
      <span className="relative animate-[slash_0.5s_var(--ease-cut)_0.3s_both] font-mono text-[12px] tracking-[0.5em] text-blood-bright">
        BLACK FLASH
      </span>
      <span className="kanji relative my-2 text-[128px] leading-none text-white [text-shadow:0_0_24px_#ff2a2a,0_0_60px_#ff2a2a] sm:text-[180px]">
        黒閃
      </span>
      <span className="relative font-display text-[40px] text-blood-bright">×{BLACK_FLASH_MULTIPLIER}</span>
      <span className="relative mt-1 font-mono text-[14px] text-fg-muted">
        {base} → <span className="text-white">{total} CE</span>
      </span>
      <span className="relative mt-10 text-[12px] uppercase tracking-widest text-fg-faint">Tap to continue</span>
    </button>
  );
}

function Seal({
  quest,
  outcome,
  currentCe,
  badgeNames,
  onPromotion,
}: {
  quest: QuestLite;
  outcome: Extract<SubmitOutcome, { status: "approved" }>;
  currentCe: number;
  badgeNames: Record<string, string>;
  onPromotion: () => void;
}) {
  const after = currentCe + outcome.ce;
  const shown = useCountUp(outcome.ce, 1100);
  const p = gradeProgress(after);
  const next = p.next ? GRADES[p.next] : null;
  return (
    <div className="paper flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <span className="seal stamp-in size-32 text-[64px]">祓</span>
      <div>
        <p className="font-mono text-[11px] font-semibold tracking-[0.3em] text-blood">祓除完了 · EXORCISED</p>
        <h1 className="mt-2 font-display text-[28px] leading-tight">{quest.title}</h1>
        <p className="text-[14px] text-paper-muted">{quest.location}</p>
      </div>
      <p className="font-display text-[64px] leading-none text-blood tabular-nums">
        +{shown}
        <span className="ml-1 font-mono text-[18px] tracking-widest">CE</span>
      </p>
      <div className="w-full max-w-xs">
        <div className="mb-1.5 flex justify-between text-[12px] text-paper-muted">
          <span className="font-mono">{after.toLocaleString("en-IN")} CE</span>
          {next && <span>{p.toNext.toLocaleString("en-IN")} to {next.label}</span>}
        </div>
        <CeBar ratio={p.ratio} className="bg-paper-ink/15" />
      </div>
      {outcome.newBadges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {outcome.newBadges.map((b) => (
            <span key={b} className="border border-paper-ink/30 px-2.5 py-1 text-[12px] font-bold">
              New seal · {badgeNames[b] ?? b}
            </span>
          ))}
        </div>
      )}
      <div className="flex w-full max-w-xs flex-col gap-2.5">
        {outcome.promotedTo ? (
          <button type="button" onClick={onPromotion} className={btnClass("blood", "lg", "w-full")}>
            Something is changing…
          </button>
        ) : (
          <Link href="/board" className={btnClass("blood", "lg", "w-full")}>
            Next mission
          </Link>
        )}
        <Link href="/board?tab=done" className="text-[13px] font-bold text-paper-muted underline underline-offset-4">
          My exorcisms
        </Link>
      </div>
    </div>
  );
}

function Promotion({ to }: { to: DbGrade }) {
  const g = GRADES[to];
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center">
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 42%, rgb(${g.glow} / 0.35), transparent 60%)` }}
      />
      <p className="relative font-mono text-[12px] tracking-[0.5em] text-fg-muted">昇級 · PROMOTION</p>
      <GradeSeal grade={to} size={150} className="relative stamp-in" />
      <div className="relative">
        <h1 className="font-display text-[40px] leading-none" style={{ color: g.color }}>
          {g.label}
        </h1>
        <p className="mt-3 text-[15px] text-fg-muted">{g.feel}. Jujutsu High has raised your grade.</p>
      </div>
      <Link href="/me" className={btnClass("bone", "lg", "relative")}>
        See my record
      </Link>
    </div>
  );
}
