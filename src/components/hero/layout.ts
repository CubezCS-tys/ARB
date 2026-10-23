/** Target layouts the glyph field morphs into: the SI monogram and ordered lines of "text". */

export type Rand = () => number;

export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Samples points inside the SI monogram (same geometry as brand/Logo.tsx:
 * serif S, i stem, teal triangle). Returns coordinates normalised so the mark
 * is ~1 unit tall and centred on the origin, plus a teal flag per point.
 */
export function sampleMonogram(count: number, rand: Rand, serifFamily: string) {
  const k = 5;
  const size = 64 * k;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const pts = new Float32Array(count * 2);
  const teal = new Uint8Array(count);
  if (!ctx) return { pts, teal };

  ctx.fillStyle = "#f00";
  ctx.font = `600 ${60 * k}px ${serifFamily}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("S", 4 * k, 54 * k);
  ctx.fillRect(45 * k, 24 * k, 7.5 * k, 30 * k);
  ctx.fillStyle = "#0f0";
  ctx.beginPath();
  ctx.moveTo(44 * k, 20 * k);
  ctx.lineTo(58 * k, 6 * k);
  ctx.lineTo(56 * k, 20 * k);
  ctx.closePath();
  ctx.fill();

  const data = ctx.getImageData(0, 0, size, size).data;
  const gold: number[] = [];
  const tri: number[] = [];
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const o = (y * size + x) * 4;
      if (data[o + 1] > 128) tri.push(x, y);
      else if (data[o] > 128) gold.push(x, y);
    }
  }

  for (let i = 0; i < count; i++) {
    const useTeal = tri.length > 0 && rand() < 0.07;
    const pool = useTeal || gold.length === 0 ? tri : gold;
    if (pool.length === 0) break;
    const j = Math.floor(rand() * (pool.length / 2)) * 2;
    const jx = (rand() - 0.5) * 2;
    const jy = (rand() - 0.5) * 2;
    pts[i * 2] = ((pool[j] + jx) / k - 31) / 48;
    pts[i * 2 + 1] = -((pool[j + 1] + jy) / k - 30) / 48;
    teal[i] = useTeal ? 1 : 0;
  }
  return { pts, teal };
}

export type LineLayout = {
  count: number;
  /** normalised x,y in [-1,1] */
  pos: Float32Array;
  /** 1 = Arabic line (right-to-left), 0 = Latin */
  arabic: Uint8Array;
  /** 0..1 order in which a slot fills as you scroll (reading order) */
  delay: Float32Array;
  /** 1 = part of a highlighted "entity" word */
  entity: Uint8Array;
  /** slot indices joined by graph edges */
  edges: [number, number][];
  /** width of one glyph slot in normalised x units */
  slotW: number;
};

type Block = { arabic: boolean; rows: number; startRow: number; colStart: number; cols: number };

/**
 * A bilingual "page": on desktop a Latin column and an Arabic column side by
 * side (like a parallel translation); on mobile the two stacked. Words have
 * random lengths, paragraphs end ragged. A share of words are entities, and
 * nearby entities (plus a few cross-language pairs) are linked.
 */
export function buildLineLayout(mobile: boolean, rand: Rand, aspect: number): LineLayout {
  const totalCols = mobile ? 26 : 74;
  const totalRows = mobile ? 23 : 16;
  const blocks: Block[] = mobile
    ? [
        { arabic: true, rows: 11, startRow: 0, colStart: 0, cols: 26 },
        { arabic: false, rows: 11, startRow: 12, colStart: 0, cols: 26 },
      ]
    : [
        { arabic: false, rows: 16, startRow: 0, colStart: 0, cols: 34 },
        { arabic: true, rows: 16, startRow: 0, colStart: 40, cols: 34 },
      ];
  const slotW = 2 / totalCols;
  const rowH = 2 / (totalRows - 1);

  const xs: number[] = [];
  const ys: number[] = [];
  const ar: number[] = [];
  const dl: number[] = [];
  const en: number[] = [];
  const nodes: number[] = [];

  for (const b of blocks) {
    for (let r = 0; r < b.rows; r++) {
      const paraPos = r % 6;
      if (paraPos === 5) continue; // blank line between paragraphs
      const limit = paraPos === 4 ? Math.floor(b.cols * (0.35 + rand() * 0.3)) : b.cols;
      const row = b.startRow + r;
      const y = 1 - row * rowH;
      let p = 0;
      while (p < limit) {
        let len = 2 + Math.floor(rand() * 7);
        if (p + len > limit) {
          if (limit - p < 2) break;
          len = limit - p;
        }
        const isEntity = rand() < 0.17;
        const mid = Math.floor(len / 2);
        for (let c = 0; c < len; c++) {
          const read = p + c; // position along reading direction
          const col = b.arabic ? b.colStart + b.cols - 1 - read : b.colStart + read;
          if (isEntity && c === mid) nodes.push(xs.length);
          xs.push(-1 + (col + 0.5) * slotW);
          ys.push(y);
          ar.push(b.arabic ? 1 : 0);
          dl.push(Math.min(1, 0.62 * (row / (totalRows - 1)) + 0.34 * (read / b.cols) + rand() * 0.04));
          en.push(isEntity ? 1 : 0);
        }
        p += len + 1;
      }
    }
  }

  // Graph edges between entity nodes, measured in an aspect-corrected space.
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a === b || seen.has(key)) return;
    seen.add(key);
    edges.push([a, b]);
  };
  const dist = (a: number, b: number) => Math.hypot((xs[a] - xs[b]) * aspect, ys[a] - ys[b]);
  for (const a of nodes) {
    const near = nodes
      .filter((b) => ar[b] === ar[a] && Math.abs(ys[b] - ys[a]) > 1e-4)
      .sort((p, q) => dist(a, p) - dist(a, q))
      .slice(0, 2);
    near.forEach((b) => add(a, b));
    if (ar[a] === 1 && rand() < 0.45) {
      const other = nodes
        .filter((b) => ar[b] === 0 && Math.abs(ys[b] - ys[a]) > 1e-4)
        .sort((p, q) => Math.abs(ys[a] - ys[p]) - Math.abs(ys[a] - ys[q]))[0];
      if (other !== undefined) add(a, other);
    }
  }

  return {
    count: xs.length,
    pos: new Float32Array(xs.flatMap((x, i) => [x, ys[i]])),
    arabic: Uint8Array.from(ar),
    delay: Float32Array.from(dl),
    entity: Uint8Array.from(en),
    edges,
    slotW,
  };
}
