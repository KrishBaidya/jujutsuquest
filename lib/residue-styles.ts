// Photo styles for residue posts. Pure functions over RGBA bytes so they run on
// canvas ImageData in the browser (and can be checked without a DOM).

export type Pixels = { data: Uint8ClampedArray; width: number; height: number };

export type StyleKey = "original" | "sumi" | "cursed" | "manga" | "domain";

export const STYLES: { key: StyleKey; kanji: string; name: string; blurb: string }[] = [
  { key: "original", kanji: "原", name: "Original", blurb: "As you took it" },
  { key: "sumi", kanji: "墨", name: "Sumi ink", blurb: "Brush ink on washi" },
  { key: "cursed", kanji: "呪", name: "Cursed", blurb: "Violet dusk, red glare" },
  { key: "manga", kanji: "漫", name: "Manga", blurb: "Screentone panel" },
  { key: "domain", kanji: "域", name: "Domain", blurb: "Blood-red sky" },
];

type RGB = readonly [number, number, number];

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const luma = (d: Uint8ClampedArray, i: number) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;

/** Stable hash noise in [-1, 1] so grain does not shimmer between renders. */
function grain(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 2048) / 1024 - 1;
}

/** Piecewise-linear gradient map over evenly spaced stops. */
function mapGradient(stops: RGB[], t: number): RGB {
  const x = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** Luminance levels at the 2nd and 98th percentile, so dark or flat photos still use the full range. */
function levels(src: Pixels): [number, number] {
  const hist = new Uint32Array(256);
  const { data } = src;
  const step = Math.max(1, Math.floor(data.length / 4 / 40_000)) * 4;
  let n = 0;
  for (let i = 0; i < data.length; i += step) {
    hist[Math.round(luma(data, i) * 255)]++;
    n++;
  }
  const pick = (q: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= n * q) return v / 255;
    }
    return 1;
  };
  const lo = pick(0.02);
  const hi = pick(0.98);
  return hi - lo < 0.05 ? [0, 1] : [lo, hi];
}

function vignette(x: number, y: number, w: number, h: number, strength: number, start = 0.45) {
  const d = Math.hypot(x - w / 2, y - h / 2) / (Math.hypot(w / 2, h / 2) || 1);
  return 1 - strength * smooth(start, 1, d);
}

function gradientStyle(src: Pixels, out: Uint8ClampedArray, stops: RGB[], contrast: number, vig: number, noise: number) {
  const { data, width, height } = src;
  const [lo, hi] = levels(src);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let l = ((luma(data, i) - lo) / (hi - lo) - 0.5) * contrast + 0.5;
      l *= vignette(x, y, width, height, vig);
      l += grain(x, y) * noise;
      const [r, g, b] = mapGradient(stops, l);
      out[i] = clamp(r);
      out[i + 1] = clamp(g);
      out[i + 2] = clamp(b);
      out[i + 3] = data[i + 3];
    }
  }
}

const SUMI: RGB[] = [
  [16, 13, 12],
  [70, 62, 56],
  [168, 158, 140],
  [236, 227, 207],
];
const CURSED: RGB[] = [
  [5, 3, 10],
  [38, 14, 78],
  [124, 44, 170],
  [232, 58, 70],
  [255, 214, 190],
];
const DOMAIN: RGB[] = [
  [4, 1, 2],
  [60, 4, 12],
  [170, 18, 30],
  [248, 92, 72],
  [255, 226, 210],
];

function manga(src: Pixels, out: Uint8ClampedArray) {
  const { data, width, height } = src;
  const INK = [20, 17, 16] as const;
  const PAPER = [236, 229, 212] as const;
  // Screentone cell size scales with the image so dots read the same at any size.
  const cell = Math.max(4, Math.round(Math.max(width, height) / 170));
  const [lo, hi] = levels(src);
  const lum = new Float32Array(width * height);
  for (let p = 0; p < width * height; p++) lum[p] = Math.min(1, Math.max(0, (luma(data, p * 4) - lo) / (hi - lo)));

  // Average luminance per cell.
  const cw = Math.ceil(width / cell);
  const ch = Math.ceil(height / cell);
  const avg = new Float32Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      let sum = 0;
      let n = 0;
      for (let y = cy * cell; y < Math.min(height, (cy + 1) * cell); y++) {
        for (let x = cx * cell; x < Math.min(width, (cx + 1) * cell); x++) {
          sum += lum[y * width + x];
          n++;
        }
      }
      avg[cy * cw + cx] = n ? sum / n : 1;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const a = Math.min(1, Math.max(0, (avg[cy * cw + cx] - 0.5) * 1.5 + 0.5));
      // Dot radius grows with darkness; pure whites get none, deep shadows go solid.
      const r = cell * 0.72 * Math.sqrt(1 - a);
      const dx = x - (cx + 0.5) * cell;
      const dy = y - (cy + 0.5) * cell;
      let ink = a < 0.06 || Math.hypot(dx, dy) < r;

      // Ink outlines from a Sobel edge pass.
      if (!ink && x > 0 && y > 0 && x < width - 1 && y < height - 1) {
        const l = (xx: number, yy: number) => lum[yy * width + xx];
        const gx = -l(x - 1, y - 1) - 2 * l(x - 1, y) - l(x - 1, y + 1) + l(x + 1, y - 1) + 2 * l(x + 1, y) + l(x + 1, y + 1);
        const gy = -l(x - 1, y - 1) - 2 * l(x, y - 1) - l(x + 1, y - 1) + l(x - 1, y + 1) + 2 * l(x, y + 1) + l(x + 1, y + 1);
        ink = Math.hypot(gx, gy) > 0.55;
      }
      const c = ink ? INK : PAPER;
      out[i] = c[0];
      out[i + 1] = c[1];
      out[i + 2] = c[2];
      out[i + 3] = data[i + 3];
    }
  }
}

/**
 * Renders `style` from `src` into `dst` (same size). `amount` in 0..1 blends
 * between the untouched photo and the full style.
 */
export function renderStyle(src: Pixels, dst: Pixels, style: StyleKey, amount = 1) {
  const out = dst.data;
  if (style === "original" || amount <= 0) {
    out.set(src.data);
    return dst;
  }
  if (style === "sumi") gradientStyle(src, out, SUMI, 1.45, 0.4, 0.04);
  else if (style === "cursed") gradientStyle(src, out, CURSED, 1.35, 0.6, 0.035);
  else if (style === "domain") gradientStyle(src, out, DOMAIN, 1.5, 0.7, 0.03);
  else manga(src, out);

  if (amount < 1) {
    const s = src.data;
    for (let i = 0; i < out.length; i += 4) {
      out[i] = s[i] + (out[i] - s[i]) * amount;
      out[i + 1] = s[i + 1] + (out[i + 1] - s[i + 1]) * amount;
      out[i + 2] = s[i + 2] + (out[i + 2] - s[i + 2]) * amount;
    }
  }
  return dst;
}
