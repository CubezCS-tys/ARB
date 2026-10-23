"use client";

import { motion, type Transition } from "framer-motion";
import { useId } from "react";
import type { capabilities } from "@/content/site";

export type CapabilityId = (typeof capabilities)[number]["id"];

const GOLD = "#CBAF7E";
const GOLD_LIGHT = "#E3CFA6";
const TEAL = "#4C9DAB";
const TEAL_LIGHT = "#7CC4CF";
const PAPER = "#F7F8FA";
const SLATE = "#22324F";
const NAVY = "#16233A";
const MIST = "#9AA7BD";

const EASE = [0.22, 1, 0.36, 1] as const;

type VisualProps = { reduce: boolean };

/** A looping transition, or an instant one under reduced motion. */
function loop(reduce: boolean, duration: number, times?: number[], delay = 0): Transition {
  if (reduce) return { duration: 0 };
  return { duration, times, delay, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 };
}

/** Keyframes normally; the resting value under reduced motion. */
function kf<T>(reduce: boolean, frames: T[], rest: T): T | T[] {
  return reduce ? rest : frames;
}

/* ------------------------------------------------------------------ */
/* 01 · Arabic RAG: a query beam lands on the top-k text chunks        */
/* ------------------------------------------------------------------ */
function RagVisual({ reduce }: VisualProps) {
  const chunks = [0, 1, 2, 3, 4, 5];
  const hits = [1, 3, 4];
  const scores = ["0.94", "0.88", "0.81"];
  const D = 3.6;
  return (
    <>
      {/* query */}
      <rect x="10" y="68" width="66" height="24" rx="12" fill={NAVY} stroke={TEAL} strokeWidth="1" />
      <text x="43" y="84" textAnchor="middle" fontSize="11" fill={PAPER} fontFamily="var(--font-arabic), serif" direction="rtl">
        سؤال ؟
      </text>
      <motion.circle
        cx="76"
        cy="80"
        r="3"
        fill={TEAL_LIGHT}
        animate={{ opacity: kf(reduce, [0.4, 1, 0.4], 1) }}
        transition={loop(reduce, 1.4)}
      />
      {chunks.map((i) => {
        const y = 10 + i * 24;
        const hitIndex = hits.indexOf(i);
        const isHit = hitIndex >= 0;
        const start = 0.12 + hitIndex * 0.12;
        return (
          <g key={i}>
            {isHit && (
              <motion.path
                d={`M76 80 C 110 80, 120 ${y + 7}, 150 ${y + 7}`}
                fill="none"
                stroke={TEAL_LIGHT}
                strokeWidth="1.2"
                initial={false}
                animate={{
                  pathLength: kf(reduce, [0, 0, 1, 1, 1], 1),
                  opacity: kf(reduce, [0, 1, 1, 1, 0], 0.7),
                }}
                transition={loop(reduce, D, [0, start, start + 0.14, 0.85, 1])}
              />
            )}
            <motion.rect
              x="150"
              y={y}
              width="84"
              height="14"
              rx="3"
              strokeWidth="1"
              initial={false}
              animate={
                isHit
                  ? {
                      fill: kf(reduce, [SLATE, SLATE, "rgba(203,175,126,0.22)", "rgba(203,175,126,0.22)", SLATE], "rgba(203,175,126,0.22)"),
                      stroke: kf(reduce, ["rgba(154,167,189,0.2)", "rgba(154,167,189,0.2)", GOLD, GOLD, "rgba(154,167,189,0.2)"], GOLD),
                    }
                  : { fill: SLATE, stroke: "rgba(154,167,189,0.2)" }
              }
              transition={loop(reduce, D, [0, start + 0.12, start + 0.2, 0.85, 1])}
            />
            {/* right-aligned "Arabic" text lines */}
            <rect x={230 - (36 + (i % 3) * 10)} y={y + 4} width={36 + (i % 3) * 10} height="2" rx="1" fill={MIST} opacity="0.5" />
            <rect x={230 - (22 + (i % 2) * 14)} y={y + 8.5} width={22 + (i % 2) * 14} height="2" rx="1" fill={MIST} opacity="0.3" />
            {isHit && (
              <motion.text
                x="258"
                y={y + 10}
                fontSize="7"
                fill={GOLD_LIGHT}
                fontFamily="var(--font-geist-mono), monospace"
                textAnchor="end"
                initial={false}
                animate={{ opacity: kf(reduce, [0, 0, 1, 1, 0], 1) }}
                transition={loop(reduce, D, [0, start + 0.18, start + 0.24, 0.85, 1])}
              >
                {scores[hitIndex]}
              </motion.text>
            )}
          </g>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 02 · OCR: a scanline sweeps right-to-left; blur becomes crisp glyph */
/* ------------------------------------------------------------------ */
function OcrVisual({ reduce }: VisualProps) {
  const uid = useId().replace(/:/g, "");
  const D = 3.4;
  const times = [0, 0.1, 0.6, 0.88, 1];
  return (
    <>
      <defs>
        <filter id={`blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#8C7650" />
        </linearGradient>
        <mask id={`reveal-${uid}`}>
          {/* mirrored so the reveal grows from the right edge (RTL reading order) */}
          <g transform="matrix(-1 0 0 1 260 0)">
            <motion.rect
              x="0"
              y="0"
              height="160"
              fill="white"
              initial={false}
              animate={{ width: kf(reduce, [0, 0, 260, 260, 0], 260) }}
              transition={loop(reduce, D, times)}
            />
          </g>
        </mask>
      </defs>
      {/* page */}
      <rect x="30" y="14" width="200" height="132" rx="4" fill={NAVY} stroke="rgba(154,167,189,0.18)" />
      {/* degraded glyph */}
      <text
        x="130"
        y="100"
        textAnchor="middle"
        fontSize="64"
        fill={PAPER}
        opacity="0.35"
        filter={`url(#blur-${uid})`}
        fontFamily="var(--font-arabic), serif"
        direction="rtl"
      >
        علم
      </text>
      {/* recognised glyph */}
      <g mask={`url(#reveal-${uid})`}>
        <text
          x="130"
          y="100"
          textAnchor="middle"
          fontSize="64"
          fill={`url(#gold-${uid})`}
          fontFamily="var(--font-arabic), serif"
          direction="rtl"
        >
          علم
        </text>
        <text x="130" y="128" textAnchor="middle" fontSize="9" fill={MIST} fontFamily="var(--font-geist-mono), monospace" letterSpacing="2">
          ʿILM · KNOWLEDGE
        </text>
      </g>
      {/* scanline */}
      <motion.g
        initial={false}
        animate={{ x: kf(reduce, [260, 260, 0, 0, 260], 0), opacity: kf(reduce, [0, 1, 1, 0, 0], 0) }}
        transition={loop(reduce, D, times)}
      >
        <rect x="-14" y="14" width="14" height="132" fill="rgba(76,157,171,0.12)" />
        <line x1="0" y1="10" x2="0" y2="150" stroke={TEAL_LIGHT} strokeWidth="1.5" />
      </motion.g>
      <motion.text
        x="226"
        y="28"
        textAnchor="end"
        fontSize="7"
        fill={TEAL_LIGHT}
        fontFamily="var(--font-geist-mono), monospace"
        initial={false}
        animate={{ opacity: kf(reduce, [0, 0, 0, 1, 0], 1) }}
        transition={loop(reduce, D, [0, 0.1, 0.58, 0.66, 1])}
      >
        conf 0.98 · ar
      </motion.text>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 03 · Metadata: loose fields snap into a structured record           */
/* ------------------------------------------------------------------ */
function MetadataVisual({ reduce }: VisualProps) {
  const fields = [
    { k: "title", v: "تاريخ العلوم", arabic: true, from: [-118, 38] },
    { k: "author", v: "Surname, A.", arabic: false, from: [-104, -30] },
    { k: "date", v: "1952", arabic: false, from: [-126, 6] },
    { k: "subject", v: "History of science", arabic: false, from: [-96, -66] },
  ];
  const D = 3.8;
  return (
    <>
      {/* record card */}
      <rect x="128" y="10" width="122" height="140" rx="6" fill={NAVY} stroke="rgba(203,175,126,0.35)" />
      <text x="138" y="26" fontSize="7" fill={GOLD} fontFamily="var(--font-geist-mono), monospace" letterSpacing="1">
        RECORD.JSON
      </text>
      <line x1="138" y1="32" x2="240" y2="32" stroke="rgba(203,175,126,0.2)" />
      {fields.map((f, i) => {
        const y = 42 + i * 26;
        const s = 0.1 + i * 0.08;
        return (
          <g key={f.k}>
            {/* empty slot */}
            <rect x="136" y={y} width="106" height="20" rx="3" fill="none" stroke="rgba(154,167,189,0.18)" strokeDasharray="2 3" />
            <motion.g
              initial={false}
              animate={{
                x: kf(reduce, [f.from[0], f.from[0], 0, 0, 0], 0),
                y: kf(reduce, [f.from[1], f.from[1], 0, 0, 0], 0),
                opacity: kf(reduce, [0, 1, 1, 1, 0], 1),
              }}
              transition={{
                ...loop(reduce, D, [0, s, s + 0.16, 0.88, 1]),
                ease: reduce ? undefined : ["easeOut", "easeInOut", "backOut", "linear"],
              }}
            >
              <rect x="136" y={y} width="106" height="20" rx="3" fill={SLATE} stroke={TEAL} strokeOpacity="0.6" />
              <text x="142" y={y + 13} fontSize="6.5" fill={TEAL_LIGHT} fontFamily="var(--font-geist-mono), monospace">
                {f.k}
              </text>
              <text
                x="236"
                y={y + 13.5}
                fontSize={f.arabic ? 9 : 7.5}
                fill={PAPER}
                textAnchor="end"
                fontFamily={f.arabic ? "var(--font-arabic), serif" : "var(--font-inter), sans-serif"}
                direction={f.arabic ? "rtl" : "ltr"}
              >
                {f.v}
              </text>
            </motion.g>
          </g>
        );
      })}
      <motion.circle
        cx="240"
        cy="22"
        r="3"
        fill={GOLD}
        initial={false}
        animate={{ opacity: kf(reduce, [0, 0, 1, 1, 0], 1) }}
        transition={loop(reduce, D, [0, 0.5, 0.56, 0.88, 1])}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 04 · Parsing: one page splits into labelled layout regions          */
/* ------------------------------------------------------------------ */
function ParsingVisual({ reduce }: VisualProps) {
  const boxes = [
    { label: "heading", x: 82, y: 20, w: 96, h: 12, dx: 0, dy: -6, lines: 1 },
    { label: "col 2", x: 82, y: 38, w: 45, h: 58, dx: -16, dy: 0, lines: 6 },
    { label: "col 1", x: 133, y: 38, w: 45, h: 58, dx: 16, dy: 0, lines: 6 },
    { label: "table", x: 82, y: 102, w: 96, h: 22, dx: 0, dy: 6, lines: 0 },
    { label: "footnote", x: 82, y: 130, w: 96, h: 9, dx: 0, dy: 12, lines: 1 },
  ];
  const D = 3.6;
  const times = [0, 0.2, 0.42, 0.82, 1];
  return (
    <>
      <motion.rect
        x="74"
        y="12"
        width="112"
        height="136"
        rx="3"
        fill={NAVY}
        stroke="rgba(154,167,189,0.25)"
        initial={false}
        animate={{ opacity: kf(reduce, [1, 1, 0.25, 0.25, 1], 0.25) }}
        transition={loop(reduce, D, times)}
      />
      {boxes.map((b, i) => (
        <motion.g
          key={b.label}
          initial={false}
          animate={{ x: kf(reduce, [0, 0, b.dx, b.dx, 0], b.dx), y: kf(reduce, [0, 0, b.dy, b.dy, 0], b.dy) }}
          transition={loop(reduce, D, times)}
        >
          <motion.rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="2"
            fill="rgba(76,157,171,0.06)"
            strokeWidth="1"
            initial={false}
            animate={{ stroke: kf(reduce, ["rgba(76,157,171,0)", "rgba(76,157,171,0)", TEAL, TEAL, "rgba(76,157,171,0)"], TEAL) }}
            transition={loop(reduce, D, times)}
          />
          {Array.from({ length: b.lines }).map((_, l) => (
            <rect key={l} x={b.x + 4} y={b.y + 4 + l * 9} width={b.w - 8 - (l % 3) * 6} height="2" rx="1" fill={MIST} opacity="0.35" />
          ))}
          {b.label === "table" &&
            [0, 1, 2].map((c) => <line key={c} x1={b.x + 24 + c * 24} y1={b.y + 2} x2={b.x + 24 + c * 24} y2={b.y + b.h - 2} stroke={MIST} strokeOpacity="0.35" />)}
          {b.label === "table" && <line x1={b.x + 2} y1={b.y + 8} x2={b.x + b.w - 2} y2={b.y + 8} stroke={MIST} strokeOpacity="0.35" />}
          <motion.g
            initial={false}
            animate={{ opacity: kf(reduce, [0, 0, 1, 1, 0], 1) }}
            transition={loop(reduce, D, times)}
          >
            <circle cx={b.x + b.w + (b.dx < 0 ? -b.w - 8 : 8)} cy={b.y + Math.min(6, b.h / 2)} r="5" fill={GOLD} />
            <text
              x={b.x + b.w + (b.dx < 0 ? -b.w - 8 : 8)}
              y={b.y + Math.min(6, b.h / 2) + 2.4}
              fontSize="6.5"
              textAnchor="middle"
              fill="#060B18"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {i + 1}
            </text>
            <text
              x={b.dx < 0 ? b.x - 16 : b.x + b.w + 16}
              y={b.y + Math.min(6, b.h / 2) + 2.4}
              fontSize="6.5"
              textAnchor={b.dx < 0 ? "end" : "start"}
              fill={TEAL_LIGHT}
              fontFamily="var(--font-geist-mono), monospace"
            >
              {b.label}
            </text>
          </motion.g>
        </motion.g>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 05 · Deep research: a search tree branches; one trail becomes gold  */
/* ------------------------------------------------------------------ */
function ResearchVisual({ reduce }: VisualProps) {
  const root: [number, number] = [18, 80];
  const l1: [number, number][] = [
    [78, 34],
    [78, 80],
    [78, 126],
  ];
  const l2: [number, number][][] = [
    [
      [142, 18],
      [142, 48],
    ],
    [
      [142, 70],
      [142, 92],
    ],
    [
      [142, 114],
      [142, 142],
    ],
  ];
  const report: [number, number] = [214, 80];
  // evidence trail: l1[0] -> l2[0][1] and l1[2] -> l2[2][0] feed the report
  const trail = new Set(["0-1", "2-0"]);
  const curve = (a: [number, number], b: [number, number]) => `M${a[0]} ${a[1]} C ${(a[0] + b[0]) / 2} ${a[1]}, ${(a[0] + b[0]) / 2} ${b[1]}, ${b[0]} ${b[1]}`;
  const D = 4.2;
  const draw = (start: number, gold: boolean, dead = false) => ({
    initial: false as const,
    animate: {
      pathLength: kf(reduce, [0, 0, 1, 1, 1], 1),
      opacity: kf(reduce, [0, 1, 1, dead ? 0.25 : 1, 0], dead ? 0.25 : 1),
    },
    transition: loop(reduce, D, [0, start, start + 0.12, 0.75, 1]),
    stroke: gold ? GOLD : TEAL,
  });
  return (
    <>
      {l1.map((p, i) => {
        const e = draw(0.04, i !== 1, i === 1);
        return <motion.path key={`r${i}`} d={curve(root, p)} fill="none" strokeWidth="1.2" {...e} />;
      })}
      {l2.map((pair, i) =>
        pair.map((p, j) => {
          const onTrail = trail.has(`${i}-${j}`);
          const e = draw(0.2 + i * 0.04, onTrail, !onTrail);
          return <motion.path key={`b${i}${j}`} d={curve(l1[i], p)} fill="none" strokeWidth="1.2" {...e} />;
        }),
      )}
      {[l2[0][1], l2[2][0]].map((p, i) => {
        const e = draw(0.42, true);
        return <motion.path key={`t${i}`} d={curve(p, report)} fill="none" strokeWidth="1.6" {...e} />;
      })}
      {/* nodes */}
      <circle cx={root[0]} cy={root[1]} r="6" fill={TEAL} />
      <circle cx={root[0]} cy={root[1]} r="10" fill="none" stroke={TEAL} strokeOpacity="0.4" />
      {l1.map((p, i) => (
        <circle key={`n1${i}`} cx={p[0]} cy={p[1]} r="4" fill={NAVY} stroke={i === 1 ? MIST : TEAL_LIGHT} strokeWidth="1.2" />
      ))}
      {l2.flatMap((pair, i) =>
        pair.map((p, j) => (
          <circle key={`n2${i}${j}`} cx={p[0]} cy={p[1]} r="3.2" fill={trail.has(`${i}-${j}`) ? GOLD : NAVY} stroke={trail.has(`${i}-${j}`) ? GOLD : MIST} strokeWidth="1" />
        )),
      )}
      <motion.g
        initial={false}
        animate={{ opacity: kf(reduce, [0, 0, 1, 1, 0], 1), scale: kf(reduce, [0.8, 0.8, 1, 1, 0.8], 1) }}
        transition={loop(reduce, D, [0, 0.5, 0.6, 0.85, 1])}
        style={{ transformOrigin: `${report[0] + 16}px ${report[1]}px` }}
      >
        <rect x={report[0]} y={report[1] - 20} width="32" height="40" rx="3" fill={NAVY} stroke={GOLD} />
        {[0, 1, 2, 3].map((l) => (
          <rect key={l} x={report[0] + 5} y={report[1] - 13 + l * 7} width={22 - (l % 2) * 6} height="2" rx="1" fill={GOLD_LIGHT} opacity="0.7" />
        ))}
        <text x={report[0] + 16} y={report[1] + 32} fontSize="6.5" textAnchor="middle" fill={GOLD} fontFamily="var(--font-geist-mono), monospace">
          report
        </text>
      </motion.g>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 06 · Citations: references link into a small influence graph        */
/* ------------------------------------------------------------------ */
function CitationsVisual({ reduce }: VisualProps) {
  const nodes: [number, number, number][] = [
    [130, 80, 7], // the work everyone builds on
    [62, 40, 3.5],
    [52, 112, 3],
    [96, 140, 3.5],
    [176, 128, 3],
    [210, 76, 4],
    [184, 28, 3.5],
    [116, 22, 3],
    [24, 72, 2.5],
  ];
  const edges: [number, number][] = [
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [6, 0],
    [7, 0],
    [8, 1],
    [8, 2],
    [6, 5],
    [4, 5],
    [7, 1],
  ];
  const D = 4;
  return (
    <>
      {edges.map(([a, b], i) => {
        const s = 0.04 + i * 0.035;
        const toCore = b === 0;
        return (
          <motion.line
            key={i}
            x1={nodes[a][0]}
            y1={nodes[a][1]}
            x2={nodes[b][0]}
            y2={nodes[b][1]}
            stroke={toCore ? GOLD : TEAL}
            strokeOpacity={toCore ? 0.75 : 0.55}
            strokeWidth="1"
            initial={false}
            animate={{ pathLength: kf(reduce, [0, 0, 1, 1, 0], 1) }}
            transition={loop(reduce, D, [0, s, s + 0.12, 0.85, 1])}
          />
        );
      })}
      {/* influence ripple */}
      {!reduce && (
        <motion.circle
          cx={nodes[0][0]}
          cy={nodes[0][1]}
          fill="none"
          stroke={GOLD}
          initial={{ r: 7, opacity: 0.8 }}
          animate={{ r: [7, 34], opacity: [0.7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: EASE, delay: 0.8 }}
        />
      )}
      {nodes.map(([x, y, r], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={i === 0 ? GOLD : NAVY}
          stroke={i === 0 ? GOLD_LIGHT : TEAL_LIGHT}
          strokeWidth="1.2"
          initial={false}
          animate={{ scale: kf(reduce, [0, 0, 1, 1, 0], 1) }}
          transition={loop(reduce, D, [0, 0.02 + i * 0.03, 0.1 + i * 0.03, 0.88, 1])}
        />
      ))}
      <text x={nodes[0][0]} y={nodes[0][1] + 22} fontSize="6.5" textAnchor="middle" fill={GOLD} fontFamily="var(--font-geist-mono), monospace">
        cited ×7
      </text>
    </>
  );
}

const VISUALS: Record<CapabilityId, (p: VisualProps) => JSX.Element> = {
  rag: RagVisual,
  ocr: OcrVisual,
  metadata: MetadataVisual,
  parsing: ParsingVisual,
  research: ResearchVisual,
  citations: CitationsVisual,
};

const LABELS: Record<CapabilityId, string> = {
  rag: "Illustration: a query beam retrieving the three most relevant Arabic text passages",
  ocr: "Illustration: a scanline turning a blurred Arabic word into crisp recognised text",
  metadata: "Illustration: loose metadata fields snapping into a structured record",
  parsing: "Illustration: a page separating into labelled layout regions in reading order",
  research: "Illustration: a branching search tree whose evidence trail feeds a report",
  citations: "Illustration: references linking into a citation graph around one influential work",
};

export default function CapabilityVisual({ id, reduce }: { id: CapabilityId; reduce: boolean }) {
  const Visual = VISUALS[id];
  return (
    <svg viewBox="0 0 260 160" className="h-full w-full" role="img" aria-label={LABELS[id]}>
      <Visual reduce={reduce} />
    </svg>
  );
}
