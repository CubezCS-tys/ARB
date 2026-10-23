/**
 * Procedural canvas textures for the story scene: aged parchment, ink layer,
 * clean OCR text layer, structured blocks and source cards. Also samples the
 * ink and OCR layers into point clouds for the glyph particles.
 */
import { CanvasTexture } from "three";
import { mulberry32 } from "../graph";
import { DEMO } from "../timeline";

export const PAGE_W = 3;
export const PAGE_H = 4;

export const RUBRIC = "باب في ذكر العلوم وأصنافها";
export const AR_LINES = [
  "اعلم أن الكتب خزائن العلم ومفاتيحها القراءة والنظر",
  "وقد جمعنا في هذا الكتاب ما تفرق في غيره من الأصول",
  "من أخبار العلماء وأقوالهم في الحساب والفلك والطب",
  "ونقلنا ذلك عن النسخ المعتمدة بعد المقابلة والتصحيح",
  "فمن أراد التحقيق فليرجع إلى المصادر الأولى وأسانيدها",
  "وليعلم أن لكل قول سندا ولكل نقل أصلا يرجع إليه",
  "وأن الفهم لا يتم إلا بمعرفة السياق والزمان والمكان",
  "وقد رتبنا الأبواب على حسب الموضوعات لا على الأسماء",
  "ليسهل على الطالب أن يجد ما يريد في أقرب وقت",
];
export const LATIN_LINES = ["Liber de scientiis, f. 12r", "collatum cum exemplari antiquo"];
/** Row baselines as fractions of page height (top = 0). */
export const RUBRIC_ROW = 0.14;
export const ROW0 = 0.215;
export const ROW_STEP = 0.056;
export const LATIN_ROWS = [0.775, 0.815];

type Fonts = { arabic: string; serif: string; mono: string; sans: string };

function cssFont(varName: string, fallback: string) {
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

async function loadFonts(): Promise<Fonts> {
  const f: Fonts = {
    arabic: cssFont("--font-arabic", "serif"),
    serif: cssFont("--font-playfair", "Georgia, serif"),
    mono: cssFont("--font-geist-mono", "ui-monospace, monospace"),
    sans: cssFont("--font-inter", "system-ui, sans-serif"),
  };
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`400 40px ${f.arabic}`, "باب"),
        document.fonts.load(`600 40px ${f.arabic}`, "باب"),
        document.fonts.load(`400 40px ${f.serif}`, "Liber"),
        document.fonts.load(`400 20px ${f.mono}`, "0a"),
        document.fonts.load(`400 20px ${f.sans}`, "a"),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fall back to whatever is available */
  }
  return f;
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  return { c, ctx };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Set ctx.font so `text` spans `width` (justified look), capped at base*cap. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, width: number, base: number, font: (s: number) => string, cap = 1.12) {
  ctx.font = font(base);
  const m = ctx.measureText(text).width || 1;
  const size = Math.min(base * cap, (base * width) / m);
  ctx.font = font(size);
  return size;
}

