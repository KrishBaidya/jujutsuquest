"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Camera, CameraOff, Check, RotateCcw, X } from "lucide-react";
import { shareToArchive } from "@/lib/actions/archive";
import { applyInkFilter } from "@/lib/archive-filter";
import { Action, Kanji, Segmented } from "@/components/app/primitives";
import { BACK } from "@/components/app/transitions";
import { cn } from "@/lib/utils";

const MAX_EDGE = 1280;
const CAPTION_MAX = 140;

type CamState = { kind: "starting" } | { kind: "live" } | { kind: "error"; message: string };

type Shot = { before: string; after: string };

const inputCls =
  "w-full rounded-lg border border-night-700 bg-night-800 px-3.5 text-mist-100 outline-none placeholder:text-mist-500 focus-visible:border-cursed-500 focus-visible:ring-[3px] focus-visible:ring-cursed-500/20";

function cameraMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access was blocked. Allow the camera for this site in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No camera was found on this device. The Archive only takes photos from the in-app camera.";
  if (name === "NotReadableError") return "The camera is in use by another app. Close it and try again.";
  return "The camera could not be started.";
}

export function ShareForm({ locations }: { locations: { id: string; name: string }[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<CamState>({ kind: "starting" });
  const [shot, setShot] = useState<Shot | null>(null);
  const [view, setView] = useState<"after" | "before">("after");
  const [caption, setCaption] = useState("");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"visible" | "in_review" | null>(null);
  const [pending, startTransition] = useTransition();

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    setCam({ kind: "starting" });
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam({
        kind: "error",
        message: "This browser cannot open a camera here. Use a current browser over HTTPS.",
      });
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
      } catch (err) {
        // A device without a rear camera can reject the constraint; retry with any camera.
        if (err instanceof DOMException && err.name === "OverconstrainedError") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else throw err;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      setCam({ kind: "live" });
    } catch (err) {
      setCam({ kind: "error", message: cameraMessage(err) });
    }
  }, [stop]);

  useEffect(() => {
    // Deferred so the camera state updates happen outside the effect body.
    const id = setTimeout(() => void start(), 0);
    return () => {
      clearTimeout(id);
      stop();
    };
  }, [start, stop]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const before = canvas.toDataURL("image/jpeg", 0.85);
    ctx.putImageData(applyInkFilter(ctx.getImageData(0, 0, w, h)), 0, 0);
    const after = canvas.toDataURL("image/jpeg", 0.85);
    stop();
    setShot({ before, after });
    setView("after");
    setError(null);
  }

  function retake() {
    setShot(null);
    void start();
  }

  function submit() {
    if (!shot) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await shareToArchive({
          photoDataUrl: shot.after,
          caption: caption.trim(),
          locationId: locationId || null,
        });
        if (res.ok) setDone(res.data.status);
        else setError(res.error);
      } catch {
        setError("Something went wrong sending the photo. Try again.");
      }
    });
  }

  if (done) {
    return (
      <div className="rise-in flex flex-1 flex-col items-center justify-center gap-3 px-8 pb-16 text-center">
        <Kanji className="text-6xl text-cursed-300">{done === "visible" ? "録" : "審"}</Kanji>
        <h1 className="font-display text-2xl font-extrabold">
          {done === "visible" ? "Inked into the archive" : "Sent for review"}
        </h1>
        <p className="text-[15px] leading-[1.6] text-mist-300">
          {done === "visible"
            ? "Your photo is now in the Cursed Archive."
            : "A reviewer will look at your photo before it appears in the gallery."}
        </p>
        <Action href="/archive" back size="md" className="mt-4 w-full max-w-[320px]">
          Back to the archive
        </Action>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+16px)] lg:px-6 lg:pt-6">
        <Link
          href="/archive"
          transitionTypes={BACK}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-full hover:bg-night-800"
        >
          <X className="size-[22px]" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold">Share a photo</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 py-3.5 lg:px-8 lg:pb-8">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-night-700 bg-night-950">
          {/* The live preview stays mounted so the stream keeps its element. */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn("size-full object-cover", (shot || cam.kind !== "live") && "invisible")}
          />
          {shot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={view === "after" ? shot.after : shot.before}
              alt={view === "after" ? "Your photo with the ink filter" : "Your photo before the filter"}
              className="absolute inset-0 size-full object-cover"
            />
          )}
          {!shot && cam.kind === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center text-[14px] text-mist-300">
              Opening the camera&hellip;
            </div>
          )}
          {!shot && cam.kind === "error" && (
            <div
              role="alert"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
            >
              <CameraOff className="size-9 text-mist-300" />
              <p className="text-[14px] leading-[1.6] text-mist-300">{cam.message}</p>
              <button
                type="button"
                onClick={() => void start()}
                className="h-11 rounded-lg border border-night-700 px-4 text-[14px] font-bold hover:bg-night-800"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {!shot ? (
          <button
            type="button"
            onClick={capture}
            disabled={cam.kind !== "live"}
            aria-label="Take photo"
            className="mx-auto flex size-[72px] items-center justify-center rounded-full border-4 border-mist-100 transition-transform active:scale-95 disabled:opacity-40"
          >
            <Camera className="size-7" />
          </button>
        ) : (
          <>
            <Segmented
              label="Preview"
              value={view}
              onChange={setView}
              items={[
                { value: "before", label: "Before" },
                { value: "after", label: "Ink" },
              ]}
            />

            <label className="flex flex-col gap-1.5">
              <span className="flex justify-between text-[13px] text-mist-300">
                <span>Caption (optional)</span>
                <span className="tabular-nums">
                  {caption.length}/{CAPTION_MAX}
                </span>
              </span>
              <input
                className={cn(inputCls, "h-[50px] text-base")}
                value={caption}
                maxLength={CAPTION_MAX}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What is this place?"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] text-mist-300">Location (optional)</span>
              <select
                className={cn(inputCls, "h-[50px] text-base")}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">No location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-seal-600/50 bg-seal-600/10 px-3.5 py-3 text-[14px] leading-normal"
              >
                {error}
              </p>
            )}

            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={retake}
                disabled={pending}
                className="flex h-[52px] items-center justify-center gap-2 rounded-lg border border-night-700 px-5 text-[15px] font-bold hover:bg-night-800 disabled:opacity-50"
              >
                <RotateCcw className="size-4" /> Retake
              </button>
              <Action size="md" disabled={pending} onClick={submit} className="flex-1">
                <Check className="size-5" /> {pending ? "Checking photo..." : "Share"}
              </Action>
            </div>
          </>
        )}
      </div>
    </>
  );
}
