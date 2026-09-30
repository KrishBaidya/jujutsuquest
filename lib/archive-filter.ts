// The "ink" look for Cursed Archive photos. Pure over RGBA bytes so it runs in the
// browser on canvas ImageData and can be unit-checked without a DOM.

type Pixels = { data: Uint8ClampedArray; width: number; height: number };

// Warm sumi-ink duotone: shadows -> deep ink, highlights -> washi paper.
const SHADOW = [20, 17, 15] as const;
const PAPER = [238, 228, 208] as const;
// App accent (#3D8BFF), washed into the highlights.
const ENERGY = [61, 139, 255] as const;

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Cheap deterministic hash noise in [-1, 1] so the grain is stable per pixel. */
function grain(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 2048) / 1024 - 1;
}

/** Applies the ink filter in place and returns the same object. Alpha is untouched. */
export function applyInkFilter<T extends Pixels>(image: T): T {
  const { data, width, height } = image;
  const cx = width / 2;
  const cy = height / 2;
  const maxD = Math.hypot(cx, cy) || 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Luma (Rec. 709), then a contrast S-curve about mid grey.
      let l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      l = (l - 0.5) * 1.45 + 0.5;
      l = Math.min(1, Math.max(0, l));
      // Light edge darkening (vignette).
      const d = Math.hypot(x - cx, y - cy) / maxD;
      l *= 1 - 0.38 * smooth(0.45, 1, d);
      // Paper grain.
      l += grain(x, y) * 0.035;
      l = Math.min(1, Math.max(0, l));

      // Ink duotone.
      let r = SHADOW[0] + (PAPER[0] - SHADOW[0]) * l;
      let g = SHADOW[1] + (PAPER[1] - SHADOW[1]) * l;
      let b = SHADOW[2] + (PAPER[2] - SHADOW[2]) * l;

      // Energy wash: blue tint only in the highlights.
      const w = smooth(0.62, 1, l) * 0.32;
      r += (ENERGY[0] - r) * w;
      g += (ENERGY[1] - g) * w;
      b += (ENERGY[2] - b) * w;

      data[i] = clamp(Math.round(r));
      data[i + 1] = clamp(Math.round(g));
      data[i + 2] = clamp(Math.round(b));
    }
  }
  return image;
}