function drawParchment(ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) {
  const g = ctx.createRadialGradient(W * 0.42, H * 0.36, W * 0.08, W * 0.5, H * 0.5, W * 0.9);
  g.addColorStop(0, "#e3d0a4");
  g.addColorStop(0.55, "#cdb27f");
  g.addColorStop(1, "#8c7046");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const blot = (x: number, y: number, r: number, rgba: string) => {
    const b = ctx.createRadialGradient(x, y, 0, x, y, r);
    b.addColorStop(0, rgba);
    b.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = b;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (let i = 0; i < 16; i++) blot(rnd() * W, rnd() * H, W * (0.08 + rnd() * 0.25), `rgba(140,100,52,${0.04 + rnd() * 0.09})`);
  for (let i = 0; i < 8; i++) blot(rnd() * W, rnd() * H, W * (0.1 + rnd() * 0.2), `rgba(245,230,195,${0.04 + rnd() * 0.06})`);
  // water stain ring
  ctx.strokeStyle = "rgba(120,82,40,0.14)";
  ctx.lineWidth = W * 0.006;
  ctx.beginPath();
  ctx.ellipse(W * 0.78, H * 0.86, W * 0.14, W * 0.11, 0.4, 0, Math.PI * 1.7);
  ctx.stroke();

  ctx.lineWidth = 0.7;
  for (let i = 0; i < 520; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const a = rnd() * Math.PI;
    const l = 4 + rnd() * 14;
    ctx.strokeStyle = `rgba(105,78,44,${0.04 + rnd() * 0.07})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  for (let i = 0; i < 110; i++) {
    ctx.fillStyle = `rgba(118,72,32,${0.08 + rnd() * 0.28})`;
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // darkened, worn edges
  const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const e = ctx.createLinearGradient(x0, y0, x1, y1);
    e.addColorStop(0, "rgba(58,38,18,0.6)");
    e.addColorStop(1, "rgba(58,38,18,0)");
    ctx.fillStyle = e;
    ctx.fillRect(rx, ry, rw, rh);
  };
  const ew = W * 0.07;
  edge(0, 0, ew, 0, 0, 0, ew, H);
  edge(W, 0, W - ew, 0, W - ew, 0, ew, H);
  edge(0, 0, 0, ew, 0, 0, W, ew);
  edge(0, H, 0, H - ew, 0, H - ew, W, ew);
  blot(W, H, W * 0.3, "rgba(60,38,16,0.35)");
  blot(0, 0, W * 0.22, "rgba(60,38,16,0.25)");

  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 16;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);
}

function drawInk(ctx: CanvasRenderingContext2D, W: number, H: number, f: Fonts, rnd: () => number) {
  const s = W / 768;
  const mL = W * 0.12;
  const mR = W * 0.12;
  const avail = W - mL - mR;

  // ruled frame in faded red
  ctx.strokeStyle = "rgba(124,40,24,0.42)";
  ctx.lineWidth = 1.6 * s;
  ctx.strokeRect(mL - 16 * s, H * 0.085, avail + 32 * s, H * 0.645);
  ctx.strokeStyle = "rgba(124,40,24,0.25)";
  ctx.strokeRect(mL - 22 * s, H * 0.079, avail + 44 * s, H * 0.657);

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  fitFont(ctx, RUBRIC, avail * 0.62, 46 * s, (z) => `600 ${z}px ${f.arabic}`, 1.25);
  ctx.fillStyle = "rgba(128,36,20,0.92)";
  ctx.fillText(RUBRIC, W - mR - avail * 0.19, H * RUBRIC_ROW);

  AR_LINES.forEach((line, i) => {
    const y = H * (ROW0 + i * ROW_STEP);
    fitFont(ctx, line, avail, 32 * s, (z) => `400 ${z}px ${f.arabic}`, 1.25);
    ctx.fillStyle = `rgba(38,22,10,${0.78 + rnd() * 0.17})`;
    ctx.save();
    ctx.translate(W - mR, y);
    ctx.rotate((rnd() - 0.5) * 0.008);
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });

  // folio number
  ctx.font = `400 ${26 * s}px ${f.arabic}`;
  ctx.fillStyle = "rgba(38,22,10,0.55)";
  ctx.fillText("١٢", mL + 30 * s, H * 0.06);

  // faded Latin marginalia
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.font = `italic 400 ${22 * s}px ${f.serif}`;
  ctx.fillStyle = "rgba(72,52,30,0.42)";
  LATIN_LINES.forEach((l, i) => ctx.fillText(l, mL, H * LATIN_ROWS[i]));
  ctx.save();
  ctx.translate(W * 0.068, H * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `italic 400 ${16 * s}px ${f.serif}`;
  ctx.fillStyle = "rgba(72,52,30,0.3)";
  ctx.fillText("cf. lib. II, cap. iv", 0, 0);
  ctx.restore();

  // flaking ink
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.4 + rnd() * 0.5})`;
    const z = (0.8 + rnd() * 2) * s;
    ctx.fillRect(mL - 20 * s + rnd() * (avail + 40 * s), H * 0.08 + rnd() * H * 0.76, z, z);
  }
  ctx.globalCompositeOperation = "source-over";
}

/** Clean OCR output layer, aligned row-for-row with the ink layer. */
function drawCrisp(ctx: CanvasRenderingContext2D, W: number, H: number, f: Fonts, rnd: () => number) {
  const s = W / 768;
  const mL = W * 0.12;
  const mR = W * 0.12;
  const avail = W - mL - mR;
  const boxes: { x: number; y: number; w: number; h: number; label: string }[] = [];

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  let size = fitFont(ctx, RUBRIC, avail * 0.62, 44 * s, (z) => `600 ${z}px ${f.arabic}`, 1.2);
  ctx.fillStyle = "#E3CFA6";
  const rx = W - mR - avail * 0.19;
  ctx.fillText(RUBRIC, rx, H * RUBRIC_ROW);
  let w = ctx.measureText(RUBRIC).width;
  boxes.push({ x: rx - w, y: H * RUBRIC_ROW - size, w, h: size * 1.35, label: "ar 0.99" });

  AR_LINES.forEach((line, i) => {
    const y = H * (ROW0 + i * ROW_STEP);
    size = fitFont(ctx, line, avail * 0.97, 30 * s, (z) => `600 ${z}px ${f.arabic}`, 1.2);
    ctx.fillStyle = "#EEF1F5";
    ctx.fillText(line, W - mR, y);
    w = ctx.measureText(line).width;
    boxes.push({ x: W - mR - w, y: y - size, w, h: size * 1.35, label: `ar ${(0.95 + rnd() * 0.045).toFixed(2)}` });
  });

  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.font = `400 ${19 * s}px ${f.mono}`;
  ctx.fillStyle = "#7CC4CF";
  LATIN_LINES.forEach((l, i) => {
    ctx.fillText(l, mL, H * LATIN_ROWS[i]);
    const lw = ctx.measureText(l).width;
    boxes.push({ x: mL, y: H * LATIN_ROWS[i] - 19 * s, w: lw, h: 19 * s * 1.4, label: `la ${(0.9 + rnd() * 0.06).toFixed(2)}` });
  });
  return boxes;
}

function drawBoxes(ctx: CanvasRenderingContext2D, W: number, f: Fonts, boxes: { x: number; y: number; w: number; h: number; label: string }[]) {
  const s = W / 768;
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.lineWidth = 1.2 * s;
  ctx.font = `400 ${10 * s}px ${f.mono}`;
  for (const b of boxes) {
    ctx.strokeStyle = "rgba(124,196,207,0.38)";
    ctx.strokeRect(b.x - 4 * s, b.y - 2 * s, b.w + 8 * s, b.h);
    ctx.fillStyle = "rgba(124,196,207,0.7)";
    ctx.fillText(b.label, Math.max(4 * s, b.x - 4 * s - 52 * s), b.y + b.h * 0.55);
  }
}

/** Sample opaque pixels into uv pairs (u, vTop), sorted top-to-bottom. */
function sampleAlpha(ctx: CanvasRenderingContext2D, W: number, H: number, n: number, rnd: () => number, threshold = 110) {
  const data = ctx.getImageData(0, 0, W, H).data;
  const cand: number[] = [];
  const step = 2;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > threshold) cand.push(x / W, y / H);
    }
  }
  const m = cand.length / 2;
  const pick: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (m === 0) {
      pick.push([rnd(), rnd()]);
      continue;
    }
    const k = Math.floor(rnd() * m);
    pick.push([cand[k * 2] + ((rnd() - 0.5) * step) / W, cand[k * 2 + 1] + ((rnd() - 0.5) * step) / H]);
  }
  pick.sort((a, b) => a[1] - b[1]);
  const out = new Float32Array(n * 2);
  pick.forEach((p, i) => {
    out[i * 2] = p[0];
    out[i * 2 + 1] = p[1];
  });
  return out;
}

