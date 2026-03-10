// colorMath.ts — Pure color conversion and parsing functions.
// No React imports. No npm package imports. Zero side effects.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RGB { r: number; g: number; b: number }   // integers 0-255
export interface HSL { h: number; s: number; l: number }   // h:0-360, s/l:0-100
export interface OKLCH { l: number; c: number; h: number } // l:0-1, c:0-~0.4, h:0-360

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Accept #RGB or #RRGGBB (case insensitive, # optional). Return lowercase #rrggbb or null. */
export function parseHex(input: string): string | null {
  const m = input.trim().match(HEX_RE);
  if (!m) return null;
  // m[1] is guaranteed by regex capturing group
  let h = m[1]!;
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  return "#" + h.toLowerCase();
}

const RGB_RE = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const RGB_BARE = /^(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})$/;

/** Accept rgb(R, G, B) or bare R, G, B or R G B. Validate channels 0-255. */
export function parseRgb(input: string): RGB | null {
  const m = input.trim().match(RGB_RE) ?? input.trim().match(RGB_BARE);
  if (!m) return null;
  const r = +m[1]!, g = +m[2]!, b = +m[3]!;
  if (r > 255 || g > 255 || b > 255) return null;
  return { r, g, b };
}

const HSL_RE = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/i;
const HSL_BARE = /^(\d{1,3})[,\s]+(\d{1,3})%?[,\s]+(\d{1,3})%?$/;

/** Accept hsl(H, S%, L%) or bare H S L with optional %. Validate h 0-360, s/l 0-100. */
export function parseHsl(input: string): HSL | null {
  const m = input.trim().match(HSL_RE) ?? input.trim().match(HSL_BARE);
  if (!m) return null;
  const h = +m[1]!, s = +m[2]!, l = +m[3]!;
  if (h > 360 || s > 100 || l > 100) return null;
  return { h, s, l };
}

