import { story } from "@/content/site";
import { DEMO } from "./timeline";

/** Reduced-motion version: the five chapters as a stacked sequence with static line illustrations. */

const GOLD = "#CBAF7E";
const GOLD_DIM = "#8C7650";
const TEAL = "#4C9DAB";
const TEAL_L = "#7CC4CF";
const PAPER = "#F7F8FA";

function Lines({ x, y, w, n, step, color, opacity = 1 }: { x: number; y: number; w: number; n: number; step: number; color: string; opacity?: number }) {
  return (
    <g stroke={color} strokeWidth="3" strokeLinecap="round" opacity={opacity}>
      {Array.from({ length: n }, (_, i) => {
        const len = w * (0.72 + ((i * 37) % 23) / 80);
        return <line key={i} x1={x + w - len} y1={y + i * step} x2={x + w} y2={y + i * step} />;
      })}
    </g>
  );
}

function ArchiveArt() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="st-shaft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.28" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points="40,0 120,0 300,300 190,300" fill="url(#st-shaft)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={36} y={238 - i * 7} width={92} height={6} rx={1} fill={GOLD_DIM} opacity={0.35 + i * 0.08} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={290} y={246 - i * 7} width={80} height={6} rx={1} fill={GOLD_DIM} opacity={0.35 + i * 0.1} />
      ))}
      <rect x={140} y={40} width={150} height={200} rx={4} fill="#c9ad7c" opacity="0.9" transform="rotate(-4 215 140)" />
      <g transform="rotate(-4 215 140)">
        <rect x={152} y={52} width={126} height={150} fill="none" stroke="#7c2818" strokeOpacity="0.5" />
        <line x1={190} y1={66} x2={268} y2={66} stroke="#80241a" strokeWidth="4" strokeLinecap="round" />
        <Lines x={162} y={84} w={106} n={8} step={14} color="#2e1c0e" opacity={0.8} />
        <line x1={160} y1={218} x2={220} y2={218} stroke="#4b3720" strokeWidth="2" opacity="0.4" />
      </g>
    </svg>
  );
}

function ReadArt() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <rect x={70} y={50} width={150} height={200} rx={4} fill="#c9ad7c" opacity="0.85" />
      <Lines x={84} y={80} w={122} n={4} step={14} color="#2e1c0e" opacity={0.25} />
      <Lines x={84} y={136} w={122} n={6} step={14} color="#2e1c0e" opacity={0.85} />
      <rect x={60} y={124} width={170} height={3} fill={TEAL_L} />
      <rect x={60} y={110} width={170} height={30} fill={TEAL} opacity="0.12" />
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={i} cx={100 + ((i * 53) % 110) + i * 3} cy={70 + ((i * 29) % 40)} r={1.6} fill={i % 2 ? GOLD : TEAL_L} opacity={0.7} />
      ))}
      <g>
        <rect x={232} y={66} width={140} height={74} rx={6} fill="none" stroke={TEAL_L} strokeOpacity="0.4" />
        <Lines x={244} y={84} w={116} n={4} step={13} color={PAPER} />
      </g>
      <text x={232} y={160} fill={TEAL_L} fontSize="11" fontFamily="ui-monospace, monospace">
        confidence 0.972 (simulated)
      </text>
    </svg>
  );
}

function UnderstandArt() {
  const blocks = [
    { x: 40, y: 40, w: 170, h: 40, label: "TITLE" },
    { x: 40, y: 92, w: 80, h: 40, label: "AUTHOR" },
    { x: 130, y: 92, w: 80, h: 40, label: "DATE" },
    { x: 40, y: 144, w: 170, h: 40, label: "FOOTNOTE" },
    { x: 226, y: 40, w: 140, h: 96, label: "TABLE" },
    { x: 226, y: 148, w: 140, h: 70, label: "REFERENCES" },
  ];
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      {blocks.map((b) => (
        <g key={b.label}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={6} fill="#0d1628" stroke={GOLD} strokeOpacity="0.6" />
          <rect x={b.x + 8} y={b.y + 8} width={b.label.length * 7 + 10} height={13} rx={3} fill={GOLD} />
          <text x={b.x + 13} y={b.y + 18} fontSize="9" fontFamily="ui-monospace, monospace" fill="#060B18">
            {b.label}
          </text>
          <line x1={b.x + 10} y1={b.y + b.h - 10} x2={b.x + b.w * 0.7} y2={b.y + b.h - 10} stroke={PAPER} strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function ConnectArt() {
  const pts = Array.from({ length: 34 }, (_, i) => {
    const a = i * 2.399;
    const r = 18 + Math.sqrt(i) * 21;
    return [200 + Math.cos(a) * r * 1.4, 130 + Math.sin(a) * r * 0.8] as const;
  });
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      <g stroke={GOLD} strokeOpacity="0.25">
        {pts.map((p, i) => {
          const q = i === 0 ? [200, 130] : pts[Math.floor(i / 2)];
          return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />;
        })}
      </g>
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i % 5 === 0 ? 3.5 : 2.2} fill={i % 3 === 0 ? TEAL_L : GOLD} opacity="0.85" />
      ))}
      <circle cx={200} cy={130} r={16} fill={GOLD} opacity="0.18" />
      <circle cx={200} cy={130} r={6} fill="#f3e2bd" />
    </svg>
  );
}

function AnswerArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      <g stroke={GOLD} strokeOpacity="0.2">
        <line x1={200} y1={170} x2={120} y2={210} />
        <line x1={200} y1={170} x2={280} y2={215} />
        <line x1={200} y1={170} x2={330} y2={160} />
        <line x1={200} y1={170} x2={70} y2={150} />
      </g>
      <polyline points="200,0 200,170 120,210" fill="none" stroke={TEAL_L} strokeWidth="2" />
      <polyline points="200,170 280,215" fill="none" stroke={TEAL_L} strokeWidth="2" />
      <polyline points="200,170 330,160" fill="none" stroke={TEAL_L} strokeWidth="2" />
      <circle cx={200} cy={170} r={6} fill="#f3e2bd" />
      {[
        [120, 210],
        [280, 215],
        [330, 160],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={5} fill={TEAL_L} />
          <rect x={40 + i * 112} y={30 + (i % 2) * 8} width={100} height={58} rx={6} fill="#0d1628" stroke={TEAL_L} strokeOpacity="0.7" />
          <text x={50 + i * 112} y={50 + (i % 2) * 8} fontSize="12" fontFamily="ui-monospace, monospace" fill={TEAL_L}>
            [{i + 1}]
          </text>
          <line x1={50 + i * 112} y1={68 + (i % 2) * 8} x2={128 + i * 112} y2={68 + (i % 2) * 8} stroke={PAPER} strokeOpacity="0.5" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

const ART = [ArchiveArt, ReadArt, UnderstandArt, ConnectArt, AnswerArt];
const ALT = [
  "An aged manuscript page with Arabic lines, stacks of pages and a shaft of gold light.",
  "A teal scanline crosses the page; above it the text reappears as clean digital lines.",
  "The page split into labelled blocks: title, author, date, footnote, table and references.",
  "A citation graph of linked works with the current document glowing at its centre.",
  "A teal path through the graph to three source nodes, shown as numbered source cards.",
];

export default function StaticStory() {
  return (
    <section id="story" aria-labelledby="story-heading" className="relative bg-ink px-5 py-28 md:px-12 md:py-40">
      <div className="mx-auto max-w-6xl">
        <h2 id="story-heading" className="eyebrow">
          From ink to insight
        </h2>
        <ol className="mt-16 space-y-24 md:space-y-32">
          {story.map((c, i) => {
            const Art = ART[i];
            return (
              <li key={c.id} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                <div className={i % 2 ? "md:order-2" : undefined}>
                  <p aria-hidden className="text-gold-gradient font-serif text-6xl italic leading-none md:text-8xl">
                    {c.numeral}
                  </p>
                  <h3 className="mt-4 font-serif text-4xl text-paper md:text-5xl">
                    <span className="sr-only">Chapter {c.numeral}: </span>
                    {c.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-mist md:text-lg">{c.line}</p>
                  {c.id === "answer" && (
                    <div className="glass mt-8 max-w-md rounded-2xl p-5">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Scripted example</p>
                      <p dir="rtl" lang="ar" className="font-arabic text-xl text-paper">
                        {DEMO.questionAr}
                      </p>
                      <p className="mt-1 text-sm text-mist">{DEMO.questionEn}</p>
                      <p className="mt-4 text-sm leading-relaxed text-paper">
                        {DEMO.answer.map((s, k) => (
                          <span key={s.cite}>
                            {s.text}
                            <span className="ml-0.5 font-mono text-[0.8em] text-teal-light">[{s.cite}]</span>
                            {k === DEMO.answer.length - 1 ? "." : k === 0 ? ". " : ", "}
                          </span>
                        ))}
                      </p>
                      <ol className="mt-3 space-y-1 border-t border-white/10 pt-3 font-mono text-[10.5px] text-mist">
                        {DEMO.sources.map((s) => (
                          <li key={s.n}>
                            <span className="text-teal-light">[{s.n}]</span> {s.title}, {s.meta} (illustrative)
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
                <figure className="aspect-[4/3] rounded-2xl border border-white/5 bg-midnight/60 p-6" role="img" aria-label={ALT[i]}>
                  <Art />
                </figure>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