const PX_PER_UNIT = 280;

export type BlockKind = "title" | "author" | "date" | "table" | "references" | "footnote";
export const BLOCKS: {
  kind: BlockKind;
  label: string;
  w: number;
  h: number;
  start: [number, number];
  target: [number, number, number];
  conf: string;
}[] = [
  { kind: "title", label: "Title", w: 2.6, h: 0.62, start: [0.35, 1.45], target: [-1.35, 1.75, 0.5], conf: "0.99" },
  { kind: "author", label: "Author", w: 1.25, h: 0.62, start: [0.6, 0.95], target: [-2.0, 0.9, 0.25], conf: "0.93" },
  { kind: "date", label: "Date", w: 1.25, h: 0.62, start: [-0.7, 0.95], target: [-0.7, 0.9, 0.25], conf: "0.96" },
  { kind: "table", label: "Table", w: 2.3, h: 1.5, start: [0.1, 0.1], target: [1.45, 1.25, 0.0], conf: "0.91" },
  { kind: "references", label: "References", w: 2.3, h: 1.0, start: [0.0, -0.75], target: [1.45, -0.25, -0.25], conf: "0.95" },
  { kind: "footnote", label: "Footnote", w: 2.6, h: 0.62, start: [-0.6, -1.2], target: [-1.35, 0.1, 0.0], conf: "0.88" },
];

