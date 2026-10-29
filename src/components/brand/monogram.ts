/**
 * i2i monogram geometry, shared by the SVG logo, the loader, the hero glyph
 * field and the orbital scene texture. 64x64 box, mark centred on (32, 32):
 * two lowercase Playfair i's (dotless, weight 700) around a Playfair 2
 * (weight 600), all on baseline y = 50.5, with round teal dots over the i's.
 * Glyphs are stored as outlines so the mark never depends on webfont loading.
 */

export const MONO_STEMS = [
  "M13.78 27.27L13.78 46.41Q13.78 48.26 14.42 48.92Q15.05 49.58 16.59 49.58L16.59 50.50Q15.80 50.46 14.13 50.39Q12.46 50.32 10.74 50.32Q9.03 50.32 7.27 50.39Q5.51 50.46 4.63 50.50L4.63 49.58Q6.17 49.58 6.80 48.92Q7.44 48.26 7.44 46.41L7.44 32.55Q7.44 30.57 6.85 29.62Q6.25 28.68 4.63 28.68L4.63 27.75Q6.03 27.88 7.35 27.88Q9.20 27.88 10.81 27.73Q12.41 27.58 13.78 27.27Z",
  "M56.78 27.27L56.78 46.41Q56.78 48.26 57.42 48.92Q58.05 49.58 59.59 49.58L59.59 50.50Q58.80 50.46 57.13 50.39Q55.46 50.32 53.74 50.32Q52.03 50.32 50.27 50.39Q48.51 50.46 47.63 50.50L47.63 49.58Q49.17 49.58 49.80 48.92Q50.44 48.26 50.44 46.41L50.44 32.55Q50.44 30.57 49.85 29.62Q49.25 28.68 47.63 28.68L47.63 27.75Q49.03 27.88 50.35 27.88Q52.20 27.88 53.81 27.73Q55.41 27.58 56.78 27.27Z",
] as const;

export const MONO_TWO = "M32.42 27.14Q35.72 27.14 37.63 28.59Q39.55 30.04 39.55 32.72Q39.55 34.44 38.69 35.91Q37.83 37.39 36.47 38.69Q35.10 39.98 33.54 41.19Q31.98 42.40 30.50 43.55Q29.03 44.69 27.97 45.88L37.35 45.88Q39.15 45.88 39.63 45.42Q40.12 44.96 40.29 43.81L41.13 43.81Q41.13 46.54 41.17 48.04Q41.22 49.53 41.31 50.72Q40.91 50.63 39.85 50.59Q38.80 50.54 37.43 50.52Q36.07 50.50 34.75 50.50L22.78 50.50L22.78 49.66Q24.06 48.34 25.88 46.74Q27.71 45.13 29.45 43.20Q31.19 41.26 32.35 38.97Q33.52 36.68 33.52 34Q33.52 31.62 32.44 30.52Q31.36 29.42 29.29 29.42Q27.49 29.42 26.02 30.37Q24.54 31.32 23.40 33.12L22.69 32.64Q23.53 31.18 24.78 29.93Q26.04 28.68 27.91 27.91Q29.78 27.14 32.42 27.14Z";

/** Every gold part of the mark as one path. */
export const MONO_GOLD = [MONO_TWO, ...MONO_STEMS].join(" ");

export const MONO_DOTS = [
  { cx: 10.5, cy: 18, r: 4.6 },
  { cx: 53.5, cy: 18, r: 4.6 },
] as const;

/** Centre of the mark (it spans x 4.6..59.6, y 13.4..50.5). */
export const MONO_CX = 32;
export const MONO_CY = 32;

/** Draws the mark into a 2D canvas at scale k (1 unit = k px). */
export function drawMonogram(g: CanvasRenderingContext2D, k: number, fill: string | CanvasGradient, dotFill: string) {
  g.save();
  g.scale(k, k);
  g.fillStyle = fill;
  g.fill(new Path2D(MONO_GOLD));
  g.fillStyle = dotFill;
  for (const d of MONO_DOTS) {
    g.beginPath();
    g.arc(d.cx, d.cy, d.r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
