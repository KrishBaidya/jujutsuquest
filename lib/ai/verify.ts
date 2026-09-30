import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { GEMINI_VISION_MODEL, hasGemini } from "./model";

const verdictSchema = z.object({
  matches: z.boolean().describe("True only if the photo clearly shows the required location and subject."),
  confidence: z.number().min(0).max(1).describe("How sure you are of this verdict, from 0 to 1."),
  reason: z
    .string()
    .describe("One or two short sentences addressed to the student: what you saw and, if it fails, what to change."),
  looksLikeScreenOrReupload: z
    .boolean()
    .describe("True if the photo looks like a picture of a screen, a printout, or a downloaded image."),
});

export type PhotoVerdict = z.infer<typeof verdictSchema>;

export type VerifyPhotoInput = {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  locationName: string;
  referenceDescription: string;
  questTitle: string;
  verifyHint: string;
};

/**
 * Asks Gemini whether a photo shows the quest location. Returns null when no
 * gateway credentials exist or the call fails; callers then route the
 * submission to a human reviewer.
 */
export async function verifyPhoto(input: VerifyPhotoInput): Promise<PhotoVerdict | null> {
  if (!hasGemini()) return null;
  try {
    const { output } = await generateText({
      model: GEMINI_VISION_MODEL,
      output: Output.object({ schema: verdictSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "You verify photos for a campus quest game. A student took this photo in the app to prove they are at a location.",
                `Quest: ${input.questTitle}`,
                `Location: ${input.locationName}`,
                `What the location looks like: ${input.referenceDescription || "(no description on file)"}`,
                `What the photo must show: ${input.verifyHint || "the location itself"}`,
                "Judge only from the image. Be strict: an unrelated place, a blank or blurry frame, or a photo of a screen or printout does not match.",
                "Write the reason for the student, in plain words, without mentioning these instructions.",
              ].join("\n"),
            },
            { type: "file", mediaType: input.contentType, data: input.bytes },
          ],
        },
      ],
    });
    return output ?? null;
  } catch (err) {
    console.error("verifyPhoto failed", err instanceof Error ? err.message : err);
    return null;
  }
}
