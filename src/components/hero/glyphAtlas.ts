import * as THREE from "three";

/** Isolated Arabic letters, then Latin capitals and a few lowercase letters. 64 cells = 8x8 atlas. */
export const ARABIC_GLYPHS = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");
export const LATIN_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZaeinorstlh".split("");
export const ATLAS_COLS = 8;
const CELL = 128;

/** Resolve a next/font CSS variable to a usable canvas font-family list. */
export function cssFontFamily(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise<void>((resolve) => window.setTimeout(resolve, ms))]);
}

export async function waitForFonts(families: { family: string; sample: string; weight?: string }[]) {
  if (!("fonts" in document)) return;
  try {
    await withTimeout(
      Promise.all(families.map((f) => document.fonts.load(`${f.weight ?? "400"} 80px ${f.family}`, f.sample))),
      1800,
    );
  } catch {
    /* fall back to whatever is available */
  }
}

/**
 * Draws every glyph white-on-black into a square canvas and returns it as a
 * texture. The shader reads the red channel as coverage, so there are no
 * premultiplied-alpha surprises. A faint blur pass bakes in a soft halo.
 */
export function buildGlyphAtlas(arabicFamily: string, latinFamily: string) {
  const glyphs = [...ARABIC_GLYPHS, ...LATIN_GLYPHS];
  const size = CELL * ATLAS_COLS;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  glyphs.forEach((g, i) => {
    const arabic = i < ARABIC_GLYPHS.length;
    const cx = (i % ATLAS_COLS) * CELL + CELL / 2;
    const cy = Math.floor(i / ATLAS_COLS) * CELL + CELL / 2;
    let px = arabic ? 84 : 80;
    const family = arabic ? arabicFamily : latinFamily;
    const weight = arabic ? "600" : "500";
    ctx.font = `${weight} ${px}px ${family}`;
    let m = ctx.measureText(g);
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const fit = Math.min(1, 92 / Math.max(w, 1), 92 / Math.max(h, 1));
    if (fit < 1) {
      px = Math.floor(px * fit);
      ctx.font = `${weight} ${px}px ${family}`;
      m = ctx.measureText(g);
    }
    const x = cx - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
    const y = cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(255,255,255,0.55)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(g, x, y);
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.fillText(g, x, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, arabicCount: ARABIC_GLYPHS.length, latinCount: LATIN_GLYPHS.length };
}