function drawBlock(b: (typeof BLOCKS)[number], f: Fonts, scale: number) {
  const ppu = PX_PER_UNIT * scale;
  const W = b.w * ppu;
  const H = b.h * ppu;
  const { c, ctx } = makeCanvas(W, H);
  const s = ppu / PX_PER_UNIT;
  const pad = 14 * s;

  roundRect(ctx, 2, 2, W - 4, H - 4, 12 * s);
  ctx.fillStyle = "rgba(13,22,40,0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(203,175,126,0.6)";
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  // tag pill
  ctx.font = `500 ${13 * s}px ${f.mono}`;
  const tag = b.label.toUpperCase();
  const tw = ctx.measureText(tag).width + 16 * s;
  roundRect(ctx, pad, pad, tw, 22 * s, 6 * s);
  ctx.fillStyle = "#CBAF7E";
  ctx.fill();
  ctx.fillStyle = "#060B18";
  ctx.textBaseline = "middle";
  ctx.fillText(tag, pad + 8 * s, pad + 11.5 * s);
  ctx.textAlign = "right";
  ctx.fillStyle = "#7CC4CF";
  ctx.font = `400 ${12 * s}px ${f.mono}`;
  ctx.fillText(`conf ${b.conf}`, W - pad, pad + 11.5 * s);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const arabic = (text: string, size: number, y: number, color = "#F7F8FA") => {
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.font = `600 ${size * s}px ${f.arabic}`;
    ctx.fillStyle = color;
    ctx.fillText(text, W - pad, y);
    ctx.direction = "ltr";
    ctx.textAlign = "left";
  };
  const mono = (text: string, y: number, color = "rgba(154,167,189,0.95)") => {
    ctx.font = `400 ${11.5 * s}px ${f.mono}`;
    ctx.fillStyle = color;
    ctx.fillText(text, pad, y);
  };
  const bar = (x: number, y: number, w: number, color: string) => {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, 6 * s, 3 * s);
    ctx.fill();
  };

  switch (b.kind) {
    case "title":
      arabic(RUBRIC, 26, H - pad - 4 * s);
      mono('lang: "ar" · script: naskh', H - pad - 4 * s);
      break;
    case "author":
      arabic("المؤلف: غير معروف", 19, H * 0.62);
      mono("name: unknown", H - pad + 2 * s);
      break;
    case "date":
      arabic("سنة ٧٤٥ هـ", 21, H * 0.62);
      mono("745 AH ≈ 1344 CE", H - pad + 2 * s);
      break;
    case "table": {
      const top = pad + 36 * s;
      const rows = 4;
      const cols = 4;
      const gw = W - pad * 2;
      const gh = H - top - pad - 22 * s;
      ctx.strokeStyle = "rgba(124,196,207,0.35)";
      ctx.lineWidth = 1 * s;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(pad, top + (gh * r) / rows);
        ctx.lineTo(pad + gw, top + (gh * r) / rows);
        ctx.stroke();
      }
      for (let k = 0; k <= cols; k++) {
        ctx.beginPath();
        ctx.moveTo(pad + (gw * k) / cols, top);
        ctx.lineTo(pad + (gw * k) / cols, top + gh);
        ctx.stroke();
      }
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const cw = gw / cols;
          const len = cw * (0.35 + ((r * 7 + k * 3) % 5) * 0.1);
          bar(pad + k * cw + 8 * s, top + (gh * (r + 0.5)) / rows - 3 * s, len, r === 0 ? "rgba(124,196,207,0.8)" : "rgba(227,207,166,0.55)");
        }
      }
      mono("rows: 4 · cols: 4 · header: yes", H - pad + 2 * s);
      break;
    }
    case "references": {
      const top = pad + 44 * s;
      for (let i = 0; i < 3; i++) {
        const y = top + i * 22 * s;
        ctx.font = `400 ${12 * s}px ${f.mono}`;
        ctx.fillStyle = "#7CC4CF";
        ctx.fillText(`[${i + 1}]`, pad, y + 5 * s);
        bar(pad + 34 * s, y, W * (0.45 + i * 0.08), "rgba(227,207,166,0.55)");
        bar(pad + 34 * s + W * (0.47 + i * 0.08), y, W * 0.12, "rgba(154,167,189,0.4)");
      }
      mono("refs: 3 · resolved: 3", H - pad + 2 * s);
      break;
    }
    case "footnote":
      arabic("انظر الباب الثاني من هذا الكتاب", 17, H * 0.64, "#E3CFA6");
      mono("anchor: line 7", H - pad + 2 * s);
      break;
  }
  return c;
}

export const CARD_W = 2.0;
export const CARD_H = 1.2;

