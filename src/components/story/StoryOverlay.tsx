"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { story } from "@/content/site";
import { DEMO, T, chapterOpacity, lin, seg, windowFade } from "./timeline";

export type OverlayHandle = { update: (p: number) => void };

type Props = {
  active: number;
  onJump: (i: number) => void;
  nodes: number;
  edges: number;
  compact: boolean;
};

const PARSE_FIELDS = ["title", "author", "date", "footnote", "table", "references"];

/**
 * Real-DOM layer over the WebGL stage: chapter copy, progress rail and the small
 * simulated readouts. Updated imperatively from the ScrollTrigger (no re-render per frame).
 */
const StoryOverlay = forwardRef<OverlayHandle, Props>(function StoryOverlay({ active, onJump, nodes, edges, compact }, ref) {
  const chapters = useRef<(HTMLDivElement | null)[]>([]);
  const railFill = useRef<HTMLSpanElement>(null);
  const railFillX = useRef<HTMLSpanElement>(null);
  const hudRead = useRef<HTMLDivElement>(null);
  const hudParse = useRef<HTMLDivElement>(null);
  const hudGraph = useRef<HTMLDivElement>(null);
  const readLines = useRef<HTMLSpanElement>(null);
  const readChars = useRef<HTMLSpanElement>(null);
  const readConf = useRef<HTMLSpanElement>(null);
  const readBar = useRef<HTMLSpanElement>(null);
  const parseRows = useRef<(HTMLLIElement | null)[]>([]);
  const graphNodes = useRef<HTMLSpanElement>(null);
  const graphEdges = useRef<HTMLSpanElement>(null);
  const qPanel = useRef<HTMLDivElement>(null);
  const qAr = useRef<HTMLSpanElement>(null);
  const qEn = useRef<HTMLSpanElement>(null);
  const qStatus = useRef<HTMLSpanElement>(null);
  const aPanel = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      update(p: number) {
        chapters.current.forEach((el, i) => {
          if (!el) return;
          const o = chapterOpacity(p, i);
          el.style.opacity = String(o);
          el.style.transform = `translate3d(0, ${(1 - o) * 18}px, 0)`;
          el.style.visibility = o < 0.002 ? "hidden" : "visible";
        });
        if (railFill.current) railFill.current.style.transform = `scaleY(${p})`;
        if (railFillX.current) railFillX.current.style.transform = `scaleX(${p})`;

        const show = (el: HTMLElement | null, o: number) => {
          if (!el) return;
          el.style.opacity = String(o);
          el.style.visibility = o < 0.002 ? "hidden" : "visible";
        };

        // II: OCR readout
        const scan = lin(p, T.scan[0], T.scan[1]);
        show(hudRead.current, windowFade(p, 0.215, 0.405, 0.025));
        if (readLines.current) readLines.current.textContent = `${Math.round(scan * 11)}/11`;
        if (readChars.current) readChars.current.textContent = String(Math.round(scan * 386));
        if (readConf.current) readConf.current.textContent = (0.9 + 0.072 * scan).toFixed(3);
        if (readBar.current) readBar.current.style.transform = `scaleX(${scan})`;

        // III: parsed fields
        show(hudParse.current, windowFade(p, 0.415, 0.6, 0.025));
        const fields = lin(p, T.layout[0], T.layout[1]) * PARSE_FIELDS.length;
        parseRows.current.forEach((li, i) => {
          if (li) li.style.opacity = fields > i + 0.3 ? "1" : "0.25";
        });

        // IV: graph stats
        const reveal = seg(p, T.reveal[0], T.reveal[1]);
        show(hudGraph.current, windowFade(p, 0.635, 0.8, 0.025));
        if (graphNodes.current) graphNodes.current.textContent = String(Math.round(reveal * nodes));
        if (graphEdges.current) graphEdges.current.textContent = String(Math.round(reveal * edges));

        // V: question types itself, beam status, answer
        const a = seg(p, T.answer[0], T.answer[1]);
        show(qPanel.current, seg(p, T.question[0] - 0.008, T.question[0] + 0.004) * (compact ? 1 - a : 1));
        if (qAr.current) {
          const n = Math.round(lin(p, T.question[0], T.question[1]) * DEMO.questionAr.length);
          qAr.current.textContent = DEMO.questionAr.slice(0, n);
        }
        if (qEn.current) {
          const n = Math.round(lin(p, T.questionEn[0], T.questionEn[1]) * DEMO.questionEn.length);
          qEn.current.textContent = DEMO.questionEn.slice(0, n);
        }
        if (qStatus.current) {
          const beam = lin(p, T.beam[0], T.beam[1]);
          qStatus.current.textContent =
            p < T.beam[0] ? "awaiting query" : beam < 1 ? "tracing citation graph…" : "3 sources retrieved · answer grounded";
        }
        if (aPanel.current) {
          show(aPanel.current, a);
          aPanel.current.style.transform = `translate3d(0, ${(1 - a) * 16}px, 0)`;
        }
      },
    }),
    [nodes, edges, compact],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* blend into the hero above and the section below */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
      <div aria-hidden className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-ink/70 to-transparent max-md:hidden" />

      <div className="absolute left-5 top-20 md:left-12 md:top-24">
        <h2 id="story-heading" className="eyebrow">
          From ink to insight
        </h2>
      </div>

      {/* Chapter copy, stacked in one grid cell and cross-faded */}
      <div className="absolute inset-x-5 top-28 grid md:inset-x-auto md:bottom-[13vh] md:left-12 md:top-auto md:max-w-md">
        {story.map((c, i) => (
          <div
            key={c.id}
            ref={(el) => {
              chapters.current[i] = el;
            }}
            className="col-start-1 row-start-1 will-change-transform"
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
          >
            <p aria-hidden className="text-gold-gradient font-serif text-5xl italic leading-none md:text-8xl">
              {c.numeral}
            </p>
            <h3 className="mt-2 font-serif text-3xl text-paper md:mt-4 md:text-6xl">
              <span className="sr-only">Chapter {c.numeral}: </span>
              {c.title}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist md:mt-4 md:text-lg">{c.line}</p>
          </div>
        ))}
      </div>

      {/* II · OCR readout */}
      <div
        ref={hudRead}
        className="glass absolute right-5 top-[64%] w-56 rounded-xl p-4 font-mono text-[11px] text-mist md:left-12 md:right-auto md:top-40 md:w-64"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p className="mb-3 uppercase tracking-[0.2em] text-teal-light">OCR · simulated readout</p>
        <dl className="grid grid-cols-[1fr_auto] gap-y-1.5">
          <dt>scripts</dt>
          <dd className="text-paper">ar · la</dd>
          <dt>lines</dt>
          <dd className="text-paper">
            <span ref={readLines}>0/11</span>
          </dd>
          <dt>characters</dt>
          <dd className="text-paper">
            <span ref={readChars}>0</span>
          </dd>
          <dt>mean confidence</dt>
          <dd className="text-teal-light">
            <span ref={readConf}>0.900</span>
          </dd>
        </dl>
        <span className="mt-3 block h-px w-full bg-white/10">
          <span ref={readBar} className="block h-px w-full origin-left scale-x-0 bg-teal" />
        </span>
      </div>

      {/* III · parsed fields */}
      <div
        ref={hudParse}
        className="glass absolute right-5 top-[64%] w-56 rounded-xl p-4 font-mono text-[11px] text-mist md:left-12 md:right-auto md:top-40 md:w-64"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p className="mb-3 uppercase tracking-[0.2em] text-gold">Parse · record.v1</p>
        <ul className="space-y-1.5">
          {PARSE_FIELDS.map((f, i) => (
            <li
              key={f}
              ref={(el) => {
                parseRows.current[i] = el;
              }}
              className="flex justify-between transition-opacity duration-300"
              style={{ opacity: 0.25 }}
            >
              <span>{f}</span>
              <span className="text-teal-light">extracted</span>
            </li>
          ))}
        </ul>
      </div>

      {/* IV · graph stats */}
      <div
        ref={hudGraph}
        className="glass absolute right-5 top-[64%] w-56 rounded-xl p-4 font-mono text-[11px] text-mist md:left-12 md:right-auto md:top-40 md:w-64"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p className="mb-3 uppercase tracking-[0.2em] text-gold">Citation index · illustrative</p>
        <dl className="grid grid-cols-[1fr_auto] gap-y-1.5">
          <dt>works linked</dt>
          <dd className="text-paper">
            <span ref={graphNodes}>0</span>
          </dd>
          <dt>citations</dt>
          <dd className="text-paper">
            <span ref={graphEdges}>0</span>
          </dd>
          <dt>this document</dt>
          <dd className="text-gold-light">centre</dd>
        </dl>
      </div>

      {/* V · question */}
      <div
        ref={qPanel}
        className="glass absolute inset-x-5 bottom-20 mx-auto max-w-xl rounded-2xl px-5 py-4 md:bottom-auto md:top-24"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p className="sr-only">
          Question in Arabic: <span lang="ar">{DEMO.questionAr}</span>. In English: {DEMO.questionEn}
        </p>
        <div aria-hidden>
          <p dir="rtl" lang="ar" className="min-h-[1.6em] font-arabic text-lg leading-relaxed text-paper md:text-2xl">
            <span ref={qAr} />
            <span className="ms-0.5 inline-block h-[1em] w-px translate-y-1 animate-pulse bg-teal-light" />
          </p>
          <p className="mt-1 min-h-[1.4em] text-xs text-mist md:text-sm">
            <span ref={qEn} />
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-teal-light">
            <span ref={qStatus}>awaiting query</span>
          </p>
        </div>
      </div>

      {/* V · answer */}
      <div
        ref={aPanel}
        className="glass absolute inset-x-5 bottom-20 rounded-2xl p-5 md:inset-x-auto md:bottom-[13vh] md:right-44 md:w-[26rem]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Answer · scripted example</p>
        <p className="text-sm leading-relaxed text-paper md:text-[15px]">
          {DEMO.answer.map((s, i) => (
            <span key={s.cite}>
              {s.text}
              <span className="ml-0.5 font-mono text-[0.8em] text-teal-light">[{s.cite}]</span>
              {i === DEMO.answer.length - 1 ? "." : i === 0 ? ". " : ", "}
            </span>
          ))}
        </p>
        <ol className="mt-3 space-y-1 border-t border-white/10 pt-3 font-mono text-[10px] text-mist md:text-[10.5px]">
          {DEMO.sources.map((s) => (
            <li key={s.n}>
              <span className="text-teal-light">[{s.n}]</span> {s.title}
              <span className="max-md:hidden">, {s.meta}</span> (illustrative)
            </li>
          ))}
        </ol>
      </div>

      {/* Progress rail: desktop vertical, mobile horizontal */}
      <nav aria-label="Story chapters" className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2 md:translate-x-0">
        <div className="relative flex items-center gap-5 md:flex-col md:items-end md:gap-7">
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-white/10 md:hidden">
            <span ref={railFillX} className="block h-px w-full origin-left scale-x-0 bg-gold" />
          </span>
          <span aria-hidden className="absolute inset-y-0 right-[5px] w-px bg-white/10 max-md:hidden">
            <span ref={railFill} className="block h-full w-px origin-top scale-y-0 bg-gold" />
          </span>
          {story.map((c, i) => {
            const on = i === active;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onJump(i)}
                aria-current={on ? "step" : undefined}
                aria-label={`Chapter ${c.numeral}: ${c.title}`}
                className="group relative flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
              >
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-opacity duration-500 max-md:hidden ${
                    on ? "text-gold opacity-100" : "text-paper opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  }`}
                >
                  {c.numeral} · {c.title}
                </span>
                <span
                  className={`relative block h-[11px] w-[11px] rounded-full border transition-all duration-500 ${
                    on ? "border-gold bg-gold shadow-[0_0_12px_rgba(203,175,126,0.8)]" : "border-mist/50 bg-ink group-hover:border-paper"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
});

export default StoryOverlay;
