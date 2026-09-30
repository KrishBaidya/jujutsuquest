"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Camera, Eye, ImagePlus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { leaveResidue } from "@/lib/actions/residue";
import { STYLES, renderStyle, type Pixels, type StyleKey } from "@/lib/residue-styles";
import { btnClass } from "@/components/ui";

const WORK_EDGE = 1440; // long edge of the posted image
const THUMB_EDGE = 128;
const MAX_CAPTION = 140;

type Loaded = { full: ImageData; thumb: ImageData };

function toImageData(source: CanvasImageSource, w: number, h: number, edge: number): ImageData {
  const scale = Math.min(1, edge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

async function loadFile(file: File): Promise<Loaded> {
  // createImageBitmap honours EXIF rotation, so phone photos come in upright.
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return {
      full: toImageData(bmp, bmp.width, bmp.height, WORK_EDGE),
      thumb: toImageData(bmp, bmp.width, bmp.height, THUMB_EDGE),
    };
  } finally {
    bmp.close();
  }
}

const blank = (src: Pixels) => new ImageData(src.width, src.height);

/** A small preview of every style, so the choice is visual. */
function makeThumbs(thumb: ImageData): Record<string, string> {
  const c = document.createElement("canvas");
  c.width = thumb.width;
  c.height = thumb.height;
  const ctx = c.getContext("2d")!;
  const out: Record<string, string> = {};
  for (const s of STYLES) {
    const dst = blank(thumb);
    renderStyle(thumb, dst, s.key, 1);
    ctx.putImageData(dst, 0, 0);
    out[s.key] = c.toDataURL("image/jpeg", 0.7);
  }
  return out;
}

export function ResidueComposer({ place }: { place: { id: string; name: string; kanji: string } }) {
  const router = useRouter();
  const [img, setImg] = useState<Loaded | null>(null);
  const [style, setStyle] = useState<StyleKey>("sumi");
  const [amount, setAmount] = useState(100);
  const [comparing, setComparing] = useState(false);
  const [caption, setCaption] = useState("");
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const pick = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const loaded = await loadFile(file);
      setImg(loaded);
      setThumbs(makeThumbs(loaded.thumb));
    } catch {
      setError("That photo could not be opened. Try a JPEG or PNG.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Main preview. Deferred a frame so dragging the slider stays smooth.
  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const raf = requestAnimationFrame(() => {
      canvas.width = img.full.width;
      canvas.height = img.full.height;
      const ctx = canvas.getContext("2d")!;
      if (comparing) {
        ctx.putImageData(img.full, 0, 0);
        return;
      }
      const dst = blank(img.full);
      renderStyle(img.full, dst, style, amount / 100);
      ctx.putImageData(dst, 0, 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [img, style, amount, comparing]);

  const post = () => {
    if (!img) return;
    setError(null);
    // Always export the styled image, even if "compare" is held.
    const c = document.createElement("canvas");
    c.width = img.full.width;
    c.height = img.full.height;
    const dst = blank(img.full);
    renderStyle(img.full, dst, style, amount / 100);
    c.getContext("2d")!.putImageData(dst, 0, 0);
    const photoDataUrl = c.toDataURL("image/jpeg", 0.86);
    start(async () => {
      try {
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href={`/places/${place.id}`} className="flex items-center gap-1.5 text-[13px] font-bold text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden />
          {place.name}
        </Link>
        <Steps step={img ? (caption ? 3 : 2) : 1} />
      </div>

      <h1 className="font-display text-[30px] leading-none lg:text-[40px]">
        Leave residue <span className="kanji text-blood">残穢</span>
      </h1>
      <p className="mt-2 max-w-xl text-[14px] text-fg-muted">
        Post any photo of <span className="text-fg">{place.name}</span> to its gallery. Pick a style, add a line, done — it
        appears straight away.
      </p>

      {/* Hidden pickers: one opens the camera on phones, one opens the library. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />

      {!img ? (
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
            <div className="relative overflow-hidden border border-ink-500 bg-ink-900">
              <canvas ref={canvasRef} className="block max-h-[62dvh] w-full object-contain" aria-label="Styled photo preview" />
              <span className="pointer-events-none absolute left-3 top-3 bg-void/70 px-2 py-1 font-mono text-[11px] tracking-widest backdrop-blur">
                {comparing ? "ORIGINAL" : STYLES.find((s) => s.key === style)!.name.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onPointerDown={() => setComparing(true)}
                onPointerUp={() => setComparing(false)}
                onPointerLeave={() => setComparing(false)}
                onKeyDown={(e) => e.key === " " && setComparing(true)}
                onKeyUp={() => setComparing(false)}
                className="flex h-9 select-none items-center gap-1.5 border border-ink-500 px-3 text-[12px] font-bold text-fg-muted hover:text-fg"
              >
                <Eye className="size-4" aria-hidden />
                Hold to compare
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

          {/* Controls */}
          <div className="flex flex-col gap-6">
            <fieldset>
              <legend className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">
                <span className="kanji text-[16px] text-blood">壱</span> Style
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {STYLES.map((s) => {
                  const on = s.key === style;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setStyle(s.key)}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          "relative block aspect-square w-full overflow-hidden bg-ink-700 bg-cover bg-center transition-all",
                          on ? "ring-2 ring-blood ring-offset-2 ring-offset-void" : "opacity-70 group-hover:opacity-100",
                        )}
                        style={{ backgroundImage: thumbs[s.key] ? `url(${thumbs[s.key]})` : undefined }}
                      >
                        <span className="kanji absolute bottom-0.5 right-1 text-[15px] text-bone [text-shadow:0_0_6px_#000]">
                          {s.kanji}
                        </span>
                      </span>
                      <span className={cn("text-[11px] font-bold", on ? "text-fg" : "text-fg-muted")}>{s.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[12px] text-fg-faint">{STYLES.find((s) => s.key === style)!.blurb}</p>
            </fieldset>

            {style !== "original" && (
              <label className="flex flex-col gap-2">
                <span className="flex items-center justify-between text-[13px] font-bold">
                  <span className="flex items-center gap-2">
                    <span className="kanji text-[16px] text-blood">弐</span> Intensity
                  </span>
                  <span className="font-mono text-[12px] text-fg-muted">{amount}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-[var(--color-blood)]"
                />
              </label>
            )}

            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between text-[13px] font-bold">
                <span className="flex items-center gap-2">
                  <span className="kanji text-[16px] text-blood">参</span> Caption <span className="font-normal text-fg-faint">(optional)</span>
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

            <button type="button" onClick={post} disabled={pending} className={btnClass("blood", "lg", "w-full")}>
              {pending ? "Leaving residue…" : "Post to " + place.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider" aria-label={`Step ${step} of 3`}>
      {["PHOTO", "STYLE", "POST"].map((label, i) => (
        <li key={label} className={cn("flex items-center gap-1.5", i + 1 <= step ? "text-fg" : "text-fg-faint")}>
          <span className={cn("h-px w-4", i + 1 <= step ? "bg-blood" : "bg-ink-500")} />
          {label}
        </li>
      ))}
    </ol>
  );
}
