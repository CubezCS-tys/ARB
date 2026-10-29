/**
 * i2i monogram geometry, shared by the SVG logo, the loader, the hero glyph
 * field and the orbital scene texture. 64x64 box: two i stems with teal
 * triangle "dots", and a serif 2 between them, all sitting on y = 54.
 */

export const MONO_STEMS = [
  { x: 6, y: 24, w: 7.5, h: 30 },
  { x: 50.5, y: 24, w: 7.5, h: 30 },
] as const;

export const MONO_DOTS = ["M5 20 L19 6 L17 20 Z", "M49.5 20 L63.5 6 L61.5 20 Z"] as const;

export const MONO_TWO = { x: 32, y: 54, size: 44 } as const;

/** Horizontal centre of the mark (it spans x 5..63.5). */
export const MONO_CX = 34.25;

/** Draws the mark into a 2D canvas at scale k (1 unit = k px). */
export function drawMonogram(
  g: CanvasRenderingContext2D,
  k: number,
  fill: string | CanvasGradient,
  dotFill: string,
  serifFamily: string,
) {
  g.fillStyle = fill;
  g.font = `600 ${MONO_TWO.size * k}px ${serifFamily}`;
  g.textBaseline = "alphabetic";
  g.textAlign = "center";
  g.fillText("2", MONO_TWO.x * k, MONO_TWO.y * k);
  for (const s of MONO_STEMS) g.fillRect(s.x * k, s.y * k, s.w * k, s.h * k);
  g.fillStyle = dotFill;
  for (const d of MONO_DOTS) {
    g.save();
    g.scale(k, k);
    g.fill(new Path2D(d));
    g.restore();
  }
}
