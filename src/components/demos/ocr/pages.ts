/**
 * Sample pages for the "Read the page" OCR demo, plus a tiny text layout engine.
 * All archives, shelfmarks and texts are INVENTED for illustration.
 */

export const PW = 480;
export const PH = 600;

export type FontKind = "arabic" | "display" | "book" | "italic";
export type BlockKind = "header" | "title" | "body" | "margin" | "catchword" | "footnote" | "folio";

export type Block = {
  id: string;
  kind: BlockKind;
  script: "ar" | "lat";
  font: FontKind;
  size: number;
  lh: number;
  x: number;
  y: number;
  w: number;
  rot?: number;
  align?: "start" | "center" | "justify";
  indent?: number;
  ink?: string;
  text: string;
};

export type Stain = { x: number; y: number; r: number };

export type Page = {
  id: "ar" | "lat" | "mixed";
  label: string;
  caption: string;
  sweep: "ltr" | "rtl";
  seed: number;
  skew: number;
  stains: Stain[];
  blocks: Block[];
};

export const PAGES: Page[] = [
  {
    id: "ar",
    label: "Arabic",
    caption: "Fictional manuscript · Naskh · fol. 4r",
    sweep: "rtl",
    seed: 17,
    skew: -0.9,
    stains: [
      { x: 330, y: 300, r: 64 },
      { x: 128, y: 468, r: 46 },
      { x: 430, y: 88, r: 30 },
    ],
    blocks: [
      { id: "hd", kind: "header", script: "lat", font: "display", size: 10.5, lh: 14, x: 40, y: 24, w: 400, align: "center", ink: "#4a3a5c", text: "VALLEY ARCHIVE · MS. AR. 17 · FOL. 4r" },
      { id: "ti", kind: "title", script: "ar", font: "arabic", size: 24, lh: 40, x: 48, y: 50, w: 384, align: "center", ink: "#6b2412", text: "الباب الثالث في زراعة القمح" },
      {
        id: "bd",
        kind: "body",
        script: "ar",
        font: "arabic",
        size: 19,
        lh: 37,
        x: 112,
        y: 108,
        w: 322,
        align: "justify",
        text: "ويُزرع القمح في الأرض البعلية بعد أول مطر يبلّ التراب إلى عمق شبر، ولا يُعجَّل به قبل ذلك، فإن البذر في الأرض اليابسة يأكله النمل والطير. وأحسن أوقات الزراعة في البعل من منتصف نونبر إلى آخر دجنبر، فما زُرع بعد ذلك قلّ حبّه وضعفت سنابله. وإن كانت الأرض مالحةً غُسلت بماء المطر قبل الزرع. ومما يُصلح الأرض ويُعيد إليها خصبها أن تُترك سنةً بُوراً، أو تُزرع فيها الفول والحمص فإنها تُقوّي التربة.",
      },
      { id: "mg", kind: "margin", script: "ar", font: "arabic", size: 13, lh: 22, x: 20, y: 214, w: 78, rot: -14, ink: "#5b3a1c", text: "بلغ مقابلةً بالأصل" },
      { id: "cw", kind: "catchword", script: "ar", font: "arabic", size: 14, lh: 20, x: 60, y: 540, w: 80, align: "start", text: "ويُطرح" },
    ],
  },
  {
    id: "lat",
    label: "Latin",
    caption: "Fictional journal · letterpress · p. 41",
    sweep: "ltr",
    seed: 41,
    skew: 0.6,
    stains: [
      { x: 140, y: 250, r: 70 },
      { x: 384, y: 470, r: 50 },
    ],
    blocks: [
      { id: "hd", kind: "header", script: "lat", font: "display", size: 11, lh: 14, x: 40, y: 24, w: 400, align: "center", text: "JOURNAL OF WATER MANAGEMENT STUDIES" },
      { id: "h2", kind: "header", script: "lat", font: "book", size: 9.5, lh: 12, x: 40, y: 44, w: 400, align: "center", text: "VOL. XII — No. 3" },
      { id: "ti", kind: "title", script: "lat", font: "italic", size: 18, lh: 24, x: 56, y: 76, w: 334, align: "center", text: "On the Division of Water by Rotation." },
      {
        id: "bd",
        kind: "body",
        script: "lat",
        font: "book",
        size: 13.5,
        lh: 21,
        x: 56,
        y: 116,
        w: 334,
        align: "justify",
        indent: 16,
        text: "In the valley districts the water of a single channel is divided among the villages by turns, each village holding a fixed number of hours. The hours are measured with a perforated bowl set afloat in a basin; when it sinks, the turn passes to the next village.\nA steward chosen from among the elders keeps the register of turns and settles small disputes upon the spot. In years of scarcity the shares are reckoned not by the extent of land but by the number of trees, so that the orchards may survive until the rains return. The channel itself is cleansed twice in the year, and every holder of a share is bound to labour at it.",
      },
      { id: "mg", kind: "margin", script: "lat", font: "italic", size: 11.5, lh: 15, x: 402, y: 232, w: 64, rot: 7, ink: "#55585e", text: "cf. letter 23, same year?" },
      { id: "fn", kind: "footnote", script: "lat", font: "book", size: 9.5, lh: 13, x: 56, y: 528, w: 334, align: "start", text: "1 From the registers of the Valley Archive, an invented collection transcribed for this demonstration." },
      { id: "fo", kind: "folio", script: "lat", font: "book", size: 10, lh: 12, x: 56, y: 566, w: 334, align: "center", text: "41" },
    ],
  },
  {
    id: "mixed",
    label: "Mixed",
    caption: "Fictional bilingual edition · letter 23",
    sweep: "ltr",
    seed: 23,
    skew: -0.5,
    stains: [
      { x: 360, y: 168, r: 58 },
      { x: 92, y: 404, r: 48 },
    ],
    blocks: [
      { id: "hd", kind: "header", script: "lat", font: "display", size: 11, lh: 14, x: 40, y: 24, w: 400, align: "center", text: "LETTERS FROM THE VALLEY ARCHIVE" },
      { id: "h2", kind: "header", script: "lat", font: "book", size: 9.5, lh: 12, x: 40, y: 44, w: 400, align: "center", text: "No. 23 · Arabic text with English translation" },
      {
        id: "ba",
        kind: "body",
        script: "ar",
        font: "arabic",
        size: 18,
        lh: 34,
        x: 48,
        y: 78,
        w: 384,
        align: "justify",
        text: "إلى الأخ العزيز، سلامٌ عليك، أما بعد: فأما حال الزرع عندنا فقد أمسك المطر هذا العام حتى يبست السنابل قبل أن تمتلئ، وباع الناس مواشيهم بنصف ثمنها. وقد أشار علينا الشيخ بأن نؤخر غرس الزيتون الجديد إلى أن يعود الماء إلى الساقية.",
      },
      {
        id: "be",
        kind: "body",
        script: "lat",
        font: "italic",
        size: 13,
        lh: 20,
        x: 48,
        y: 318,
        w: 384,
        align: "justify",
        text: "To the dear brother, peace be upon you. As for the state of our crops, the rain held off this year until the ears dried before they filled, and people sold their livestock at half price. The elder advised us to delay planting new olive trees until water returns to the channel.",
      },
      { id: "mg", kind: "margin", script: "ar", font: "arabic", size: 13, lh: 22, x: 252, y: 462, w: 176, rot: -5, ink: "#5b3a1c", text: "وصل مع القافلة يوم الخميس" },
      { id: "fo", kind: "folio", script: "lat", font: "book", size: 10, lh: 12, x: 48, y: 566, w: 384, align: "center", text: "23" },
    ],
  },
];

