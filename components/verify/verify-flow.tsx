"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Camera, CameraOff, CircleCheck, Hourglass, Info, QrCode, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES, gradeProgress, type GradeKey } from "@/lib/grades";
import type { DbGrade, QuestCategory, VerificationMethod } from "@/lib/db/schema";
import { submitProof } from "@/lib/actions/submit";
import { BLACK_FLASH_MULTIPLIER, type SubmitInput, type SubmitOutcome } from "@/lib/actions/types";
import { Action, CeGauge, Kanji } from "@/components/app/primitives";
import { CountUp } from "@/components/app/count-up";
import { BACK } from "@/components/app/transitions";

/** Dev-only ceremony previews (?outcome=...); the page never passes one in production. */
export type Preview = "success" | "rejected" | "flash" | "promotion" | "review";
type Step = "scan" | "reading" | "rejected" | "review" | "flash" | "seal" | "promotion";

type QuestLite = {
  id: string;
  title: string;
  ce: number;
  location: string;
  category: QuestCategory;
  method: VerificationMethod;
};

const CATEGORY: Record<QuestCategory, { k: string; label: string }> = {
  explore: { k: "探", label: "Explore" },
  wellness: { k: "癒", label: "Wellness" },
  social: { k: "縁", label: "Social" },
  skill: { k: "技", label: "Skill" },
  event: { k: "祭", label: "Event" },
};

const GRADE_KANJI: Record<DbGrade, string> = { g4: "四級", g3: "三級", g2: "二級", semi1: "準一級", g1: "一級" };
const NEXT_GRADE: Record<DbGrade, DbGrade> = { g4: "g3", g3: "g2", g2: "semi1", semi1: "g1", g1: "g1" };

/** The reading state stays up at least this long so the ceremony never flashes past. */
const MIN_READ_MS = 1600;
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

  // Dev-only: play a ceremony without a camera or a submission.
  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(() => {
      const base = { ce: quest.ce, blackFlash: false, promotedTo: null, newBadges: [] };
      if (preview === "rejected") show({ status: "rejected", reason: "The subject is not in frame. Step closer and try again." });
      else if (preview === "review") show({ status: "in_review" });
      else if (preview === "flash") show({ status: "approved", ...base, blackFlash: true, ce: Math.round(quest.ce * BLACK_FLASH_MULTIPLIER) });
      else if (preview === "promotion") show({ status: "approved", ...base, promotedTo: NEXT_GRADE[currentGrade] });
      else show({ status: "approved", ...base });
    }, MIN_READ_MS);
    return () => clearTimeout(timer);
  }, [preview, quest.ce, currentGrade, show]);

  switch (step) {
    case "scan":
      return (
        <Scanner
          quest={quest}
          error={error}
          onPhoto={(dataUrl) => submit({ questId: quest.id, method: "photo", photoDataUrl: dataUrl }, dataUrl)}
          onToken={(token) => submit({ questId: quest.id, method: "qr", token }, null)}
        />
      );
    case "reading":
      return <Reading method={quest.method} shot={shot} />;
    case "rejected":
      return (
        <Rejected
          quest={quest}
          shot={shot}
          reason={outcome?.status === "rejected" ? outcome.reason : "Not accepted."}
          onRetry={() => {
            setOutcome(null);
            setStep("scan");
          }}
        />
      );
    case "review":
      return <InReview title={quest.title} shot={shot} />;
    case "flash":
      return (
        <BlackFlash
          base={quest.ce}
          total={outcome?.status === "approved" ? outcome.ce : quest.ce}
          onNext={() => setStep("seal")}
        />
      );
    case "promotion":
      return outcome?.status === "approved" && outcome.promotedTo ? (
        <Promotion from={currentGrade} to={outcome.promotedTo} />
      ) : null;
    case "seal":
      return outcome?.status === "approved" ? (
        <Seal
          quest={quest}
          outcome={outcome}
          currentCe={currentCe}
          badgeNames={badgeNames}
          onPromotion={() => setStep("promotion")}
        />
      ) : null;
  }
}

/* ---------- camera ---------- */

type CameraState = "starting" | "live" | "denied" | "unavailable";

/** Opens the rear camera into a <video> and always stops its tracks on unmount. */
function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    const video = videoRef.current;
    const request = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      : Promise.reject(new Error("unsupported"));
    request
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
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

