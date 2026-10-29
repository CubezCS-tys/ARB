"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { DocPage } from "./metadata/DocPages";
import { CardView, DublinCoreView, JsonView, MarcView, buildRecord } from "./metadata/RecordViews";
import SimBadge from "./metadata/SimBadge";
import { FIELD_LABEL, FIELD_ORDER, PAGE_STEP, SAMPLES, fieldsFrom, stepsOf, type FieldKey } from "./metadata/samples";
import { brand } from "@/content/site";

type View = "card" | "json" | "dc" | "marc";
type Rect = { x: number; y: number; w: number; h: number };
type Trail = { key: string; d: string; tone: "gold" | "teal" };

const VIEWS: { id: View; label: string }[] = [
  { id: "card", label: "Record" },
  { id: "json", label: "JSON" },
  { id: "dc", label: "Dublin Core" },
  { id: "marc", label: "MARC" },
];

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const STEP_MS = 950;
const FLIGHT_MS = 760;
const EASE = [0.65, 0, 0.35, 1] as const;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export default function MetadataDemo() {
  const reduced = useReducedMotion();
  const [sampleIdx, setSampleIdx] = useState(0);
  const [view, setView] = useState<View>("card");
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(0);
  const [landed, setLanded] = useState(0);
  const [boxes, setBoxes] = useState<Record<string, Rect>>({});
  const [trails, setTrails] = useState<Trail[]>([]);
  const [flash, setFlash] = useState<Set<FieldKey>>(new Set());
  const [copied, setCopied] = useState(false);

  const sample = SAMPLES[sampleIdx];
  const steps = useMemo(() => stepsOf(sample), [sample]);
  const stepIndex = useMemo(() => new Map(steps.map((s, i) => [s.id, i])), [steps]);

  const rootRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelHeadRef = useRef<HTMLDivElement>(null);
  const regionEls = useRef(new Map<string, HTMLElement>());
  const fieldEls = useRef(new Map<FieldKey, HTMLElement>());

  const reg = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) regionEls.current.set(id, el);
      else regionEls.current.delete(id);
    },
    []
  );
  const rowRef = useCallback(
    (k: FieldKey) => (el: HTMLElement | null) => {
      if (el) fieldEls.current.set(k, el);
      else fieldEls.current.delete(k);
    },
    []
  );

  const isFilled = useCallback(
    (k: FieldKey) => landed > (stepIndex.get(sample.fields[k].source) ?? Infinity),
    [landed, stepIndex, sample]
  );

  const phase: "idle" | "running" | "done" = run === 0 ? "idle" : landed >= steps.length ? "done" : "running";

  // ---- measure layout boxes relative to the page ----
  const measure = useCallback(() => {
    const page = pageRef.current;
    if (!page) return;
    const pr = page.getBoundingClientRect();
    const out: Record<string, Rect> = {};
    regionEls.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      const pad = Math.max(2, pr.width * 0.008);
      out[id] = { x: r.left - pr.left - pad, y: r.top - pr.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    });
    setBoxes(out);
  }, []);

  useIsoLayoutEffect(() => {
    measure();
  }, [sampleIdx, measure]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(page);
    document.fonts?.ready.then(() => measure()).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  // ---- auto-run the first time the demo scrolls into view ----
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun((r) => (r === 0 ? 1 : r));
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ---- the scripted extraction pass ----
  useEffect(() => {
    if (run === 0) return;
    setShown(0);
    setLanded(0);
    setTrails([]);
    if (reduced) {
      setShown(steps.length);
      setLanded(steps.length);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, k) => {
      timers.push(setTimeout(() => setShown(k + 1), 350 + k * STEP_MS));
      timers.push(setTimeout(() => setLanded(k + 1), 350 + k * STEP_MS + FLIGHT_MS));
    });
    return () => timers.forEach(clearTimeout);
  }, [run, steps, reduced]);

  // ---- launch trails from the region just detected to its record fields ----
  useEffect(() => {
    if (reduced || shown === 0 || landed >= shown) return;
    const step = steps[shown - 1];
    const targets = fieldsFrom(sample, step.id);
    const root = rootRef.current;
    const scroller = scrollRef.current;
    const srcEl = step.id === PAGE_STEP ? pageRef.current : regionEls.current.get(step.id);
    if (!root || !srcEl) return;

    // bring the first target row into view inside the record panel
    const firstRow = view === "card" ? fieldEls.current.get(targets[0]) : undefined;
    if (scroller && firstRow && scroller.scrollHeight > scroller.clientHeight + 4) {
      const top = firstRow.offsetTop;
      if (top < scroller.scrollTop || top + firstRow.offsetHeight > scroller.scrollTop + scroller.clientHeight) {
        scroller.scrollTop = Math.max(0, top - 24);
      }
    }

    const rr = root.getBoundingClientRect();
    const s = srcEl.getBoundingClientRect();
    const clip = scroller?.getBoundingClientRect();
    const next: Trail[] = targets.map((k, i) => {
      const tEl = view === "card" ? fieldEls.current.get(k) : panelHeadRef.current;
      const t = (tEl ?? panelHeadRef.current ?? root).getBoundingClientRect();
      let ty = t.top + Math.min(14, t.height / 2);
      if (clip && view === "card") ty = Math.min(Math.max(ty, clip.top + 6), clip.bottom - 6);
      const sideBySide = t.left > s.right - 10;
      let d: string;
      if (sideBySide) {
        const x1 = s.right - rr.left;
        const y1 = s.top + s.height / 2 - rr.top + (i - (targets.length - 1) / 2) * 4;
        const x2 = t.left - rr.left + 2;
        const y2 = ty - rr.top;
        const dx = Math.max(60, (x2 - x1) * 0.5);
        d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
      } else {
        const x1 = s.left + s.width / 2 - rr.left;
        const y1 = s.bottom - rr.top;
        const x2 = t.left - rr.left + 24 + i * 10;
        const y2 = t.top - rr.top + 4;
        const dy = Math.max(60, (y2 - y1) * 0.5);
        d = `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
      }
      return { key: `${run}-${shown}-${k}`, d, tone: step.tone };
    });
    setTrails(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  // flash rows as their values land
  useEffect(() => {
    if (landed === 0) return;
    const step = steps[landed - 1];
    if (!step) return;
    const keys = new Set(fieldsFrom(sample, step.id));
    setTrails([]);
    if (reduced) return;
    setFlash(keys);
    const t = setTimeout(() => setFlash(new Set()), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landed]);

  const record = useMemo(() => buildRecord(sample, isFilled), [sample, isFilled]);
  const json = useMemo(() => JSON.stringify(record, null, 2), [record]);

  const onExport = async () => {
    const ok = await copyText(json);
    setCopied(ok);
    setTimeout(() => setCopied(false), 1800);
  };

  const pickSample = (i: number) => {
    if (i === sampleIdx) return;
    setSampleIdx(i);
    setRun((r) => r + 1);
  };

  const filledCount = FIELD_ORDER.filter(isFilled).length;
  const regionCount = sample.regions.length;
  const regionsShown = Math.min(shown, regionCount);
  const current = shown > 0 && landed < shown ? steps[shown - 1] : null;
  const scanBox = current ? (current.id === PAGE_STEP ? null : boxes[current.id]) : null;
  const confidences = FIELD_ORDER.filter(isFilled)
    .map((k) => sample.fields[k].confidence)
    .filter((c): c is number => c !== null);
  const mean = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null;
  const flagged = FIELD_ORDER.filter((k) => isFilled(k) && (sample.fields[k].confidence ?? 1) < 0.85).length;

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} className="glass relative overflow-hidden rounded-2xl md:h-[600px]">
        {/* ---------- header ---------- */}
        <div className="flex h-auto flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 md:h-14 md:py-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">{brand.short} Parse · record extraction</span>
            <SimBadge />
          </div>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            disabled={phase === "running"}
            className="rounded-full border border-gold/50 bg-gold/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gold-light transition-colors hover:bg-gold/20 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-progress disabled:opacity-70"
          >
            {phase === "idle" ? "Extract" : phase === "running" ? `Extracting · ${regionsShown}/${regionCount}` : "Run again"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:h-[calc(100%-3.5rem)] md:grid-cols-[84px_minmax(0,300px)_minmax(0,1fr)] lg:grid-cols-[100px_380px_minmax(0,1fr)]">
          {/* ---------- sample picker ---------- */}
          <div
            role="group"
            aria-label="Sample documents"
            className="flex gap-3 overflow-x-auto border-b border-white/10 px-4 py-3 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-5"
          >
            {SAMPLES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={i === sampleIdx}
                aria-label={`${s.label}, ${s.sub}`}
                onClick={() => pickSample(i)}
                className={`group flex shrink-0 flex-col items-center gap-1.5 rounded-lg p-1.5 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold ${
                  i === sampleIdx ? "bg-gold/10" : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`pointer-events-none block aspect-[1/1.36] w-[54px] overflow-hidden rounded-[3px] bg-[#F3EEE3] shadow-md ring-1 transition [container-type:inline-size] lg:w-[64px] ${
                    i === sampleIdx ? "ring-gold" : "opacity-60 ring-white/10 group-hover:opacity-90"
                  }`}
                  aria-hidden
                >
                  <DocPage sample={s} />
                </span>
                <span className={`text-center font-mono text-[9px] uppercase leading-tight tracking-wider ${i === sampleIdx ? "text-gold-light" : "text-mist"}`}>
                  {s.label}
                  <span className="block normal-case tracking-normal text-mist/70">{s.sub}</span>
                </span>
              </button>
            ))}
          </div>

          {/* ---------- document stage ---------- */}
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-5 md:px-5">
            <div
              ref={pageRef}
              role="img"
              aria-label={`Sample page: ${sample.label} (${sample.sub}), fictional`}
              className="relative aspect-[1/1.36] w-full max-w-[380px] overflow-hidden rounded-[4px] bg-[#F3EEE3] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] [container-type:inline-size] md:max-w-[340px]"
            >
              <DocPage key={sample.id} sample={sample} reg={reg} />

              {/* paper texture + vignette */}
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(80,60,30,0.12))]"
                aria-hidden
              />

              {/* detected layout boxes */}
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <AnimatePresence>
                  {sample.regions.slice(0, shown).map((r) => {
                    const b = boxes[r.id];
                    if (!b) return null;
                    const conf = Math.max(...fieldsFrom(sample, r.id).map((k) => sample.fields[k].confidence ?? 0), 0);
                    const active = current?.id === r.id;
                    const gold = r.tone === "gold";
                    return (
                      <motion.div
                        key={`${run}-${r.id}`}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: phase === "done" ? 0.55 : 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className={`absolute rounded-[2px] border ${
                          gold ? "border-[#8C7650] bg-[#CBAF7E]/[0.12]" : "border-[#2D6570] bg-[#4C9DAB]/[0.12]"
                        } ${active ? "shadow-[0_0_0_3px_rgba(203,175,126,0.25)]" : ""}`}
                        style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
                      >
                        <span
                          className={`absolute -top-[15px] left-[-1px] whitespace-nowrap rounded-t-[2px] px-1.5 py-[1px] font-mono text-[8.5px] uppercase leading-[13px] tracking-wider ${
                            gold ? "bg-[#1C2333] text-gold-light" : "bg-[#163C44] text-teal-light"
                          }`}
                        >
                          {r.label}
                          {conf > 0 && <span className="ml-1 opacity-70">{conf.toFixed(2)}</span>}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* page-wide inference glow */}
                <AnimatePresence>
                  {current?.id === PAGE_STEP && (
                    <motion.div
                      key="infer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 shadow-[inset_0_0_60px_rgba(76,157,171,0.45)]"
                    />
                  )}
                </AnimatePresence>

                {/* scanline follows the region being parsed */}
                {!reduced && phase === "running" && (
                  <motion.div
                    className="absolute left-0 right-0 h-px bg-teal shadow-[0_0_12px_2px_rgba(76,157,171,0.7)]"
                    initial={{ top: 0 }}
                    animate={{ top: scanBox ? scanBox.y + scanBox.h / 2 : current?.id === PAGE_STEP ? "100%" : 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <span className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-teal/20 to-transparent" />
                  </motion.div>
                )}
              </div>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist" aria-live="polite">
              {phase === "idle" && <>{sample.file} · ready</>}
              {phase === "running" && current && (
                <>
                  <span className="text-gold-light">{current.label}</span> · regions {regionsShown}/{regionCount} · fields {filledCount}/
                  {FIELD_ORDER.length}
                </>
              )}
              {phase === "done" && (
                <>
                  {regionCount} regions · {FIELD_ORDER.length} fields · <span className="text-teal-light">{sample.timing}</span>
                </>
              )}
            </p>
          </div>

          {/* ---------- record panel ---------- */}
          <div className="flex min-h-0 flex-col border-t border-white/10 md:border-l md:border-t-0">
            <div ref={panelHeadRef} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 sm:px-5">
              <div role="group" aria-label="Record format" className="flex gap-1">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={view === v.id}
                    onClick={() => setView(v.id)}
                    className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold ${
                      view === v.id ? "bg-white/[0.08] text-gold-light" : "text-mist hover:text-paper"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onExport}
                disabled={landed === 0}
                className="flex items-center gap-1.5 rounded-md border border-teal/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-teal-light transition-colors hover:bg-teal/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-teal disabled:opacity-40"
              >
                <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="5" width="8" height="9" rx="1" />
                  <path d="M3 11V3a1 1 0 0 1 1-1h6" />
                </svg>
                <span aria-live="polite">{copied ? "Copied" : "Export JSON"}</span>
              </button>
            </div>

            <div ref={scrollRef} data-lenis-prevent className="relative min-h-0 flex-1 px-4 py-2 sm:px-5 md:overflow-y-auto">
              {view === "card" && <CardView sample={sample} isFilled={isFilled} flash={flash} rowRef={rowRef} />}
              {view === "json" && (
                <div className="py-2">
                  <JsonView value={record} />
                </div>
              )}
              {view === "dc" && (
                <div className="py-2">
                  <DublinCoreView sample={sample} isFilled={isFilled} />
                </div>
              )}
              {view === "marc" && (
                <div className="py-2">
                  <MarcView sample={sample} isFilled={isFilled} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mist sm:px-5">
              <span>
                {filledCount}/{FIELD_ORDER.length} fields
                {mean !== null && (
                  <>
                    {" "}
                    · mean confidence <span className="text-gold-light">{Math.round(mean * 100)}%</span>
                  </>
                )}
              </span>
              {flagged > 0 && <span className="text-gold-dim">{flagged} flagged for review</span>}
            </div>
          </div>
        </div>

        {/* ---------- flight trails (region -> field) ---------- */}
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <AnimatePresence>
              {trails.map((t) => (
                <motion.path
                  key={t.key}
                  d={t.d}
                  fill="none"
                  stroke={t.tone === "gold" ? "#CBAF7E" : "#4C9DAB"}
                  strokeWidth={1}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.85 }}
                  animate={{ pathLength: 1, opacity: 0.85 }}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                  transition={{ duration: FLIGHT_MS / 1000, ease: EASE }}
                />
              ))}
            </AnimatePresence>
          </svg>
          <AnimatePresence>
            {trails.flatMap((t) =>
              [0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={`${t.key}-p${i}`}
                  className="absolute left-0 top-0 block rounded-full"
                  style={{
                    offsetPath: `path("${t.d}")`,
                    offsetRotate: "0deg",
                    width: 6 - i * 0.7,
                    height: 6 - i * 0.7,
                    background: t.tone === "gold" ? "#E3CFA6" : "#7CC4CF",
                    boxShadow: `0 0 ${10 - i}px ${t.tone === "gold" ? "rgba(227,207,166,0.9)" : "rgba(124,196,207,0.9)"}`,
                    opacity: 1 - i * 0.14,
                  }}
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ duration: (FLIGHT_MS - 120) / 1000, delay: i * 0.035, ease: EASE }}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        <p className="sr-only" aria-live="polite">
          {phase === "done"
            ? `Extraction complete: ${FIELD_ORDER.filter(isFilled).map((k) => FIELD_LABEL[k]).join(", ")}.`
            : ""}
        </p>
      </div>
    </MotionConfig>
  );
}