const OKLCH_RE = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i;
const OKLCH_BARE = /^([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)$/;

/**
 * Accept oklch(L C H) space-separated or comma-tolerant.
 * Validate l 0-1, c >= 0, h 0-360.
 * Out-of-gamut values are VALID inputs — parse succeeds, gamut detection runs separately.
 */
export function parseOklch(input: string): OKLCH | null {
  const m = input.trim().match(OKLCH_RE) ?? input.trim().match(OKLCH_BARE);
  if (!m) return null;
  const l = +m[1]!, c = +m[2]!, h = +m[3]!;
  if (l < 0 || l > 1 || c < 0 || h < 0 || h > 360) return null;
  return { l, c, h };
}

// ---------------------------------------------------------------------------
// HEX ↔ RGB
// ---------------------------------------------------------------------------

/** Parse canonical #rrggbb → RGB (integer channels via bit shifts). */
export function hexToRgb(hex: string): RGB {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** Math.round each channel, return lowercase #rrggbb. */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b]
    .map(v => Math.round(v).toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// RGB ↔ HSL
// ---------------------------------------------------------------------------

/** Standard max/min algorithm. Returns rounded integers. */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  // Achromatic guard
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Standard hue-to-rgb helper. Zero-saturation guard. Returns Math.round channels. */
export function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100, ln = l / 100;

  // Zero-saturation guard (achromatic)
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const hn = h / 360;

  function hueToRgb(t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  return {
    r: Math.round(hueToRgb(hn + 1 / 3) * 255),
    g: Math.round(hueToRgb(hn) * 255),
    b: Math.round(hueToRgb(hn - 1 / 3) * 255),
  };
}

// ---------------------------------------------------------------------------
// sRGB ↔ Linear RGB (internal helpers for OKLCH pipeline)
// ---------------------------------------------------------------------------

/** v is 0-255; normalize to 0-1, apply IEC 61966-2-1 transfer function. */
function srgbToLinear(v: number): number {
  const vn = v / 255;
  return vn <= 0.04045 ? vn / 12.92 : Math.pow((vn + 0.055) / 1.055, 2.4);
}

/** v is 0-1 linear; return 0-1 sRGB (caller multiplies by 255). */
function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------
// OKLCH pipeline (internal)
// ---------------------------------------------------------------------------

/**
 * Polar OKLCH → OKLab → inverse M2 (LMS^1/3) → cube → inverse M1 (LMS → linear sRGB).
 * Returns raw linear values (may be outside [0,1] for out-of-gamut colors).
 * Source: Björn Ottosson (bottosson.github.io/posts/oklab/)
 */
function oklchToLinearRgb(l: number, c: number, h: number): [number, number, number] {
  const hRad = h * Math.PI / 180;
  const a = c * Math.cos(hRad);
  const bv = c * Math.sin(hRad);

  // Inverse M2 (OKLab → LMS^1/3)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bv;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bv;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * bv;

  // Cube (using ** 3 — equivalent to Math.pow but clearer for integer exponent)
  const lc = l_ ** 3;
  const mc = m_ ** 3;
  const sc = s_ ** 3;

  // Inverse M1 (LMS → linear sRGB)
  const r =  4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const b = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;
  return [r, g, b];
}

/** Epsilon tolerance ±0.0001 on all channels to handle float noise at gamut boundary. */
function isInGamut(r: number, g: number, b: number): boolean {
  return r >= -0.0001 && r <= 1.0001
      && g >= -0.0001 && g <= 1.0001
      && b >= -0.0001 && b <= 1.0001;
}

// ---------------------------------------------------------------------------
// OKLCH ↔ RGB (exported)
// ---------------------------------------------------------------------------

/**
 * Linearize channels → M1 matrix (sRGB → LMS) → Math.cbrt each →
 * M2 matrix (LMS^1/3 → OKLab) → polar conversion to chroma + hue.
 * Achromatic guard: when C < 0.0001, hue is set to 0.
 * Source: Björn Ottosson (bottosson.github.io/posts/oklab/)
 */
export function rgbToOklch(r: number, g: number, b: number): OKLCH {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  // M1: linear sRGB → LMS
  const lLms = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const mLms = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const sLms = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  // Cube root (Math.cbrt handles negative values correctly — critical for extreme colors)
  const l_ = Math.cbrt(lLms);
  const m_ = Math.cbrt(mLms);
  const s_ = Math.cbrt(sLms);

  // M2: LMS^1/3 → OKLab
  const L  =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const av =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const c = Math.sqrt(av * av + bv * bv);
  // Achromatic guard: hue undefined when C ≈ 0
  const h = c < 0.0001 ? 0 : ((Math.atan2(bv, av) * 180 / Math.PI) + 360) % 360;

  return { l: L, c, h };
}

/**
 * Convert OKLCH → RGB.
 * If in gamut: apply linearToSrgb × 255 and round.
 * If out of gamut: call clampToSRGB (binary-search chroma reduction) and return that.
 */
export function oklchToRgb(l: number, c: number, h: number): RGB {
  const [rl, gl, bl] = oklchToLinearRgb(l, c, h);
  if (isInGamut(rl, gl, bl)) {
    return {
      r: Math.round(Math.max(0, Math.min(1, linearToSrgb(rl))) * 255),
      g: Math.round(Math.max(0, Math.min(1, linearToSrgb(gl))) * 255),
      b: Math.round(Math.max(0, Math.min(1, linearToSrgb(bl))) * 255),
    };
  }
  return clampToSRGB(l, c, h);
}

// ---------------------------------------------------------------------------
// Gamut utilities
// ---------------------------------------------------------------------------

/**
 * Compute oklchToLinearRgb and check if any channel falls outside [0,1].
 */
export function isOutOfGamut(l: number, c: number, h: number): boolean {
  const [r, g, b] = oklchToLinearRgb(l, c, h);
  return !isInGamut(r, g, b);
}

/**
 * Binary-search chroma reduction (CSS Color Level 4 §13.2 algorithm).
 * Reduces chroma until in gamut while preserving hue and lightness.
 * Returns clamped RGB with channels in [0, 255].
 */
export function clampToSRGB(l: number, c: number, h: number): RGB {
  // First check if already in gamut
  const [r0, g0, b0] = oklchToLinearRgb(l, c, h);
  if (isInGamut(r0, g0, b0)) {
    return {
      r: Math.round(Math.max(0, Math.min(1, linearToSrgb(r0))) * 255),
      g: Math.round(Math.max(0, Math.min(1, linearToSrgb(g0))) * 255),
      b: Math.round(Math.max(0, Math.min(1, linearToSrgb(b0))) * 255),
    };
  }

  // Binary search: reduce chroma until in gamut
  let lo = 0;
  let hi = c;
  const EPSILON = 0.0001;
  while (hi - lo > EPSILON) {
    const mid = (lo + hi) / 2;
    const [tr, tg, tb] = oklchToLinearRgb(l, mid, h);
    if (isInGamut(tr, tg, tb)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const [fr, fg, fb] = oklchToLinearRgb(l, lo, h);
  return {
    r: Math.round(Math.max(0, Math.min(1, linearToSrgb(fr))) * 255),
    g: Math.round(Math.max(0, Math.min(1, linearToSrgb(fg))) * 255),
    b: Math.round(Math.max(0, Math.min(1, linearToSrgb(fb))) * 255),
  };
}

// ---------------------------------------------------------------------------
// WCAG contrast (WCAG 2.1 §1.4.3)
// ---------------------------------------------------------------------------

/**
 * Linearize each channel using IEC 61966-2-1 transfer function.
 * Returns relative luminance in [0, 1].
 * Source: WCAG 2.1 (w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (v: number): number => {
    const vn = v / 255;
    return vn <= 0.04045 ? vn / 12.92 : Math.pow((vn + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG contrast ratio. Returns e.g. 21.0 for black on white.
 * (lighter + 0.05) / (darker + 0.05)
 */
export function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker  = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// WCAG thresholds (verified from WCAG 2.1)
// ---------------------------------------------------------------------------

export const WCAG = {
  normalAA:  4.5,
  normalAAA: 7.0,
  largeAA:   3.0,
  largeAAA:  4.5,
} as const;
