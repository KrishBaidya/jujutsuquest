"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Camera, Eye, ImagePlus, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { conjureResidue, leaveResidue } from "@/lib/actions/residue";
import { renderStyle } from "@/lib/residue-styles";
import { btnClass } from "@/components/ui";

const SEND_EDGE = 1280; // long edge of the photo sent to Gemini
const POST_EDGE = 1440; // long edge of the posted image
const MAX_CAPTION = 140;

type Original = { url: string; width: number; height: number; full: ImageData };
type Result = { url: string; source: "gemini" | "offline" };

const CHANTS = [
  ["探", "Sensing the residue…"],
  ["域", "Expanding the domain…"],
  ["墨", "Inking it in cursed energy…"],
  ["呪", "Binding the curse to the frame…"],
] as const;

function canvasFrom(source: CanvasImageSource, w: number, h: number, edge: number) {
  const scale = Math.min(1, edge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function loadFile(file: File): Promise<Original> {
  // createImageBitmap honours EXIF rotation, so phone photos come in upright.
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const send = canvasFrom(bmp, bmp.width, bmp.height, SEND_EDGE);
    const post = canvasFrom(bmp, bmp.width, bmp.height, POST_EDGE);
    return {
      url: send.toDataURL("image/jpeg", 0.85),
      width: send.width,
      height: send.height,
      full: post.getContext("2d")!.getImageData(0, 0, post.width, post.height),
    };
  } finally {
    bmp.close();
  }
}

/** The offline stand-in when Gemini is unavailable: the local "Cursed" grade. */
function offlineStyle(full: ImageData): string {
  const dst = new ImageData(full.width, full.height);
  renderStyle(full, dst, "cursed", 1);
  const c = document.createElement("canvas");
  c.width = full.width;
  c.height = full.height;
  c.getContext("2d")!.putImageData(dst, 0, 0);
  return c.toDataURL("image/jpeg", 0.86);
}

/** Gemini returns a large PNG; post a JPEG at most POST_EDGE long. */
async function toPostJpeg(url: string): Promise<string> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return canvasFrom(img, img.naturalWidth, img.naturalHeight, POST_EDGE).toDataURL("image/jpeg", 0.88);
}