// BarcodeDetector is not in the TypeScript DOM lib yet.
type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts?: { formats: string[] }) => Detector;
const detectorCtor = () =>
  typeof window === "undefined" ? undefined : (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;

/** Downscales the current video frame to at most 1280 px on the long edge as a JPEG data URL. */
function grabFrame(video: HTMLVideoElement): string | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, 1280 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

/* ---------- 07 scan ---------- */

function Scanner({
  quest,
  error,
  onPhoto,
  onToken,
}: {
  quest: QuestLite;
  error: string | null;
  onPhoto: (dataUrl: string) => void;
  onToken: (token: string) => void;
}) {
  const isQr = quest.method === "qr";
  const { videoRef, state, retry } = useCamera();
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  // false on the server and first client render, so hydration matches
  const canScan = useSyncExternalStore(
    () => () => {},
    () => Boolean(detectorCtor()),
    () => false,
  );

  const tokenRef = useRef(onToken);
  useEffect(() => {
    tokenRef.current = onToken;
  });

  // Scan QR codes from the same stream when the browser can.
  useEffect(() => {
    const Ctor = detectorCtor();
    const video = videoRef.current;
    if (!isQr || state !== "live" || !Ctor || !video) return;
    const detector = new Ctor({ formats: ["qr_code"] });
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (stopped) return;
      try {
        const found = await detector.detect(video);
        const value = found[0]?.rawValue?.trim();
        if (value && !stopped) {
          stopped = true;
          tokenRef.current(value);
          return;
        }
      } catch {
        // a frame that cannot be read is skipped
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
    const video = videoRef.current;
    const dataUrl = video ? grabFrame(video) : null;
    if (!dataUrl) {
      setNote("The camera is not ready yet. Try again in a moment.");
      return;
    }
    setNote(null);
    onPhoto(dataUrl);
  };

  const showManual = isQr && (manual || !canScan || state === "denied" || state === "unavailable");
  const blocked = state === "denied" || state === "unavailable";
  const message = error ?? note;

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-night-950 lg:min-h-[720px]">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-label="Live camera"
        className={cn("absolute inset-0 size-full object-cover", state !== "live" && "invisible")}
      />

      <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+16px)] z-10 flex items-center justify-between">
        <Link href="/missions" transitionTypes={BACK} aria-label="Close scanner" className="flex size-12 items-center justify-center rounded-full bg-night-800/90">
          <X className="size-[22px]" />
        </Link>
        <div className="flex h-10 items-center rounded-full bg-night-800/90 px-4 text-[15px] font-bold">
          {quest.title.length > 28 ? "Verify mission" : quest.title}
        </div>
        <span className="size-12" aria-hidden />
      </div>

      {state === "live" && (
        <div className="pointer-events-none absolute left-1/2 top-[250px] size-[260px] -translate-x-1/2 lg:top-[120px] lg:size-[230px]" aria-hidden>
          {[
            "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
            "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
            "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-lg",
            "right-0 bottom-0 border-r-4 border-b-4 rounded-br-lg",
          ].map((c) => (
            <span key={c} className={cn("absolute size-11 border-cursed-300", c)} />
          ))}
          {isQr && <span className="scan-sweep absolute inset-x-3.5 top-28 h-0.5 bg-cursed-300 shadow-[0_0_16px_4px_rgba(61,139,255,0.7)]" />}
        </div>
      )}

      {state === "starting" && (
        <p className="absolute inset-x-8 top-[240px] text-center text-[15px] text-mist-300" role="status">
          Opening the camera…
        </p>
      )}
      {blocked && (
        <div className="absolute inset-x-6 top-[190px] flex flex-col items-center gap-3 text-center" role="alert">
          <CameraOff className="size-9 text-mist-300" aria-hidden />
          <p className="max-w-[300px] text-[15px] leading-[1.6] text-mist-100">
            {state === "denied"
              ? "Camera access is blocked. Allow the camera for this site in your browser settings, then try again."
              : "No camera could be opened on this device."}
          </p>
          <button type="button" onClick={retry} className="rounded-full border border-night-700 px-4 py-2 text-[15px] font-bold hover:bg-night-800">
            Try again
          </button>
        </div>
      )}

      <div className="relative z-10 mt-auto flex flex-col items-center gap-2 bg-gradient-to-b from-transparent via-night-950/90 to-night-950 px-6 pb-10 pt-24 text-center">
        <span className="flex items-center gap-2 text-[17px] font-bold">
          {isQr ? <QrCode className="size-5" aria-hidden /> : <Camera className="size-5" aria-hidden />}
          {isQr ? "Point at the QR on the notice board" : "Frame the subject"}
        </span>
        <span className="text-[15px] text-mist-300">
          {quest.title} · {quest.location}
        </span>

        {message && (
          <p role="alert" className="mt-1 max-w-[320px] text-[14px] leading-[1.5] text-flash-500">
            {message}
          </p>
        )}

        {!isQr && (
          <Action onClick={capture} size="md" disabled={state !== "live"} className="mt-3 w-full max-w-[300px]">
            <Camera className="size-5" aria-hidden />
            Capture
          </Action>
        )}

        {isQr && !showManual && (
          <button type="button" onClick={() => setManual(true)} className="mt-2 text-[14px] text-cursed-300">
            Code won&apos;t scan? Enter it by hand
          </button>
        )}
        {showManual && (
          <form
            className="mt-3 flex w-full max-w-[320px] flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) onToken(code.trim());
            }}
          >
            <label className="text-left text-[13px] text-mist-300" htmlFor="qr-code">
              Code printed under the QR
            </label>
            <input
              id="qr-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={200}
              className="h-12 rounded-lg border border-night-700 bg-night-900 px-3.5 font-mono text-[15px] text-mist-100 outline-none focus:border-cursed-300"
            />
            <Action type="submit" size="md" disabled={!code.trim()}>
              Submit code
            </Action>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------- 08 reading ---------- */

function Reading({ method, shot }: { method: VerificationMethod; shot: string | null }) {
  const [pct, setPct] = useState(0);

  // The server decides how long this takes, so the ring eases toward full and waits.
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setPct(0.96 * (1 - Math.exp(-(now - start) / 1400)));
      raf = requestAnimationFrame(tick);
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
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="Your captured photo" className="h-80 w-[252px] rounded-md object-cover" />
          ) : (
            <div className="placeholder-photo-dark flex h-80 w-[252px] items-center justify-center rounded-md">
              <QrCode className="size-16 text-mist-500" aria-hidden />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-center">
        <span className="font-display text-2xl font-extrabold">Reading cursed residue…</span>
        <span className="text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          {method === "photo" ? "Checking your capture against the scouting shot." : "Checking the seal on this code."}
        </span>
      </div>
    </div>
  );
}

/* ---------- 09 rejected ---------- */

function Rejected({
  quest,
  shot,
  reason,
  onRetry,
}: {
  quest: QuestLite;
  shot: string | null;
  reason: string;
  onRetry: () => void;
}) {
  const isQr = quest.method === "qr";
  return (
    <div className="flex flex-1 flex-col gap-[22px] bg-night-900 px-6 pb-9 pt-[calc(env(safe-area-inset-top)+24px)]">
      <div className="flex items-center gap-3.5">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Your submitted photo" className="h-[92px] w-[72px] flex-none rounded object-cover opacity-70" />
        ) : (
          <div className="placeholder-photo-dark h-[92px] w-[72px] flex-none rounded opacity-70" />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-mist-300">{quest.title}</span>
          <h1 className="font-display text-[28px] font-extrabold leading-[1.2]">Not accepted yet</h1>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded bg-washi-100 p-[18px] text-sumi-900 shadow-[inset_0_0_0_1px_#DDD5C3]">
        <span className="flex items-center gap-1.5 text-[13px] text-sumi-600">
          <Info className="size-3.5" aria-hidden />
          What we found
        </span>
        <p className="text-[15px] leading-[1.6]">{reason}</p>
      </div>
      <div className="flex items-center gap-2.5 text-[13px] text-mist-300">
        <RefreshCw className="size-[17px]" aria-hidden />
        No CE is lost. You can try again.
      </div>
      <div className="mt-auto flex flex-col gap-2.5">
        <Action onClick={onRetry}>
          {isQr ? <QrCode className="size-5" aria-hidden /> : <Camera className="size-5" aria-hidden />}
          {isQr ? "Scan again" : "Retake photo"}
        </Action>
        <Action href="/missions" back variant="secondary" size="md">
          Back to missions
        </Action>
      </div>
    </div>
  );
}

/* ---------- in review ---------- */

function InReview({ title, shot }: { title: string; shot: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-night-900 px-6 pb-9 pt-[calc(env(safe-area-inset-top)+56px)] text-center">
      {shot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shot} alt="Your submitted photo" className="h-[132px] w-[104px] rounded object-cover opacity-80" />
      )}
      <div className="flex size-14 items-center justify-center rounded-full bg-night-800">
        <Hourglass className="size-6 text-cursed-300" aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] font-extrabold leading-[1.2]">Sent for review</h1>
        <p className="mx-auto max-w-[300px] text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          A senior sorcerer will look at your proof for {title}. Your CE arrives as soon as it is approved.
        </p>
      </div>
      <div className="mt-auto flex w-full flex-col gap-2.5">
        <Action href="/missions" back>
          Back to missions
        </Action>
        <Action href="/board" back variant="secondary" size="md">
          Back to board
        </Action>
      </div>
    </div>
  );
}

