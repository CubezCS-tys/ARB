"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { PAGES, PH, PW, confColor, confLabel, layoutPage, type Fonts, type Line, type Page } from "./ocr/pages";
import { drawClean, drawScan } from "./ocr/render";
import { Segmented, SimBadge, focusRing } from "./rag/ui";

type PageId = Page["id"];

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

export default function OcrDemo() {
  const reduce = Boolean(useReducedMotion());
  const uid = useId().replace(/:/g, "");
  const [pageId, setPageId] = useState<PageId>("ar");
  const [scan, setScan] = useState(reduce ? 0.55 : 0);
  const [auto, setAuto] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [fonts, setFonts] = useState<Fonts | null>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const rawRef = useRef<HTMLCanvasElement>(null);
  const cleanRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef(scan);
  scanRef.current = scan;
  const dragging = useRef(false);
  const started = useRef(false);

  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0];
  const ltr = page.sweep === "ltr";
  const x = ltr ? scan : 1 - scan; // handle position from the left, 0..1

  // Resolve the brand fonts (next/font CSS variables) and wait for them before measuring.
  useEffect(() => {
    let alive = true;
    const cs = getComputedStyle(document.body);
    const f: Fonts = {
      arabic: cs.getPropertyValue("--font-arabic").trim() || "serif",
      display: cs.getPropertyValue("--font-playfair").trim() || "Georgia, serif",
    };
    Promise.all([document.fonts.load(`20px ${f.arabic}`, "القمح"), document.fonts.load(`20px ${f.display}`, "JOURNAL")])
      .catch(() => undefined)
      .finally(() => {
        if (alive) setFonts(f);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Track the rendered page width.
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const laid = useMemo(() => (fonts ? layoutPage(page, fonts) : null), [page, fonts]);

  useEffect(() => {
    if (!laid || !fonts || !width || !rawRef.current || !cleanRef.current) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    drawScan(rawRef.current, laid, fonts, width, dpr);
    drawClean(cleanRef.current, laid, fonts, width, dpr);
  }, [laid, fonts, width]);

  // First auto-scan when the demo scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (reduce) {
      if (!started.current) {
        started.current = true;
        setScan(0.55);
      }
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          setAuto(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  // Auto-scan animation.
  useEffect(() => {
    if (!auto) return;
    if (reduce) {
      setScan(1);
      setAuto(false);
      return;
    }
    const s0 = scanRef.current >= 0.99 ? 0 : scanRef.current;
    const dur = 3800 * (1 - s0) + 300;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      setScan(s0 + (1 - s0) * ease(k));
      if (k < 1) raf = requestAnimationFrame(tick);
      else setAuto(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto, reduce]);

  function choosePage(id: PageId) {
    if (id === pageId) return;
    setPageId(id);
    setHover(null);
    if (reduce) setScan(0.55);
    else {
      setScan(0);
      setAuto(true);
      started.current = true;
    }
  }

  const setFromClientX = useCallback(
    (clientX: number) => {
      const r = pageRef.current?.getBoundingClientRect();
      if (!r || r.width === 0) return;
      const nx = clamp((clientX - r.left) / r.width);
      setScan(ltr ? nx : 1 - nx);
    },
    [ltr],
  );

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const onHandle = (e.target as HTMLElement).closest("[data-scan-handle]");
    if (e.pointerType !== "mouse" && !onHandle) return;
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setAuto(false);
    setFromClientX(e.clientX);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging.current) setFromClientX(e.clientX);
  }
  function onPointerUp() {
    dragging.current = false;
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.1 : 0.02;
    let nx: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") nx = x - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") nx = x + step;
    else if (e.key === "PageDown") nx = x - 0.1;
    else if (e.key === "PageUp") nx = x + 0.1;
    else if (e.key === "Home") nx = 0;
    else if (e.key === "End") nx = 1;
    if (nx === null) return;
    e.preventDefault();
    setAuto(false);
    const c = clamp(nx);
    setScan(ltr ? c : 1 - c);
  }

  const lines = laid?.lines ?? [];
  const allWords = lines.flatMap((l) => l.words);
  const seen = allWords.filter((w) => w.u <= scan);
  const meanConf = seen.length ? seen.reduce((a, w) => a + w.conf, 0) / seen.length : 0;
  const lowCount = seen.filter((w) => w.conf < 0.82).length;
  const clip = ltr ? `inset(0 ${((1 - x) * 100).toFixed(3)}% 0 0)` : `inset(0 0 0 ${(x * 100).toFixed(3)}%)`;

  return (
    <div ref={rootRef} className="glass relative flex flex-col overflow-hidden rounded-2xl md:h-[600px]">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.08] px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">SI Labs · OCR engine</p>
          <h3 className="font-serif text-lg leading-tight text-paper">Read the page</h3>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Segmented<PageId>
            label="Sample page"
            value={pageId}
            onChange={choosePage}
            options={PAGES.map((p) => ({ id: p.id, label: p.label, title: p.caption }))}
          />
          <SimBadge />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_340px]">
        {/* Stage */}
        <section aria-label="Scanned page" className="flex min-h-0 flex-col">
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-5"
            style={{
              backgroundImage: "radial-gradient(rgba(154,167,189,0.12) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          >
            <div
              ref={pageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative aspect-[4/5] w-full max-w-[420px] cursor-ew-resize select-none overflow-hidden rounded-[3px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] md:h-full md:w-auto md:max-w-full"
              style={{ touchAction: "pan-y" }}
            >
              <canvas
                ref={rawRef}
                role="img"
                aria-label={`Simulated degraded scan of a ${page.label.toLowerCase()} sample page: ${page.caption}`}
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0" style={{ clipPath: clip, WebkitClipPath: clip }}>
                <canvas ref={cleanRef} aria-hidden className="absolute inset-0 h-full w-full" />
                {laid && (
                  <svg viewBox={`0 0 ${PW} ${PH}`} className="absolute inset-0 h-full w-full" aria-hidden>
                    <defs>
                      <marker id={`${uid}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M0,0 L8,4 L0,8 z" fill="#4C9DAB" />
                      </marker>
                    </defs>
                    {showBoxes &&
                      lines.map((l) => (
                        <g key={l.key} transform={blockTransform(l)}>
                          {l.words.map((w, i) => (
                            <rect
                              key={i}
                              x={w.x0 - 1.5}
                              y={w.y0}
                              width={w.x1 - w.x0 + 3}
                              height={w.y1 - w.y0}
                              rx={1.5}
                              fill={confColor(w.conf)}
                              fillOpacity={0.12}
                              stroke={confColor(w.conf)}
                              strokeWidth={0.8}
                            />
                          ))}
                        </g>
                      ))}
                    {showOrder && <ReadingOrder lines={lines} marker={`url(#${uid}-arrow)`} />}
                  </svg>
                )}
              </div>
              {laid && hover && (
                <svg viewBox={`0 0 ${PW} ${PH}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                  {lines
                    .filter((l) => l.key === hover)
                    .map((l) => (
                      <rect
                        key={l.key}
                        transform={blockTransform(l)}
                        x={l.x0 - 5}
                        y={l.y0 - 3}
                        width={l.x1 - l.x0 + 10}
                        height={l.y1 - l.y0 + 6}
                        rx={3}
                        fill="rgba(203,175,126,0.14)"
                        stroke="#CBAF7E"
                        strokeDasharray="3 2"
                        strokeWidth={1}
                      />
                    ))}
                </svg>
              )}

              {/* Region labels */}
              <span
                className="pointer-events-none absolute top-2 rounded bg-ink/75 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-teal-light"
                style={{ [ltr ? "left" : "right"]: 8, opacity: scan > 0.18 ? 1 : 0, transition: "opacity .3s" }}
              >
                Recognised
              </span>
              <span
                className="pointer-events-none absolute top-2 rounded bg-ink/75 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gold-light"
                style={{ [ltr ? "right" : "left"]: 8, opacity: scan < 0.82 ? 1 : 0, transition: "opacity .3s" }}
              >
                Raw scan
              </span>

              {/* Scanner handle */}
              <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: `${x * 100}%` }}>
                <div
                  aria-hidden
                  className="absolute inset-y-0 w-10"
                  style={{
                    [ltr ? "left" : "right"]: 0,
                    background: `linear-gradient(${ltr ? "90deg" : "270deg"}, rgba(124,196,207,0.28), rgba(124,196,207,0))`,
                  }}
                />
                <div aria-hidden className="absolute inset-y-0 -left-px w-[2px] bg-teal-light shadow-[0_0_14px_2px_rgba(124,196,207,0.7)]" />
                <div
                  data-scan-handle
                  role="slider"
                  tabIndex={0}
                  aria-label="Scanner position"
                  aria-orientation="horizontal"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(scan * 100)}
                  aria-valuetext={`${Math.round(scan * 100)}% of the page recognised`}
                  onKeyDown={onKey}
                  className={`pointer-events-auto absolute left-0 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-teal-light/70 bg-ink/80 text-teal-light shadow-[0_0_24px_rgba(76,157,171,0.45)] backdrop-blur ${focusRing}`}
                  style={{ touchAction: "none" }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path d="M9 6 3 12l6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {!laid && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/60 font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
                  Calibrating scanner…
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => setAuto((a) => !a)}
              className={`inline-flex items-center gap-2 rounded-full bg-teal/90 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-teal-light ${focusRing}`}
            >
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full bg-ink ${auto ? "motion-safe:animate-pulse" : ""}`} />
              {auto ? "Stop" : "Auto-scan"}
            </button>
            <Toggle on={showBoxes} onClick={() => setShowBoxes((v) => !v)} label="Show boxes" />
            <Toggle on={showOrder} onClick={() => setShowOrder((v) => !v)} label="Reading order" />
            <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-mist" role="group" aria-label="Confidence legend">
              {[
                ["#7CC4CF", "≥ 93%"],
                ["#CBAF7E", "82–93%"],
                ["#E08A6B", "< 82%"],
              ].map(([c, l]) => (
                <span key={l} className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-sm border" style={{ borderColor: c, background: `${c}33` }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Extracted text */}
        <aside aria-label="Extracted text" className="flex min-h-0 flex-col border-t border-white/[0.08] bg-ink/30 md:border-l md:border-t-0">
          <dl className="grid grid-cols-3 border-b border-white/[0.08]">
            {[
              ["words", `${seen.length}/${allWords.length}`],
              ["mean conf", seen.length ? `${(meanConf * 100).toFixed(1)}%` : "—"],
              ["flagged", String(lowCount)],
            ].map(([k, v]) => (
              <div key={k} className="border-r border-white/[0.06] px-3 py-2.5 last:border-r-0">
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist/60">{k}</dt>
                <dd className="mt-0.5 font-mono text-xs tabular-nums text-paper">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-b border-white/[0.06] px-4 py-2 font-mono text-[10px] text-mist/70">
            {page.caption} · deskew {page.skew > 0 ? "−" : "+"}
            {Math.abs(page.skew).toFixed(1)}° · {ltr ? "sweep →" : "sweep ←"}
          </p>
          <div data-lenis-prevent className="max-h-[380px] min-h-[200px] flex-1 space-y-1 overflow-y-auto px-3 py-3 md:max-h-none">
            {lines.map((l, i) => (
              <LineRow
                key={l.key}
                line={l}
                scan={scan}
                showLabel={i === 0 || lines[i - 1].block.id !== l.block.id}
                hovered={hover === l.key}
                onHover={setHover}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function blockTransform(l: Line) {
  const b = l.block;
  return `translate(${b.x} ${b.y})${b.rot ? ` rotate(${b.rot})` : ""}`;
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${focusRing} ${
        on ? "border-gold/50 bg-gold/10 text-gold-light" : "border-white/10 text-mist hover:text-paper"
      }`}
    >
      <span aria-hidden className={`relative h-2.5 w-5 rounded-full transition-colors ${on ? "bg-gold/60" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-1.5 w-1.5 rounded-full bg-paper transition-all ${on ? "left-3" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

function ReadingOrder({ lines, marker }: { lines: Line[]; marker: string }) {
  return (
    <g>
      {lines.map((l, i) => {
        const rtl = l.block.script === "ar";
        const sx = rtl ? l.x1 + 3 : l.x0 - 3;
        const ex = rtl ? l.x0 - 3 : l.x1 + 3;
        const next = lines[i + 1];
        const sameBlock = next && next.block.id === l.block.id;
        const nsx = next ? (next.block.script === "ar" ? next.x1 + 3 : next.x0 - 3) : 0;
        const bx = rtl ? sx + 9 : sx - 9;
        return (
          <g key={l.key} transform={blockTransform(l)}>
            <line x1={sx} y1={l.mid} x2={ex} y2={l.mid} stroke="#4C9DAB" strokeWidth={1} strokeOpacity={0.85} markerEnd={marker} />
            {sameBlock && (
              <line x1={ex} y1={l.mid} x2={nsx} y2={next.mid} stroke="#4C9DAB" strokeWidth={0.6} strokeOpacity={0.45} strokeDasharray="2 3" />
            )}
            <circle cx={bx} cy={l.mid} r={7} fill="#060B18" stroke="#7CC4CF" strokeWidth={0.8} />
            <text x={bx} y={l.mid + 2.8} textAnchor="middle" fontSize={8} fill="#F7F8FA" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {l.order}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const BLOCK_LABEL: Record<string, string> = {
  header: "Header",
  title: "Title",
  body: "Body",
  margin: "Marginal note",
  catchword: "Catchword",
  footnote: "Footnote",
  folio: "Folio",
};

function LineRow({
  line,
  scan,
  showLabel,
  hovered,
  onHover,
}: {
  line: Line;
  scan: number;
  showLabel: boolean;
  hovered: boolean;
  onHover: (k: string | null) => void;
}) {
  const rtl = line.block.script === "ar";
  const seen = line.words.filter((w) => w.u <= scan);
  const conf = seen.length ? seen.reduce((a, w) => a + w.conf, 0) / seen.length : 0;
  const done = seen.length === line.words.length;

  return (
    <div>
      {showLabel && (
        <p className="mb-1 mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-mist/60 first:mt-0">
          {BLOCK_LABEL[line.block.kind]} · {rtl ? "ar · rtl" : "lat · ltr"}
        </p>
      )}
      <div
        onMouseEnter={() => onHover(line.key)}
        onMouseLeave={() => onHover(null)}
        className={`rounded-md px-2 py-1 transition-colors ${hovered ? "bg-gold/[0.08]" : ""}`}
      >
        <p
          dir={rtl ? "rtl" : "ltr"}
          lang={rtl ? "ar" : "en"}
          className={rtl ? "font-arabic text-[14px] leading-[1.9] text-paper" : "text-[12.5px] leading-relaxed text-paper"}
        >
          {line.words.map((w, i) => {
            const on = w.u <= scan;
            const low = w.conf < 0.82;
            return (
              <span key={i}>
                {on ? (
                  <span
                    title={`${confLabel(w.conf)} confidence · ${(w.conf * 100).toFixed(1)}%`}
                    className={`transition-colors duration-300 ${low ? "underline decoration-[#E08A6B] decoration-dotted underline-offset-4" : ""}`}
                  >
                    {w.text}
                  </span>
                ) : (
                  <span aria-hidden className="select-none rounded-sm bg-white/[0.06] text-transparent">
                    {w.text}
                  </span>
                )}
                {i < line.words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </p>
        <div className="mt-1 flex items-center gap-2" aria-hidden={!seen.length}>
          <span className="w-5 font-mono text-[9px] tabular-nums text-mist/50">{String(line.order).padStart(2, "0")}</span>
          <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="block h-full rounded-full transition-[width] duration-300"
              style={{ width: `${(conf * 100).toFixed(1)}%`, background: confColor(conf), opacity: done ? 1 : 0.55 }}
            />
          </span>
          <span className="w-10 text-right font-mono text-[9px] tabular-nums text-mist">
            {seen.length ? `${(conf * 100).toFixed(0)}%` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
