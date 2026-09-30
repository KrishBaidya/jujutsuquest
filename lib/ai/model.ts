import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Gemini called directly through Google's API with the AI SDK provider,
// authenticated by an API key from Google AI Studio. GEMINI_API_KEY is
// accepted as a shorter alias for the SDK's own variable name.
// Import only from server actions.

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

const google = createGoogleGenerativeAI({ apiKey });

export const geminiVision = google(process.env.GEMINI_MODEL ?? "gemini-2.5-flash");

/** False when no Gemini key is set; callers must fall back to manual review. */
export const hasGemini = () => Boolean(apiKey);

/** At or above this, Gemini's verdict is applied automatically; below it, a human reviews. */
export const AUTO_DECISION_CONFIDENCE = 0.8;