export type Fonts = { arabic: string; display: string };

export function fontFor(b: Block, f: Fonts) {
  switch (b.font) {
    case "arabic":
      return `${b.size}px ${f.arabic}`;
    case "display":
      return `${b.size}px ${f.display}`;
    case "italic":
      return `italic ${b.size}px Georgia, "Times New Roman", serif`;
    default:
      return `${b.size}px Georgia, "Times New Roman", serif`;
  }
}

export type Word = {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  base: number;
  conf: number;
  /** centre in (deskewed) page coordinates */
  cx: number;
  cy: number;
  /** position along the sweep direction, 0..1 */
  u: number;
};

export type Line = {
  key: string;
  order: number;
  block: Block;
  words: Word[];
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  mid: number;
};

export type Laid = { page: Page; lines: Line[] };

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_CONF: Record<BlockKind, number> = {
  header: 0.975,
  title: 0.955,
  body: 0.948,
  margin: 0.8,
  catchword: 0.79,
  footnote: 0.9,
  folio: 0.97,
};

export function toPage(b: Block, lx: number, ly: number) {
  const r = ((b.rot ?? 0) * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: b.x + lx * c - ly * s, y: b.y + lx * s + ly * c };
}

/** Wrap, place and score every word on the page. Client-only (uses a canvas to measure). */
export function layoutPage(page: Page, fonts: Fonts): Laid {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return { page, lines: [] };
  const rng = mulberry32(page.seed * 7919);
  const lines: Line[] = [];
  let order = 0;

  for (const b of page.blocks) {
    ctx.font = fontFor(b, fonts);
    ctx.direction = b.script === "ar" ? "rtl" : "ltr";
    const space = ctx.measureText(" ").width;
    const rtl = b.script === "ar";
    const asc = b.size * (rtl ? 0.98 : 0.8);
    const desc = b.size * (rtl ? 0.52 : 0.26);
    let li = 0;

    for (const para of b.text.split("\n")) {
      const words = para.split(/\s+/).filter(Boolean).map((t) => ({ t, w: ctx.measureText(t).width }));
      const rows: { t: string; w: number }[][] = [];
      let row: { t: string; w: number }[] = [];
      let rowW = 0;
      for (const wd of words) {
        const ind = rows.length === 0 ? (b.indent ?? 0) : 0;
        const next = rowW + (row.length ? space : 0) + wd.w;
        if (row.length && next > b.w - ind) {
          rows.push(row);
          row = [wd];
          rowW = wd.w;
        } else {
          row.push(wd);
          rowW = next;
        }
      }
      if (row.length) rows.push(row);

      rows.forEach((r, ri) => {
        const ind = ri === 0 ? (b.indent ?? 0) : 0;
        const natural = r.reduce((a, w) => a + w.w, 0) + space * (r.length - 1);
        const last = ri === rows.length - 1;
        const justify = b.align === "justify" && !last && r.length > 1;
        const gap = justify ? (b.w - ind - r.reduce((a, w) => a + w.w, 0)) / (r.length - 1) : space;
        const lineW = justify ? b.w - ind : natural;
        let start: number;
        if (b.align === "center") start = (b.w - lineW) / 2;
        else start = rtl ? b.w - ind - lineW : ind;
        const base = b.size + li * b.lh;

        // Place left-to-right in visual order; Arabic words run right-to-left.
        const visual = rtl ? [...r].reverse() : r;
        let cx = start;
        const placed: Word[] = [];
        for (const w of visual) {
          const x0 = cx;
          const x1 = cx + w.w;
          cx = x1 + gap;
          const centre = toPage(b, (x0 + x1) / 2, base - (asc - desc) / 2);
          let conf = BASE_CONF[b.kind] + (rng() - 0.5) * 0.07;
          for (const s of page.stains) {
            const d = Math.hypot(centre.x - s.x, centre.y - s.y) / s.r;
            if (d < 1) conf -= (1 - d) * 0.3;
          }
          const marks = (w.t.match(/[ً-ْ]/g) ?? []).length;
          conf -= marks * 0.012;
          conf = Math.max(0.41, Math.min(0.996, conf));
          placed.push({
            text: w.t,
            x0,
            x1,
            y0: base - asc,
            y1: base + desc,
            base,
            conf,
            cx: centre.x,
            cy: centre.y,
            u: page.sweep === "ltr" ? centre.x / PW : 1 - centre.x / PW,
          });
        }
        const logical = rtl ? [...placed].reverse() : placed;
        lines.push({
          key: `${b.id}-${li}`,
          order: ++order,
          block: b,
          words: logical,
          x0: Math.min(...placed.map((p) => p.x0)),
          x1: Math.max(...placed.map((p) => p.x1)),
          y0: base - asc,
          y1: base + desc,
          mid: base - (asc - desc) / 2,
        });
        li++;
      });
    }
  }
  return { page, lines };
}

export const confColor = (c: number) => (c >= 0.93 ? "#7CC4CF" : c >= 0.82 ? "#CBAF7E" : "#E08A6B");
export const confLabel = (c: number) => (c >= 0.93 ? "high" : c >= 0.82 ? "medium" : "low");
