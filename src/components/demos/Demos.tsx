"use client";

import { useState } from "react";
import RagDemo from "./RagDemo";
import OcrDemo from "./OcrDemo";
import MetadataDemo from "./MetadataDemo";
import CitationGraphDemo from "./CitationGraphDemo";

const tabs = [
  { id: "rag", label: "Ask the archive", sub: "Arabic RAG", Component: RagDemo },
  { id: "ocr", label: "Read the page", sub: "OCR", Component: OcrDemo },
  { id: "metadata", label: "Extract the record", sub: "Metadata & parsing", Component: MetadataDemo },
  { id: "graph", label: "Trace the citations", sub: "Citation index", Component: CitationGraphDemo },
] as const;

export default function Demos() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("rag");
  const current = tabs.find((t) => t.id === active)!;

  // Arrow keys move between tabs, per the WAI-ARIA tabs pattern
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setActive(next.id);
    document.getElementById(`demo-tab-${next.id}`)?.focus();
  };

  return (
    <section id="demos" className="relative mx-auto max-w-7xl px-4 py-32 sm:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="eyebrow mb-6">Live demonstrations</p>
        <h2 className="font-serif text-4xl leading-tight text-paper md:text-6xl">
          Don&apos;t take our word for it. <span className="text-gold-gradient italic">Try it.</span>
        </h2>
      </div>

      <div role="tablist" aria-label="Demonstrations" onKeyDown={onTabKey} className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`demo-tab-${t.id}`}
            aria-controls={`demo-panel-${t.id}`}
            aria-selected={active === t.id}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            className={`group rounded-xl border px-4 py-4 text-left transition-colors ${
              active === t.id
                ? "border-gold/60 bg-gold/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/25"
            }`}
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{t.sub}</span>
            <span className={`mt-1 block font-serif text-lg ${active === t.id ? "text-gold-light" : "text-paper"}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Each demo owns its own frame; keep heights similar (~600px desktop) to avoid layout jump */}
      <div
        key={current.id}
        role="tabpanel"
        id={`demo-panel-${current.id}`}
        aria-labelledby={`demo-tab-${current.id}`}
      >
        <current.Component />
      </div>
    </section>
  );
}
