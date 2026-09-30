import "server-only";
import { generateImage, NoImageGeneratedError } from "ai";
import { geminiImage, hasGemini } from "./model";

// Aspect ratios Gemini image models accept. The output keeps the photo's shape
// by using whichever of these is closest to it.
const RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;

function closestRatio(width: number, height: number): (typeof RATIOS)[number] {
  const target = Math.log(width / height);
  let best: (typeof RATIOS)[number] = "1:1";
  let gap = Infinity;
  for (const r of RATIOS) {
    const [w, h] = r.split(":").map(Number);
    const d = Math.abs(Math.log(w / h) - target);
    if (d < gap) [best, gap] = [r, d];
  }
  return best;
}

const prompt = (place: string) =>
  [
    `Redraw this photo, taken at ${place} on a university campus, as a single frame from a dark-fantasy shōnen anime in the visual style of Jujutsu Kaisen.`,
    "Keep the composition, the camera angle, the buildings and every person's pose, clothing and likeness, so the place and people are still recognisable. Keep any large readable text roughly where it is.",
    "Style: crisp cel shading, bold confident ink linework, deep blacks, high contrast, cinematic dramatic lighting, subtle film grain.",
    "Atmosphere: the scene is thick with cursed energy. Add wisps of violet and deep-blue cursed energy curling around the edges, a faint red glare in the sky, drifting ash and a few ominous small cursed spirits lurking in the shadows. Do not add any existing anime characters.",
    "Output only the image, the same shape as the input, no borders, captions, logos or watermarks.",
  ].join("\n");

export type ConjureResult = { ok: true; base64: string; mediaType: string } | { ok: false; reason: "unavailable" | "refused" | "failed" };

/** Asks Gemini to redraw a photo in the JJK style. Never throws. */
export async function conjure(input: {
  bytes: Uint8Array;
  width: number;
  height: number;
  placeName: string;
}): Promise<ConjureResult> {
  if (!hasGemini()) return { ok: false, reason: "unavailable" };
  try {
    const { image } = await generateImage({
      model: geminiImage,
      prompt: { text: prompt(input.placeName), images: [input.bytes] },
      aspectRatio: closestRatio(input.width, input.height),
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(75_000),
    });
    return { ok: true, base64: image.base64, mediaType: image.mediaType };
  } catch (err) {
    // No image usually means the safety filter declined the photo.
    if (NoImageGeneratedError.isInstance(err)) return { ok: false, reason: "refused" };
    console.error("[conjure] failed", err instanceof Error ? err.message : err);
    return { ok: false, reason: "failed" };
  }
}
