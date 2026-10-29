"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  COLLECTIONS,
  FALLBACK,
  KEEP_THRESHOLD,
  PASSAGE_COUNT,
  PASSAGES,
  SCRIPTS,
  TOKENS,
  isArabic,
  matchScript,
  wordCount,
  type Script,
  type Seg,
} from "./rag/corpus";
import SourceCard from "./rag/SourceCard";
import { Segmented, SimBadge, focusRing } from "./rag/ui";
import { brand } from "@/content/site";

type Lang = "en" | "ar";
type Phase = "normalise" | "retrieve" | "rerank" | "generate" | "done";
const PHASES: { id: Phase; label: string }[] = [
  { id: "normalise", label: "Normalise" },
  { id: "retrieve", label: "Retrieve" },
  { id: "rerank", label: "Re-rank" },
  { id: "generate", label: "Generate" },
];
const phaseIndex = (p: Phase) => (p === "done" ? 4 : PHASES.findIndex((x) => x.id === p));

type Turn = { id: number; asked: string; scriptId: string | null; matched: boolean };
type Run = { turnId: number; phase: Phase; trace: number; progress: number };
type Active = { turnId: number; n: number };

const scriptById = (id: string | null) => SCRIPTS.find((s) => s.id === id) ?? null;

export default function RagDemo() {
  const reduce = Boolean(useReducedMotion());
  const [turns, setTurns] = useState<Turn[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [active, setActive] = useState<Active | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [panelTurnId, setPanelTurnId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const threadRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  const busy = Boolean(run && run.phase !== "done");

  // Drive the pipeline state machine.
  useEffect(() => {
    if (!run || run.phase === "done") return;
    const turn = turns.find((t) => t.id === run.turnId);
    const script = scriptById(turn?.scriptId ?? null);
    if (!script) return;
    const advance = (patch: Partial<Run>) => setRun((r) => (r && r.turnId === run.turnId ? { ...r, ...patch } : r));
    let t = 0;
    switch (run.phase) {
      case "normalise":
        t = window.setTimeout(
          () => (run.trace < script.trace.length ? advance({ trace: run.trace + 1 }) : advance({ phase: "retrieve" })),
          run.trace < script.trace.length ? 340 : 280,
        );
        break;
      case "retrieve":
        t = window.setTimeout(() => advance({ phase: "rerank" }), 1600);
        break;
      case "rerank":
        t = window.setTimeout(() => advance({ phase: "generate" }), 1150);
        break;
      case "generate": {
        const total = TOKENS[script.id][langRef.current].length;
        const next = run.progress + 2 / total;
        t = window.setTimeout(() => advance(next >= 1 ? { progress: 1, phase: "done" } : { progress: next }), 42);
        break;
      }
    }
    return () => window.clearTimeout(t);
  }, [run, turns]);

  // Keep the thread pinned to the latest content.
  const scrollKey = `${turns.length}:${run?.phase}:${run?.trace}:${Math.floor((run?.progress ?? 0) * 10)}`;
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [scrollKey, reduce]);

  // Bring the cited source card into view inside the panel.
  useEffect(() => {
    if (!active) return;
    const turn = turns.find((t) => t.id === active.turnId);
    const cite = scriptById(turn?.scriptId ?? null)?.citations.find((c) => c.n === active.n);
    const box = sourcesRef.current;
    if (!cite || !box) return;
    const id = window.setTimeout(() => {
      const el = box.querySelector<HTMLElement>(`[data-pid="${cite.pid}"]`);
      if (el) box.scrollTo({ top: el.offsetTop - 8, behavior: reduce ? "auto" : "smooth" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [active, turns, reduce]);

  function ask(text: string, preset?: Script) {
    const q = text.trim();
    if (!q || busy) return;
    const script = preset ?? matchScript(q);
    const id = nextId.current++;
    setTurns((t) => [...t, { id, asked: q, scriptId: script?.id ?? null, matched: !preset && Boolean(script) }]);
    setDraft("");
    setActive(null);
    setExpanded(null);
    if (script) {
      setPanelTurnId(id);
      setRun(
        reduce
          ? { turnId: id, phase: "done", trace: script.trace.length, progress: 1 }
          : { turnId: id, phase: "normalise", trace: 0, progress: 0 },
      );
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(draft);
  }

  function cite(turnId: number, n: number) {
    setPanelTurnId(turnId);
    setExpanded(null);
    setActive((a) => (a && a.turnId === turnId && a.n === n ? null : { turnId, n }));
  }

  const stateOf = (turnId: number): Run =>
    run && run.turnId === turnId ? run : { turnId, phase: "done", trace: 99, progress: 1 };

  const panelTurn = turns.find((t) => t.id === panelTurnId) ?? null;
  const panelScript = scriptById(panelTurn?.scriptId ?? null);
  const panelState = panelTurn ? stateOf(panelTurn.id) : null;
  const pIdx = panelState ? phaseIndex(panelState.phase) : -1;

  const lastTurn = turns[turns.length - 1];
  const announce =
    lastTurn && stateOf(lastTurn.id).phase === "done"
      ? lastTurn.scriptId
        ? `Answer ready, citing ${scriptById(lastTurn.scriptId)?.citations.length ?? 0} source spans.`
        : FALLBACK.en
      : "";

  return (
    <MotionConfig reducedMotion="user">
      <div className="glass relative flex flex-col overflow-hidden rounded-2xl md:h-[600px]">
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
        {/* Header */}
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.08] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{brand.short} Labs · Arabic RAG console</p>
              <h3 className="font-serif text-lg leading-tight text-paper">Ask the archive</h3>
            </div>
          </div>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-mist/70 lg:block">
            Corpus · {PASSAGE_COUNT} passages · {Object.keys(COLLECTIONS).length} fictional collections
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Segmented<Lang>
              label="Answer language"
              value={lang}
              onChange={setLang}
              options={[
                { id: "en", label: "EN", title: "Answer in English" },
                { id: "ar", label: "عربي", title: "Answer in Arabic" },
              ]}
            />
            <SimBadge className="hidden sm:inline-flex" />
          </div>
          <SimBadge className="sm:hidden" />
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[1.25fr_1fr]">
          {/* Conversation */}
          <section aria-label="Conversation" className="flex min-h-0 flex-col">
            <div
              ref={threadRef}
              data-lenis-prevent
              className="max-h-[440px] min-h-[260px] flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5 md:max-h-none"
            >
              <div className="max-w-[90%] text-sm leading-relaxed text-mist">
                <p>
                  Ask in Arabic or English. Answers are grounded only in a small, invented corpus:{" "}
                  {Object.values(COLLECTIONS).map((c, i, arr) => (
                    <span key={c.en}>
                      <em className="not-italic text-paper/80">{c.en}</em>
                      {i < arr.length - 1 ? ", " : "."}
                    </span>
                  ))}{" "}
                  Every claim is cited to the exact span it came from.
                </p>
              </div>

              {turns.map((turn) => (
                <TurnView
                  key={turn.id}
                  turn={turn}
                  state={stateOf(turn.id)}
                  lang={lang}
                  active={active?.turnId === turn.id ? active.n : null}
                  onCite={(n) => cite(turn.id, n)}
                />
              ))}
            </div>

            <div className="border-t border-white/[0.08] px-4 pb-4 pt-3 sm:px-5">
              <div className="mb-3 flex flex-wrap gap-2" aria-label="Suggested questions">
                {SCRIPTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={busy}
                    onClick={() => ask(s.q, s)}
                    title={s.gloss}
                    dir={s.dir}
                    lang={s.dir === "rtl" ? "ar" : "en"}
                    className={`rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left text-paper/85 transition-colors hover:border-gold/40 hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-40 ${focusRing} ${
                      s.dir === "rtl" ? "font-arabic text-[13px]" : "text-xs"
                    }`}
                  >
                    {s.q}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <label htmlFor="rag-input" className="sr-only">
                  Ask the archive a question
                </label>
                <input
                  id="rag-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  dir="auto"
                  autoComplete="off"
                  placeholder="Ask in Arabic or English…"
                  className={`min-w-0 flex-1 rounded-xl border border-white/10 bg-ink/60 px-3.5 py-2.5 text-sm text-paper placeholder:text-mist/50 focus:border-gold/50 ${focusRing} ${
                    isArabic(draft) ? "font-arabic" : ""
                  }`}
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  className={`rounded-xl bg-gold px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-opacity hover:bg-gold-light disabled:opacity-40 ${focusRing}`}
                >
                  {busy ? "Working" : "Ask"}
                </button>
              </form>
            </div>
          </section>

          {/* Pipeline + sources */}
          <aside
            aria-label="Retrieval pipeline and sources"
            className="flex min-h-0 flex-col border-t border-white/[0.08] bg-ink/30 md:border-l md:border-t-0"
          >
            <ol className="grid grid-cols-4 gap-1 border-b border-white/[0.08] px-4 py-3">
              {PHASES.map((p, i) => {
                const status = pIdx > i ? "done" : pIdx === i ? "active" : "idle";
                return (
                  <li key={p.id} className="flex flex-col gap-1.5" aria-current={status === "active" ? "step" : undefined}>
                    <span className="relative h-0.5 overflow-hidden rounded-full bg-white/10">
                      <span
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                          status === "done"
                            ? "w-full bg-gold"
                            : status === "active"
                              ? "w-1/2 bg-teal motion-safe:animate-pulse"
                              : "w-0"
                        }`}
                      />
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                        status === "idle" ? "text-mist/50" : status === "active" ? "text-teal-light" : "text-gold-light"
                      }`}
                    >
                      {p.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div
              ref={sourcesRef}
              data-lenis-prevent
              className="relative max-h-[420px] min-h-[220px] flex-1 overflow-y-auto px-4 py-3 md:max-h-none"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">Source passages</span>
                {panelScript && pIdx >= 1 && (
                  <span className="font-mono text-[10px] text-mist/70">
                    {pIdx >= 2 ? "cross-encoder re-rank" : "hybrid dense + BM25"}
                  </span>
                )}
              </div>
              {panelScript && panelTurn && pIdx >= 1 ? (
                <SourceList
                  key={panelTurn.id}
                  script={panelScript}
                  reranked={pIdx >= 2}
                  active={active && active.turnId === panelTurn.id ? active.n : null}
                  expanded={expanded}
                  onToggle={(pid) => {
                    setActive(null);
                    setExpanded((e) => (e === pid ? null : pid));
                  }}
                  instant={reduce}
                />
              ) : (
                <EmptyIndex waiting={Boolean(panelScript)} />
              )}
            </div>

            <Readout script={panelScript} state={panelState} lang={lang} />
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}

function TurnView({
  turn,
  state,
  lang,
  active,
  onCite,
}: {
  turn: Turn;
  state: Run;
  lang: Lang;
  active: number | null;
  onCite: (n: number) => void;
}) {
  const script = scriptById(turn.scriptId);
  const qAr = isArabic(turn.asked);
  const idx = phaseIndex(state.phase);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <p
          dir={qAr ? "rtl" : "ltr"}
          lang={qAr ? "ar" : "en"}
          className={`max-w-[85%] rounded-2xl rounded-br-sm border border-gold/20 bg-gold/[0.08] px-3.5 py-2 text-paper ${
            qAr ? "font-arabic text-[15px] leading-loose" : "text-sm"
          }`}
        >
          {turn.asked}
        </p>
      </div>

      {!script ? (
        <AssistantShell>
          <p dir={lang === "ar" ? "rtl" : "ltr"} className={lang === "ar" ? "font-arabic text-[15px] leading-loose" : "text-sm"}>
            {FALLBACK[lang]}
          </p>
        </AssistantShell>
      ) : (
        <AssistantShell>
          <div className="mb-3 space-y-1 rounded-lg border border-white/[0.06] bg-ink/50 px-3 py-2.5 font-mono text-[11px]">
            {turn.matched && <TraceRow k="matched query" v={script.q} dir={script.dir} />}
            {script.trace.slice(0, Math.min(state.trace, script.trace.length)).map((t) => (
              <TraceRow key={t.k} k={t.k} v={t.v} dir={t.dir} />
            ))}
            {idx >= 1 && (
              <TraceRow k="retrieve" v={`${script.retrieve.length} candidates · top-k ${script.retrieve.length}`} dir="ltr" />
            )}
            {idx >= 2 && (
              <TraceRow
                k="re-rank"
                v={`kept ${Object.values(script.rerank).filter((s) => s >= KEEP_THRESHOLD).length} ≥ ${KEEP_THRESHOLD.toFixed(2)}`}
                dir="ltr"
              />
            )}
            {idx < 3 && (
              <span className="block text-teal-light/80 motion-safe:animate-pulse" aria-hidden>
                ▍
              </span>
            )}
          </div>
          {idx >= 3 && (
            <Answer
              tokens={TOKENS[script.id][lang]}
              progress={state.progress}
              streaming={state.phase === "generate"}
              lang={lang}
              active={active}
              onCite={onCite}
              script={script}
            />
          )}
        </AssistantShell>
      )}
    </div>
  );
}

function AssistantShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-teal/40 bg-teal/10 font-serif text-[11px] italic text-teal-light"
      >
        si
      </span>
      <div className="min-w-0 flex-1 text-paper/90">{children}</div>
    </div>
  );
}

function TraceRow({ k, v, dir }: { k: string; v: string; dir: "rtl" | "ltr" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-baseline gap-3"
    >
      <span className="w-28 shrink-0 text-[10px] uppercase tracking-[0.1em] text-mist/60">{k}</span>
      <span
        dir={dir}
        lang={dir === "rtl" ? "ar" : undefined}
        className={`min-w-0 flex-1 text-teal-light ${dir === "rtl" ? "text-right font-arabic text-[13px]" : ""}`}
      >
        {v}
      </span>
    </motion.div>
  );
}

function Answer({
  tokens,
  progress,
  streaming,
  lang,
  active,
  onCite,
  script,
}: {
  tokens: Seg[];
  progress: number;
  streaming: boolean;
  lang: Lang;
  active: number | null;
  onCite: (n: number) => void;
  script: Script;
}) {
  const shown = Math.min(tokens.length, Math.ceil(progress * tokens.length));
  const nodes: React.ReactNode[] = [];
  let buf = "";
  for (let i = 0; i < shown; i++) {
    const t = tokens[i];
    if (typeof t === "number") {
      if (buf) nodes.push(<span key={`s${i}`}>{buf}</span>);
      buf = "";
      const c = script.citations.find((x) => x.n === t);
      const p = c ? PASSAGES[c.pid] : null;
      nodes.push(
        <button
          key={`c${i}`}
          type="button"
          onClick={() => onCite(t)}
          aria-pressed={active === t}
          aria-label={`Citation ${t}${p ? `: ${COLLECTIONS[p.collection].en}, ${p.ref}` : ""}`}
          className={`mx-0.5 inline-flex h-[18px] min-w-[18px] -translate-y-1 items-center justify-center rounded px-1 align-baseline font-mono text-[10px] leading-none transition-colors ${focusRing} ${
            active === t ? "bg-gold text-ink" : "bg-gold/15 text-gold-light hover:bg-gold/30"
          }`}
        >
          {t}
        </button>,
      );
    } else buf += t;
  }
  if (buf) nodes.push(<span key="tail">{buf}</span>);

  return (
    <p
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className={lang === "ar" ? "font-arabic text-[16px] leading-[2]" : "text-[15px] leading-relaxed"}
    >
      {nodes}
      {streaming && (
        <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-gold motion-safe:animate-pulse" />
      )}
    </p>
  );
}

function SourceList({
  script,
  reranked,
  active,
  expanded,
  onToggle,
  instant,
}: {
  script: Script;
  reranked: boolean;
  active: number | null;
  expanded: string | null;
  onToggle: (pid: string) => void;
  instant: boolean;
}) {
  const order = useMemo(
    () =>
      reranked ? [...script.retrieve].sort((a, b) => (script.rerank[b.pid] ?? 0) - (script.rerank[a.pid] ?? 0)) : script.retrieve,
    [script, reranked],
  );
  const activeCite = script.citations.find((c) => c.n === active);

  return (
    <ul className="space-y-2">
      {order.map((r, i) => {
        const cites = script.citations.filter((c) => c.pid === r.pid);
        const rel = script.rerank[r.pid] ?? 0;
        return (
          <SourceCard
            key={r.pid}
            passage={PASSAGES[r.pid]}
            rank={i}
            score={reranked ? rel : r.score}
            scoreKind={reranked ? "rel" : "cos"}
            dropped={reranked && rel < KEEP_THRESHOLD}
            expanded={expanded === r.pid}
            citedNs={reranked ? cites.map((c) => c.n) : []}
            spans={{ ar: cites.map((c) => c.ar), en: cites.map((c) => c.en) }}
            activeSpan={activeCite && activeCite.pid === r.pid ? activeCite : undefined}
            instant={instant}
            onToggle={() => onToggle(r.pid)}
          />
        );
      })}
    </ul>
  );
}

function EmptyIndex({ waiting }: { waiting: boolean }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-4 text-center">
      <div aria-hidden className="grid grid-cols-9 gap-1.5">
        {Array.from({ length: 27 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${waiting ? "bg-teal/60 motion-safe:animate-pulse" : "bg-gold/25"}`}
            style={{ animationDelay: `${(i % 9) * 90}ms` }}
          />
        ))}
      </div>
      <p className="max-w-[16rem] font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-mist/70">
        {waiting ? "Normalising query…" : `Index ready · ${PASSAGE_COUNT} passages · ask a question to retrieve`}
      </p>
    </div>
  );
}

function Readout({ script, state, lang }: { script: Script | null; state: Run | null; lang: Lang }) {
  const idx = state ? phaseIndex(state.phase) : -1;
  const tokens = script ? TOKENS[script.id][lang] : [];
  const shownTokens = script && state && idx >= 3 ? wordCount(tokens, Math.ceil(state.progress * tokens.length)) : 0;
  const kept = script ? Object.values(script.rerank).filter((s) => s >= KEEP_THRESHOLD).length : 0;
  const firstToken = script ? script.ms.normalise + script.ms.retrieve + script.ms.rerank : 0;
  const total = script ? firstToken + script.ms.generate : 0;

  const cells = [
    { k: "first token", v: script && idx >= 3 ? `${firstToken} ms` : "—" },
    { k: "total", v: script && idx >= 4 ? `${(total / 1000).toFixed(2)} s` : "—" },
    { k: "tokens", v: script && idx >= 3 ? String(shownTokens) : "—" },
    { k: "sources", v: script && idx >= 2 ? `${kept}/${script.retrieve.length}` : "—" },
  ];
  return (
    <dl className="grid grid-cols-4 border-t border-white/[0.08] bg-ink/40">
      {cells.map((c) => (
        <div key={c.k} className="border-r border-white/[0.06] px-3 py-2.5 last:border-r-0">
          <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist/60">{c.k}</dt>
          <dd className="mt-0.5 font-mono text-xs tabular-nums text-paper">{c.v}</dd>
        </div>
      ))}
    </dl>
  );
}