export function ResidueComposer({ place }: { place: { id: string; name: string; kanji: string } }) {
  const router = useRouter();
  const [original, setOriginal] = useState<Original | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [conjuring, setConjuring] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const run = useRef(0);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const conjure = useCallback(
    async (photo: Original) => {
      const id = ++run.current;
      setConjuring(true);
      setNotice(null);
      setError(null);
      let next: Result;
      try {
        const res = await conjureResidue({
          photoDataUrl: photo.url,
          width: photo.width,
          height: photo.height,
          locationId: place.id,
        });
        if (res.ok) next = { url: res.data.imageDataUrl, source: "gemini" };
        else {
          next = { url: offlineStyle(photo.full), source: "offline" };
          setNotice(`${res.error} Used the offline cursed filter instead.`);
        }
      } catch {
        next = { url: offlineStyle(photo.full), source: "offline" };
        setNotice("Could not reach Gemini. Used the offline cursed filter instead.");
      }
      // A newer photo or redraw may have started meanwhile.
      if (id !== run.current) return;
      setResult(next);
      setConjuring(false);
    },
    [place.id],
  );

  const pick = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("That file is not an image.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const loaded = await loadFile(file);
        setOriginal(loaded);
        setResult(null);
        void conjure(loaded);
      } catch {
        setError("That photo could not be opened. Try a JPEG or PNG.");
      } finally {
        setLoading(false);
      }
    },
    [conjure],
  );

  const post = () => {
    if (!result) return;
    setError(null);
    start(async () => {
      try {
        const photoDataUrl = await toPostJpeg(result.url);
        const res = await leaveResidue({ photoDataUrl, caption, locationId: place.id });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setDone(true);
        setTimeout(() => router.push(`/places/${place.id}#residue`), 1400);
      } catch {
        setError("Could not reach the server. Check your connection and try again.");
      }
    });
  };

  if (done) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 text-center">
        <span className="seal stamp-in size-28 text-[46px]">残穢</span>
        <p className="font-display text-[26px]">Residue left</p>
        <p className="text-fg-muted">Your photo is now on {place.name}.</p>
      </div>
    );
  }

  const shown = comparing || !result ? original?.url : result.url;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href={`/places/${place.id}`} className="flex items-center gap-1.5 text-[13px] font-bold text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden />
          {place.name}
        </Link>
        <Steps step={!original ? 1 : result ? 3 : 2} />
      </div>

      <h1 className="font-display text-[30px] leading-none lg:text-[40px]">
        Leave residue <span className="kanji text-blood">残穢</span>
      </h1>
      <p className="mt-2 max-w-xl text-[14px] text-fg-muted">
        Post any photo of <span className="text-fg">{place.name}</span>. Gemini redraws it as a scene from the Jujutsu world.
        Add a line and post. It appears straight away.
      </p>

      {/* Hidden pickers: one opens the camera on phones, one opens the library. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />

      {!original ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "mt-7 flex flex-col items-center gap-6 border-2 border-dashed px-6 py-14 text-center transition-colors lg:py-20",
            dragging ? "border-blood bg-blood/10" : "border-ink-500 bg-ink-900/60",
          )}
        >
          <span className="kanji text-[80px] leading-none text-ink-400">{place.kanji}</span>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => cameraRef.current?.click()} className={btnClass("blood", "lg", "flex-1")}>
              <Camera className="size-5" aria-hidden />
              Take a photo
            </button>
            <button type="button" onClick={() => libraryRef.current?.click()} className={btnClass("ghost", "lg", "flex-1")}>
              <ImagePlus className="size-5" aria-hidden />
              Choose photo
            </button>
          </div>
          <p className="text-[13px] text-fg-faint">{loading ? "Opening…" : "Or drop an image here."}</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
          {/* Preview */}
          <div>
            <div className="relative flex justify-center overflow-hidden border border-ink-500 bg-ink-900">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URLs */}
              <img
                src={shown}
                alt={comparing || !result ? "Your original photo" : "Your photo redrawn in the Jujutsu style"}
                className={cn("block max-h-[62dvh] w-auto max-w-full object-contain transition-[filter] duration-700", conjuring && "brightness-50 saturate-50")}
              />
              {!conjuring && result && (
                <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 bg-void/70 px-2 py-1 font-mono text-[11px] tracking-widest backdrop-blur">
                  {comparing ? "ORIGINAL" : result.source === "gemini" ? <><Sparkles className="size-3" aria-hidden /> CURSED BY GEMINI</> : "OFFLINE FILTER"}
                </span>
              )}
              {conjuring && <Conjuring />}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={!result || conjuring}
                onPointerDown={() => setComparing(true)}
                onPointerUp={() => setComparing(false)}
                onPointerLeave={() => setComparing(false)}
                onKeyDown={(e) => e.key === " " && setComparing(true)}
                onKeyUp={() => setComparing(false)}
                className="flex h-9 select-none items-center gap-1.5 border border-ink-500 px-3 text-[12px] font-bold text-fg-muted hover:text-fg disabled:opacity-40"
              >
                <Eye className="size-4" aria-hidden />
                Hold to compare
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={conjuring}
                  onClick={() => original && conjure(original)}
                  className="flex h-9 items-center gap-1.5 px-2 text-[12px] font-bold text-fg-muted hover:text-fg disabled:opacity-40"
                >
                  <RefreshCw className="size-4" aria-hidden />
                  Redraw
                </button>
                <button
                  type="button"
                  onClick={() => libraryRef.current?.click()}
                  className="flex h-9 items-center gap-1.5 px-2 text-[12px] font-bold text-fg-muted hover:text-fg"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Change photo
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            <div className="panel p-4">
              <p className="flex items-center gap-2 text-[13px] font-bold">
                <span className="kanji text-[16px] text-blood">壱</span> Cursed redraw
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted" aria-live="polite">
                {conjuring
                  ? "Gemini is redrawing your photo as a Jujutsu Kaisen style frame. This takes around 10 to 20 seconds."
                  : result?.source === "gemini"
                    ? "Done. Hold to compare with your photo, or redraw for a different take."
                    : "Your photo has the offline cursed filter."}
              </p>
              {notice && <p className="mt-2 border-l-2 border-gold pl-2 text-[12px] text-fg-muted">{notice}</p>}
            </div>

            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between text-[13px] font-bold">
                <span className="flex items-center gap-2">
                  <span className="kanji text-[16px] text-blood">弐</span> Caption <span className="font-normal text-fg-faint">(optional)</span>
                </span>
                <span className={cn("font-mono text-[12px]", caption.length > MAX_CAPTION - 15 ? "text-blood-bright" : "text-fg-faint")}>
                  {caption.length}/{MAX_CAPTION}
                </span>
              </span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
                rows={2}
                placeholder={`What did you sense at ${place.name}?`}
                className="resize-none border border-ink-500 bg-ink-800 px-3.5 py-2.5 text-[15px] placeholder:text-fg-faint focus:border-cursed focus:outline-none focus:ring-2 focus:ring-cursed/30"
              />
            </label>

            {error && (
              <p role="alert" className="border-l-2 border-blood bg-blood/10 px-3 py-2 text-[14px]">
                {error}
              </p>
            )}

            <button type="button" onClick={post} disabled={pending || conjuring || !result} className={btnClass("blood", "lg", "w-full")}>
              {conjuring ? "Redrawing…" : pending ? "Leaving residue…" : "Post to " + place.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Overlay while Gemini works: a spinning domain seal and a rotating chant. */
function Conjuring() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % CHANTS.length), 2600);
    return () => clearInterval(t);
  }, []);
  const [kanji, line] = CHANTS[i];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle,rgb(42_19_86/0.55),rgb(6_6_8/0.7)_70%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-[sweep_2.4s_linear_infinite] bg-gradient-to-b from-transparent via-cursed/25 to-transparent" />
      <div className="relative flex size-36 items-center justify-center">
        <svg viewBox="-50 -50 100 100" className="absolute inset-0 size-full animate-[spin-slow_9s_linear_infinite]" aria-hidden>
          <circle r="46" fill="none" stroke="var(--color-cursed)" strokeWidth="1.2" />
          <circle r="40" fill="none" stroke="var(--color-cursed-soft)" strokeWidth="0.6" strokeDasharray="2 4" />
          <polygon points="0,-40 34.6,20 -34.6,20" fill="none" stroke="var(--color-blood)" strokeWidth="0.8" opacity="0.8" />
          <polygon points="0,40 34.6,-20 -34.6,-20" fill="none" stroke="var(--color-blood)" strokeWidth="0.8" opacity="0.8" />
        </svg>
        <span key={kanji} className="kanji stamp-in text-[54px] text-bone [text-shadow:0_0_18px_var(--color-cursed)]">
          {kanji}
        </span>
      </div>
      <p key={line} className="rise font-display text-[15px] tracking-wide text-bone" role="status">
        {line}
      </p>
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider" aria-label={`Step ${step} of 3`}>
      {["PHOTO", "CURSE", "POST"].map((label, i) => (
        <li key={label} className={cn("flex items-center gap-1.5", i + 1 <= step ? "text-fg" : "text-fg-faint")}>
          <span className={cn("h-px w-4", i + 1 <= step ? "bg-blood" : "bg-ink-500")} />
          {label}
        </li>
      ))}
    </ol>
  );
}