/* ---------- 10 seal ---------- */

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
  const cat = CATEGORY[quest.category];
  const total = currentCe + outcome.ce;
  const progress = gradeProgress(total);
  const nextLabel = progress.next ? GRADES[progress.next as GradeKey].label : null;
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
            {quest.method === "photo" ? "Photo verified" : "Seal code verified"}
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
          <CountUp value={outcome.ce} prefix="+" duration={1100} /> <span className="text-[22px]">CE</span>
        </span>
        <span className="text-[13px] text-mist-300">Cursed Energy added</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="font-display text-[17px] font-extrabold">{total.toLocaleString("en-US")} CE</span>
          <span className="text-mist-300">
            {progress.ceiling !== null && nextLabel ? `${nextLabel} at ${progress.ceiling.toLocaleString("en-US")}` : "Top grade"}
          </span>
        </div>
        <CeGauge value={progress.ceiling !== null ? total : 1} max={progress.ceiling ?? 1} />
        <span className="text-[13px] text-mist-300">
          {progress.ceiling !== null ? `${progress.toNext.toLocaleString("en-US")} CE to the next grade` : "Highest grade reached"}
        </span>
      </div>
      {outcome.newBadges.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-[13px]">
          <span className="text-mist-300">Badge earned</span>
          {outcome.newBadges.map((id) => (
            <span key={id} className="rounded-full border border-night-700 px-3 py-1 font-bold">
              {badgeNames[id] ?? id}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex flex-col gap-2.5">
        {outcome.promotedTo ? (
          <Action onClick={onPromotion}>Continue</Action>
        ) : (
          <Action href="/board" back>
            Next nearby mission
          </Action>
        )}
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
        <span className="font-display text-[40px] font-extrabold leading-none">
          +{base} × {BLACK_FLASH_MULTIPLIER}
        </span>
        <span className="text-[17px] text-mist-300">{total} CE this mission</span>
      </div>
      <span className="absolute inset-x-0 bottom-10 text-[13px] text-mist-500">Tap to continue</span>
    </button>
  );
}

/* ---------- 12 promotion ---------- */

function Promotion({ from, to }: { from: DbGrade; to: DbGrade }) {
  const label = GRADES[to].label;
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-[#060709] lg:min-h-[720px]">
      <div className="absolute left-1/2 top-[360px] size-[420px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(61,139,255,0.32),transparent_62%)]" />
      <div className="relative flex flex-1 flex-col items-center gap-3.5 px-8 pb-9 pt-10 text-center">
        <span className="text-[15px] text-mist-300">Promotion</span>
        <span className="rise-in relative font-display text-[26px] font-extrabold text-transparent line-through decoration-ember-500/60 [background:linear-gradient(90deg,rgba(240,129,58,0.2),#FF7A2F_45%,rgba(163,166,174,0.15))] [background-clip:text]">
          {GRADES[from].label}
        </span>
        <span className={cn("brush stamp-in font-display font-extrabold leading-none", label.length > 8 ? "text-[44px]" : "text-[64px]")}>
          {label}
        </span>
        <div className="paper float relative mt-5 flex h-[236px] w-32 flex-col items-center gap-2.5 rounded-[3px] px-0 py-[22px] shadow-[inset_0_0_0_5px_#EFE9DC,inset_0_0_0_7px_#4A3426,0_0_40px_rgba(61,139,255,0.5)]">
          <span className="flex size-10 items-center justify-center rounded-full bg-seal-600 font-display text-xl font-extrabold text-washi-100">
            昇
          </span>
          <span className="font-display text-[42px] font-extrabold leading-[1.05] [writing-mode:vertical-rl]">{GRADE_KANJI[to]}</span>
          <span className="mt-auto text-[13px] font-bold text-sumi-600">{label}</span>
        </div>
        <p className="mt-3.5 text-[15px] leading-[1.6] text-mist-300 [text-wrap:pretty]">
          Your new grade is on the leaderboard.
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