function drawCard(src: (typeof DEMO.sources)[number], f: Fonts, scale: number) {
  const ppu = PX_PER_UNIT * 1.15 * scale;
  const W = CARD_W * ppu;
  const H = CARD_H * ppu;
  const s = ppu / PX_PER_UNIT;
  const { c, ctx } = makeCanvas(W, H);
  const pad = 16 * s;
  roundRect(ctx, 2, 2, W - 4, H - 4, 14 * s);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(22,35,58,0.96)");
  g.addColorStop(1, "rgba(10,17,32,0.96)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(124,196,207,0.75)";
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  ctx.textBaseline = "alphabetic";
  ctx.font = `500 ${20 * s}px ${f.mono}`;
  ctx.fillStyle = "#7CC4CF";
  ctx.fillText(`[${src.n}]`, pad, pad + 20 * s);
  ctx.font = `400 ${10 * s}px ${f.mono}`;
  ctx.fillStyle = "rgba(154,167,189,0.9)";
  ctx.textAlign = "right";
  ctx.fillText("SOURCE · ILLUSTRATIVE", W - pad, pad + 16 * s);
  ctx.textAlign = "left";

  ctx.font = `400 ${24 * s}px ${f.serif}`;
  ctx.fillStyle = "#F7F8FA";
  ctx.fillText(src.title, pad, pad + 58 * s);
  ctx.font = `400 ${11 * s}px ${f.mono}`;
  ctx.fillStyle = "rgba(154,167,189,0.95)";
  ctx.fillText(src.meta, pad, pad + 80 * s);

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.font = `400 ${19 * s}px ${f.arabic}`;
  ctx.fillStyle = "#E3CFA6";
  ctx.fillText(`«${src.snippet}»`, W - pad, pad + 120 * s);
  ctx.direction = "ltr";
  ctx.textAlign = "left";

  const by = H - pad - 6 * s;
  ctx.fillStyle = "rgba(124,196,207,0.18)";
  roundRect(ctx, pad, by, W - pad * 2 - 90 * s, 5 * s, 2.5 * s);
  ctx.fill();
  ctx.fillStyle = "#4C9DAB";
  roundRect(ctx, pad, by, (W - pad * 2 - 90 * s) * src.relevance, 5 * s, 2.5 * s);
  ctx.fill();
  ctx.font = `400 ${11 * s}px ${f.mono}`;
  ctx.fillStyle = "#7CC4CF";
  ctx.textAlign = "right";
  ctx.fillText(`rel ${src.relevance.toFixed(2)}`, W - pad, by + 6 * s);
  return c;
}

export type StoryAssets = {
  parch: CanvasTexture;
  ink: CanvasTexture;
  crisp: CanvasTexture;
  composite: CanvasTexture;
  inkSamples: Float32Array;
  crispSamples: Float32Array;
  blocks: CanvasTexture[];
  cards: CanvasTexture[];
  dispose: () => void;
};

export async function createStoryAssets(isMobile: boolean, particleCount: number): Promise<StoryAssets> {
  const f = await loadFonts();
  const rnd = mulberry32(42);
  const W = isMobile ? 576 : 768;
  const H = Math.round((W * PAGE_H) / PAGE_W);

  const parch = makeCanvas(W, H);
  drawParchment(parch.ctx, W, H, rnd);
  const ink = makeCanvas(W, H);
  drawInk(ink.ctx, W, H, f, rnd);
  const inkSamples = sampleAlpha(ink.ctx, W, H, particleCount, rnd, 120);

  const crisp = makeCanvas(W, H);
  const boxes = drawCrisp(crisp.ctx, W, H, f, rnd);
  const crispSamples = sampleAlpha(crisp.ctx, W, H, particleCount, rnd, 140);
  drawBoxes(crisp.ctx, W, f, boxes);

  const comp = makeCanvas(256, Math.round((256 * PAGE_H) / PAGE_W));
  comp.ctx.drawImage(parch.c, 0, 0, comp.c.width, comp.c.height);
  comp.ctx.drawImage(ink.c, 0, 0, comp.c.width, comp.c.height);

  const scale = isMobile ? 0.75 : 1;
  const tex = (c: HTMLCanvasElement, aniso = 4) => {
    const t = new CanvasTexture(c);
    t.anisotropy = aniso;
    t.needsUpdate = true;
    return t;
  };
  const all: CanvasTexture[] = [];
  const keep = (t: CanvasTexture) => {
    all.push(t);
    return t;
  };

  return {
    parch: keep(tex(parch.c)),
    ink: keep(tex(ink.c)),
    crisp: keep(tex(crisp.c)),
    composite: keep(tex(comp.c, 1)),
    inkSamples,
    crispSamples,
    blocks: BLOCKS.map((b) => keep(tex(drawBlock(b, f, scale)))),
    cards: DEMO.sources.map((s) => keep(tex(drawCard(s, f, scale)))),
    dispose: () => all.forEach((t) => t.dispose()),
  };
}
