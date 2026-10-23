"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { generateGraph, type Graph, type Paper } from "./graph/data";
import { layoutSteps, type LayoutFrame, type LayoutInput } from "./graph/layout";
import { computeVisual, lineageOf } from "./graph/visual";
import type { CameraCommand } from "./graph/GraphScene";
import SimBadge from "./metadata/SimBadge";

const GraphScene = dynamic(() => import("./graph/GraphScene"), { ssr: false });

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

function simId(p: Paper) {
  return `SIM-CIT-${String(p.id + 1).padStart(5, "0")}`;
}

export default function CitationGraphDemo() {
  const reducedMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const [mobile, setMobile] = useState(false);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [positions, setPositions] = useState<Float32Array | null>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState<number | null>(null);
  const [yearMax, setYearMax] = useState(2025);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<{ id: number; x: number; y: number } | null>(null);
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const [zoomEnabled, setZoomEnabled] = useState(false);

  // ---- graph generation (client only, so SSR and hydration agree) ----
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setMobile(isMobile);
    setGraph(generateGraph(isMobile ? 120 : 240));
  }, []);

  // ---- force layout off the main thread ----
  useEffect(() => {
    if (!graph) return;
    const input: LayoutInput = {
      n: graph.papers.length,
      edges: graph.edges,
      field: Uint8Array.from(graph.papers.map((p) => p.field)),
      fieldCount: graph.fields.length,
      iterations: mobile ? 260 : 320,
      seed: 7,
    };
    const emitEvery = reducedMotion ? input.iterations : 8;
    let cancelled = false;
    const onFrame = (f: LayoutFrame) => {
      if (cancelled) return;
      setProgress(f.progress);
      if (!reducedMotion || f.done) setPositions(f.positions);
    };

    let worker: Worker | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      worker = new Worker(new URL("./graph/layout.worker.ts", import.meta.url));
      worker.onmessage = (e: MessageEvent<LayoutFrame>) => onFrame(e.data);
      worker.onerror = () => {
        worker?.terminate();
        worker = null;
        runOnMainThread();
      };
      worker.postMessage({ ...input, emitEvery });
    } catch {
      worker = null;
      runOnMainThread();
    }

    // Fallback: chunk the generator across macrotasks so the main thread never blocks for long
    function runOnMainThread() {
      const gen = layoutSteps(input, Math.min(emitEvery, 4));
      const tick = () => {
        if (cancelled) return;
        const r = gen.next();
        if (r.done) return;
        if (!reducedMotion || r.value.done) onFrame(r.value);
        else setProgress(r.value.progress);
        timer = setTimeout(tick, 0);
      };
      tick();
    }

    return () => {
      cancelled = true;
      worker?.terminate();
      if (timer) clearTimeout(timer);
    };
  }, [graph, mobile, reducedMotion]);

  // ---- pause rendering when off-screen ----
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ---- timeline playback ----
  useEffect(() => {
    if (!playing || !graph) return;
    const id = setInterval(() => {
      setYearMax((y) => Math.min(y + 1, graph.maxYear));
    }, reducedMotion ? 260 : 140);
    return () => clearInterval(id);
  }, [playing, graph, reducedMotion]);

  useEffect(() => {
    if (playing && graph && yearMax >= graph.maxYear) setPlaying(false);
  }, [playing, graph, yearMax]);

  // drop selection if the timeline hides it
  useEffect(() => {
    if (graph && selected !== null && graph.papers[selected].year > yearMax) setSelected(null);
  }, [graph, selected, yearMax]);

  // ---- derived view state ----
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!graph || q.length < 2) return null;
    const out = new Set<number>();
    for (const p of graph.papers) {
      if (p.year > yearMax) continue;
      const hay = `${p.title} ${p.titleAr ?? ""} ${p.authors.join(" ")}`.toLowerCase();
      if (hay.includes(q)) out.add(p.id);
    }
    return out;
  }, [graph, query, yearMax]);

  const lineage = useMemo(
    () => (graph && selected !== null ? lineageOf(graph, selected, yearMax) : null),
    [graph, selected, yearMax]
  );

  const visual = useMemo(
    () => (graph ? computeVisual(graph, { selected, matches, fieldFilter, yearMax }, lineage) : null),
    [graph, selected, matches, fieldFilter, yearMax, lineage]
  );

  const topMatches = useMemo(() => {
    if (!graph || !matches) return [];
    return Array.from(matches)
      .map((id) => graph.papers[id])
      .sort((a, b) => b.citedBy.length - a.citedBy.length)
      .slice(0, mobile ? 4 : 6);
  }, [graph, matches, mobile]);

  const select = useCallback((id: number | null) => {
    setSelected(id);
    setHover(null);
  }, []);

  const onHover = useCallback((id: number | null, x: number, y: number) => {
    setHover(id === null ? null : { id, x, y });
  }, []);

  const cmd = (type: CameraCommand["type"]) => setCommand({ type, n: Date.now() + Math.random() });

  const onCanvasKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, CameraCommand["type"]> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      "+": "zoomIn",
      "=": "zoomIn",
      "-": "zoomOut",
      "0": "reset",
    };
    const t = map[e.key];
    if (t) {
      e.preventDefault();
      cmd(t);
    }
  };

  const onFrameKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && selected !== null) {
      e.stopPropagation();
      select(null);
    }
  };

  const wrapRect = canvasWrapRef.current?.getBoundingClientRect();
  const hoverPaper = graph && hover ? graph.papers[hover.id] : null;
  const sel = graph && selected !== null ? graph.papers[selected] : null;
  const layoutDone = progress >= 1;

  return (
    <div
      ref={frameRef}
      onKeyDown={onFrameKey}
      className="glass relative overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_40%,rgba(22,35,58,0.9),rgba(6,11,24,0.95)_70%)] md:h-[600px]"
    >
      {/* ---------- canvas ---------- */}
      <div
        ref={canvasWrapRef}
        data-lenis-prevent
        tabIndex={0}
        role="application"
        aria-roledescription="3D citation graph"
        aria-label="Citation graph of fictional papers. Arrow keys rotate, plus and minus zoom, 0 resets the view. Use the search box or the paper lists to choose a paper."
        onKeyDown={onCanvasKey}
        onPointerDown={() => setZoomEnabled(true)}
        onPointerLeave={() => {
          setZoomEnabled(false);
          setHover(null);
        }}
        className="relative h-[440px] outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-gold/60 md:absolute md:inset-0 md:h-auto"
      >
        {graph && positions && visual && (
          <GraphScene
            graph={graph}
            positions={positions}
            visual={visual}
            focusId={selected}
            active={active}
            reducedMotion={reducedMotion}
            mobile={mobile}
            zoomEnabled={zoomEnabled}
            command={command}
            onHover={onHover}
            onSelect={select}
          />
        )}

        {!layoutDone && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist">Resolving citation network</p>
              <div className="mx-auto mt-3 h-px w-40 overflow-hidden bg-white/10">
                <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="mt-2 font-mono text-[10px] text-gold-light">{Math.round(progress * 100)}%</p>
            </div>
          </div>
        )}

        {hoverPaper && wrapRect && hover && (
          <div
            className="pointer-events-none absolute z-20 max-w-[260px] rounded-lg border border-white/15 bg-ink/90 px-3 py-2 shadow-xl backdrop-blur"
            style={{
              left: Math.min(hover.x - wrapRect.left + 14, wrapRect.width - 270),
              top: Math.max(hover.y - wrapRect.top + 14, 8),
            }}
          >
            {hoverPaper.titleAr && (
              <p dir="rtl" lang="ar" className="font-arabic text-sm leading-snug text-paper">
                {hoverPaper.titleAr}
              </p>
            )}
            <p className={`text-xs leading-snug ${hoverPaper.titleAr ? "text-mist" : "text-paper"}`}>{hoverPaper.title}</p>
            <p className="mt-1 font-mono text-[10px] text-mist">
              {hoverPaper.year} · {hoverPaper.authors[0]}
              {hoverPaper.authors.length > 1 ? " et al." : ""} ·{" "}
              <span className="text-gold-light">{hoverPaper.citedBy.length} cites</span>
            </p>
          </div>
        )}

        {/* camera controls */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 md:bottom-[84px] md:left-4 md:right-auto">
          {(
            [
              ["zoomIn", "+", "Zoom in"],
              ["zoomOut", "−", "Zoom out"],
              ["left", "↺", "Rotate left"],
              ["right", "↻", "Rotate right"],
              ["reset", "⌂", "Reset view"],
            ] as const
          ).map(([t, glyph, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => cmd(t)}
              aria-label={label}
              title={label}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-ink/70 font-mono text-base text-mist backdrop-blur transition-colors hover:border-gold/50 hover:text-gold-light focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold md:h-9 md:w-9"
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- header + search (overlay) ---------- */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 md:left-4 md:right-auto md:top-4 md:w-[320px]">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <SimBadge />
          {graph && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
              {visual?.visibleCount ?? 0} papers · {graph.edges.length / 2} links
            </span>
          )}
        </div>
        <div className="pointer-events-auto relative mt-3">
          <label htmlFor="cg-search" className="sr-only">
            Search papers by title word or author
          </label>
          <input
            id="cg-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFieldFilter(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && topMatches[0]) select(topMatches[0].id);
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search titles: retrieval, المخطوطات…"
            className="w-full rounded-lg border border-white/10 bg-ink/75 px-3 py-2.5 font-mono text-xs text-paper placeholder:text-mist/60 backdrop-blur focus:border-gold/50 focus:outline-none"
          />
          {matches && (
            <div className="mt-1.5 rounded-lg border border-white/10 bg-ink/85 p-1 backdrop-blur">
              <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mist" aria-live="polite">
                {matches.size} match{matches.size === 1 ? "" : "es"}
              </p>
              <ul>
                {topMatches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => select(p.id)}
                      className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-paper hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none"
                    >
                      <span className="mr-2 font-mono text-[10px] text-gold">{p.year}</span>
                      {p.titleAr ? (
                        <span dir="rtl" lang="ar" className="font-arabic">
                          {p.titleAr}
                        </span>
                      ) : (
                        p.title
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ---------- side panel ---------- */}
      {sel && lineage && graph && (
        <aside
          aria-label="Selected paper"
          data-lenis-prevent
          className="relative z-20 border-t border-white/10 bg-ink/80 p-5 backdrop-blur-xl md:absolute md:bottom-[84px] md:right-4 md:top-4 md:w-[340px] md:overflow-y-auto md:rounded-xl md:border"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{simId(sel)}</p>
            <button
              type="button"
              onClick={() => select(null)}
              aria-label="Close paper details"
              className="-mr-1 -mt-1 rounded px-2 py-1 font-mono text-xs text-mist hover:text-paper focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold"
            >
              ✕ esc
            </button>
          </div>
          {sel.titleAr && (
            <h3 dir="rtl" lang="ar" className="mt-3 font-arabic text-xl leading-relaxed text-paper">
              {sel.titleAr}
            </h3>
          )}
          <h3 className={sel.titleAr ? "mt-1 text-sm italic text-mist" : "mt-3 font-serif text-xl leading-snug text-paper"}>
            {sel.title}
          </h3>
          <p className="mt-3 text-xs text-mist">{sel.authors.join(", ")}</p>
          <p className="mt-1 text-xs text-mist">
            <span dir="auto">{sel.venue}</span> · {sel.year}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Cited by", sel.citedBy.length],
              ["Ancestors", lineage.ancestors.size],
              ["Descend.", lineage.descendants.size],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2">
                <dt className="font-mono text-[9px] uppercase tracking-[0.15em] text-mist">{k}</dt>
                <dd className="mt-0.5 font-serif text-lg text-paper">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 flex items-center gap-2 font-mono text-[10px] text-mist">
            <span className="h-2 w-2 rounded-full" style={{ background: graph.fields[sel.field].color }} />
            {graph.fields[sel.field].name}
            <span className="ml-auto flex items-center gap-3">
              <span className="text-gold-light">● cites</span>
              <span className="text-teal-light">● cited by</span>
            </span>
          </p>

          <PaperList
            title="Cites"
            tone="gold"
            ids={sel.cites}
            graph={graph}
            yearMax={yearMax}
            onPick={select}
          />
          <PaperList
            title="Cited by"
            tone="teal"
            ids={sel.citedBy}
            graph={graph}
            yearMax={yearMax}
            onPick={select}
          />
        </aside>
      )}

      {/* ---------- timeline + legend ---------- */}
      {graph && (
        <div className="relative z-10 flex flex-col gap-3 border-t border-white/10 bg-ink/70 px-4 py-4 backdrop-blur md:absolute md:bottom-0 md:left-0 md:right-0 md:flex-row md:items-center md:gap-6 md:px-5 md:py-3">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!playing && yearMax >= graph.maxYear) setYearMax(graph.minYear);
                setPlaying((p) => !p);
              }}
              aria-label={playing ? "Pause timeline" : "Play timeline"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold-light transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold md:h-9 md:w-9"
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <label htmlFor="cg-year" className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
              Timeline
            </label>
            <input
              id="cg-year"
              type="range"
              min={graph.minYear}
              max={graph.maxYear}
              value={yearMax}
              onChange={(e) => {
                setPlaying(false);
                setYearMax(Number(e.target.value));
              }}
              aria-valuetext={`Showing papers up to ${yearMax}`}
              className="h-1 flex-1 cursor-pointer accent-[#CBAF7E]"
            />
            <span className="w-12 text-right font-serif text-xl tabular-nums text-gold-light">{yearMax}</span>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Highlight a field">
            {graph.fields.map((f, i) => (
              <button
                key={f.name}
                type="button"
                aria-pressed={fieldFilter === i}
                onClick={() => {
                  setFieldFilter((cur) => (cur === i ? null : i));
                  setQuery("");
                }}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[10px] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold md:py-1 ${
                  fieldFilter === i ? "border-gold/60 bg-gold/10 text-paper" : "border-white/10 text-mist hover:border-white/25"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.color }} />
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaperList({
  title,
  tone,
  ids,
  graph,
  yearMax,
  onPick,
}: {
  title: string;
  tone: "gold" | "teal";
  ids: number[];
  graph: Graph;
  yearMax: number;
  onPick: (id: number) => void;
}) {
  const items = ids
    .map((id) => graph.papers[id])
    .filter((p) => p.year <= yearMax)
    .sort((a, b) => b.year - a.year);
  return (
    <section className="mt-5">
      <h4 className={`font-mono text-[10px] uppercase tracking-[0.2em] ${tone === "gold" ? "text-gold" : "text-teal-light"}`}>
        {title} · {items.length}
      </h4>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-mist/70">None in the visible timeline.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.slice(0, 12).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p.id)}
                className={`group flex w-full items-baseline gap-2 rounded-md border-l-2 px-2 py-1.5 text-left transition-colors hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none ${
                  tone === "gold" ? "border-gold/50" : "border-teal/60"
                }`}
              >
                <span className="font-mono text-[10px] text-mist">{p.year}</span>
                <span className="min-w-0 flex-1 text-xs leading-snug text-paper group-hover:text-gold-light">
                  {p.titleAr ? (
                    <span dir="rtl" lang="ar" className="font-arabic">
                      {p.titleAr}
                    </span>
                  ) : (
                    p.title
                  )}
                </span>
              </button>
            </li>
          ))}
          {items.length > 12 && <li className="px-2 font-mono text-[10px] text-mist">+{items.length - 12} more</li>}
        </ul>
      )}
    </section>
  );
}
