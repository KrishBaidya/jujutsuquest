import "server-only";

// Gemini through the Vercel AI Gateway. With `ai` v7 a plain "provider/model"
// string is routed through the gateway, authenticated by AI_GATEWAY_API_KEY
// locally or the OIDC token on Vercel. Import only from server actions.

export const GEMINI_VISION_MODEL = process.env.GEMINI_MODEL ?? "google/gemini-2.5-flash";

/** False when no gateway credentials exist; callers must fall back to manual review. */
export const hasGemini = () =>
  Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);

/** At or above this, Gemini's verdict is applied automatically; below it, a human reviews. */
export const AUTO_DECISION_CONFIDENCE = 0.8;
