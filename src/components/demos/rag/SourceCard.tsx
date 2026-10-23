"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COLLECTIONS, type Passage } from "./corpus";
import { focusRing } from "./ui";

/** Eased count-up used for similarity scores. */
function useCountUp(target: number, instant: boolean, duration = 900) {
  const [value, setValue] = useState(instant ? target : 0);
  const from = useRef(instant ? target : 0);
  useEffect(() => {
    if (instant) {
      from.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const f = from.current;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      const v = f + (target - f) * e;
      from.current = v;
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, instant, duration]);
  return value;
}

/** Render text with marked spans; the active span glows, other cited spans are underlined. */
function Marked({ text, spans, active }: { text: string; spans: string[]; active?: string }) {
  const ranges = spans
    .map((s) => ({ s, i: text.indexOf(s) }))
    .filter((r) => r.i >= 0)
    .sort((a, b) => a.i - b.i);
  const out: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, idx) => {
    if (r.i < cursor) return;
    if (r.i > cursor) out.push(<span key={`t${idx}`}>{text.slice(cursor, r.i)}</span>);
    const isActive = r.s === active;
    out.push(
      <mark
        key={`m${idx}`}
        className={`rounded-sm px-0.5 transition-colors duration-500 ${
          isActive
            ? "bg-gold/30 text-paper shadow-[0_0_0_1px_rgba(203,175,126,0.55),0_0_18px_rgba(203,175,126,0.25)]"
            : "bg-transparent text-inherit underline decoration-gold/40 decoration-dotted underline-offset-4"
        }`}
      >
        {r.s}
      </mark>,
    );
    cursor = r.i + r.s.length;
  });
  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
  return <>{out}</>;
}

export default function SourceCard({
  passage,
  rank,
  score,
  scoreKind,
  dropped,
  expanded,
  citedNs,
  spans,
  activeSpan,
  instant,
  onToggle,
}: {
  passage: Passage;
  rank: number;
  score: number;
  scoreKind: "cos" | "rel";
  dropped: boolean;
  expanded: boolean;
  citedNs: number[];
  spans: { ar: string[]; en: string[] };
  activeSpan?: { ar: string; en: string };
  instant: boolean;
  onToggle: () => void;
}) {
  const shown = useCountUp(score, instant);
  const col = COLLECTIONS[passage.collection];
  const isActive = Boolean(activeSpan);

  return (
    <motion.li
      layout={instant ? false : "position"}
      data-pid={passage.id}
      initial={instant ? false : { opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: dropped ? 0.42 : 1, x: 0, scale: 1 }}
      transition={{
        layout: { type: "spring", stiffness: 260, damping: 30 },
        default: { duration: 0.55, delay: instant ? 0 : rank * 0.11, ease: [0.22, 1, 0.36, 1] },
      }}
      className="list-none"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`w-full rounded-xl border p-3 text-left transition-colors duration-300 ${focusRing} ${
          isActive
            ? "border-gold/50 bg-gold/[0.07]"
            : expanded
              ? "border-white/20 bg-white/[0.04]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-mist/70">#{rank + 1}</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
            {col.en} · {passage.ref}
          </span>
          {citedNs.length > 0 && !dropped && (
            <span className="flex gap-1">
              {citedNs.map((n) => (
                <span key={n} className="rounded bg-gold/15 px-1 font-mono text-[10px] text-gold-light">
                  {n}
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${scoreKind === "rel" ? "bg-gold" : "bg-teal"}`}
              style={{ width: `${Math.round(shown * 100)}%` }}
            />
          </div>
          <span className={`w-16 text-right font-mono text-[10px] tabular-nums ${scoreKind === "rel" ? "text-gold-light" : "text-teal-light"}`}>
            {scoreKind} {shown.toFixed(scoreKind === "rel" ? 2 : 3)}
          </span>
        </div>

        <p
          dir="rtl"
          lang="ar"
          className={`mt-2 font-arabic text-[15px] leading-[1.9] text-paper/90 ${expanded || isActive ? "" : "line-clamp-2"}`}
        >
          <Marked text={passage.ar} spans={spans.ar} active={activeSpan?.ar} />
        </p>
        {(expanded || isActive) && (
          <p className="mt-2 border-t border-white/[0.06] pt-2 text-xs italic leading-relaxed text-mist">
            <Marked text={passage.en} spans={spans.en} active={activeSpan?.en} />
          </p>
        )}
        {dropped && (
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-mist/60">below threshold · not used</span>
        )}
      </button>
    </motion.li>
  );
}
