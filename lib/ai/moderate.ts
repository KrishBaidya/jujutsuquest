import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { GEMINI_VISION_MODEL, hasGemini } from "./model";

const verdictSchema = z.object({
  allowed: z.boolean().describe("true only if the photo is safe to show on a campus gallery"),
  reason: z.string().describe("One short sentence a student can read, explaining the verdict"),
  closeUpFace: z.boolean().describe("A person's face is shown in close-up or is the main subject"),
  screenOrScreenshot: z.boolean().describe("A photo of a screen, or a screenshot / UI capture"),
  animeOrCopyrightedCharacter: z
    .boolean()
    .describe("Anime, cartoon or otherwise copyrighted characters or artwork"),
  unsafeContent: z.boolean().describe("Nudity, violence, hate symbols, drugs or other unsafe content"),
});

export type ModerationVerdict = z.infer<typeof verdictSchema>;

/**
 * Asks Gemini (via the AI Gateway) whether an inked campus photo may be shown.
 * Returns null when Gemini is not configured or the call fails, so the caller can
 * park the post for manual review. Server actions only.
 */
export async function moderatePhoto(
  bytes: Uint8Array,
  mediaType: string,
): Promise<ModerationVerdict | null> {
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
              text:
                "You moderate a campus photo gallery. The photo was taken by a student on campus and " +
                "restyled with a stylised ink filter. Set allowed=false if the photo shows a person's face " +
                "in close-up, a screen or screenshot, anime or copyrighted characters, a stock or " +
                "downloaded-looking image, or any unsafe content. Landscapes, buildings, plants, objects " +
                "and small distant figures are fine. Set the matching flags, and give a short reason.",
            },
            { type: "file", mediaType, data: bytes },
          ],
        },
      ],
    });
    if (!output) return null;
    const blocked =
      output.closeUpFace ||
      output.screenOrScreenshot ||
      output.animeOrCopyrightedCharacter ||
      output.unsafeContent;
    return { ...output, allowed: output.allowed && !blocked };
  } catch (err) {
    console.error("[archive] moderation failed", err instanceof Error ? err.message : err);
    return null;
  }
}
