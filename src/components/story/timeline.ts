/**
 * Scroll timeline for the "From ink to insight" story.
 * Everything (3D scene and DOM overlay) is a pure function of one number:
 * p in [0, 1], the progress through the pinned section.
 */

export const CHAPTERS = 5;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (x: number) => x * x * (3 - 2 * x);
/** Linear 0..1 ramp between a and b. */
export const lin = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** Smoothstepped 0..1 ramp between a and b. */
export const seg = (p: number, a: number, b: number) => smooth(lin(p, a, b));
/** 0 -> 1 -> 0 window with soft edges. */
export const windowFade = (p: number, a: number, b: number, edge = 0.02) =>
  seg(p, a, a + edge) * (1 - seg(p, b - edge, b));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Key moments, as fractions of the whole pinned scroll. */
export const T = {
  scan: [0.22, 0.37],
  pageOut: [0.38, 0.48],
  archiveOut: [0.36, 0.48],
  blocksIn: [0.385, 0.425],
  crispOut: [0.4, 0.45],
  burst: [0.41, 0.465],
  layout: [0.46, 0.56],
  collapse: [0.6, 0.665],
  reveal: [0.62, 0.78],
  question: [0.8, 0.84],
  questionEn: [0.83, 0.855],
  beam: [0.85, 0.89],
  cards: [0.885, 0.93],
  answer: [0.925, 0.955],
} as const;

/** Where the progress-rail buttons jump to (centre of each chapter, end of V). */
export const JUMP = [0.03, 0.31, 0.53, 0.73, 0.975];

export function chapterAt(p: number) {
  return Math.min(CHAPTERS - 1, Math.max(0, Math.floor(p * CHAPTERS)));
}

/** Overlay text opacity for chapter i: sequential cross-fade, no overlap. */
export function chapterOpacity(p: number, i: number) {
  const u = p * CHAPTERS - i;
  const fadeIn = i === 0 ? 1 : seg(u, 0.02, 0.14);
  const fadeOut = i === CHAPTERS - 1 ? 1 : 1 - seg(u, 0.86, 0.98);
  return fadeIn * fadeOut;
}

type V3 = [number, number, number];
/** Camera keyframes. `shift` slides the composition sideways on desktop so the
 *  page sits clear of the chapter copy (bottom-left). */
export const CAMERA_KEYS: { p: number; pos: V3; look: V3; shift: number }[] = [
  { p: 0.0, pos: [1.1, 0.6, 7.6], look: [0.2, -0.15, 0], shift: -0.9 },
  { p: 0.16, pos: [0.25, 0.2, 6.0], look: [0, 0, 0], shift: -0.9 },
  { p: 0.24, pos: [0, 0.05, 5.5], look: [0, 0.05, 0], shift: -0.9 },
  { p: 0.37, pos: [0.35, 0.25, 5.8], look: [0, 0.15, 0], shift: -0.9 },
  { p: 0.45, pos: [-1.0, 1.0, 7.4], look: [0, 0.5, 0], shift: -0.4 },
  { p: 0.58, pos: [-1.35, 1.2, 7.8], look: [0, 0.55, 0], shift: -0.4 },
  { p: 0.645, pos: [0, 0.6, 9.5], look: [0, 0, 0], shift: 0 },
  { p: 0.78, pos: [5.2, 3.6, 21.5], look: [0, 0, 0], shift: 0 },
  { p: 0.845, pos: [0, 0.9, 17.5], look: [0, 0.45, 0], shift: 0 },
  { p: 1.0, pos: [0, 0.9, 17.2], look: [0, 0.45, 0], shift: 0 },
];

/** Scripted demo content for chapter V (clearly labelled as illustrative in the UI). */
export const DEMO = {
  questionAr: "ما أقدم المصادر التي تناولت أنظمة الري في الأندلس؟",
  questionEn: "What are the earliest sources on irrigation systems in al-Andalus?",
  answer: [
    { text: "The earliest discussions appear in agronomy treatises, which set out how water was shared between fields", cite: 1 },
    { text: "Those rules are later cited in a legal compilation on irrigation channels", cite: 2 },
    { text: "and a geographical survey describes the canals still in use", cite: 3 },
  ],
  sources: [
    { n: 1, title: "Agronomy treatise", meta: "fol. 12r · manuscript", snippet: "وتقسم المياه بين الحقول بالنوبة", relevance: 0.94 },
    { n: 2, title: "Legal compilation", meta: "vol. 2, p. 118 · print", snippet: "في أحكام السواقي والشرب", relevance: 0.89 },
    { n: 3, title: "Geographical survey", meta: "ch. 4 · scanned edition", snippet: "وفي أرضها أنهار وسواق كثيرة", relevance: 0.86 },
  ],
} as const;

/** Shared, mutable per-frame clock read by every scene part. */
export type StoryClock = { p: number; t: number };
