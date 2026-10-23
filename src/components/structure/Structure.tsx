"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { brand, divisions } from "@/content/site";
import Logo from "@/components/brand/Logo";
import { useInView, useMediaQuery } from "./hooks";
import type { DivisionId } from "./OrbitalScene";

const OrbitalScene = dynamic(() => import("./OrbitalScene"), { ssr: false });

const EASE = [0.22, 1, 0.36, 1] as const;

const DOT: Record<DivisionId, string> = {
  advisory: "bg-gold shadow-[0_0_12px_rgba(203,175,126,0.8)]",
  labs: "bg-mint shadow-[0_0_12px_rgba(127,227,201,0.7)]",
  research: "bg-paper shadow-[0_0_12px_rgba(247,248,250,0.6)]",
};

/** Static orbit diagram used when motion is reduced (decorative; the list carries the content). */
function StaticOrbits() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="si-core-static">
          <stop offset="0%" stopColor="#E3CFA6" />
          <stop offset="60%" stopColor="#CBAF7E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#CBAF7E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="215" rx="190" ry="70" fill="none" stroke="#8C7650" strokeOpacity="0.6" />
      {[70, 105, 140].map((r) => (
        <ellipse key={r} cx="200" cy="200" rx={r} ry={r * 0.36} fill="none" stroke="#CBAF7E" strokeOpacity="0.22" />
      ))}
      <circle cx="200" cy="200" r="60" fill="url(#si-core-static)" />
      <circle cx="200" cy="200" r="20" fill="#3A2E1C" stroke="#E3CFA6" />
      <circle cx="270" cy="200" r="7" fill="#CBAF7E" />
      <circle cx="120" cy="226" r="8" fill="#7FE3C9" />
      <circle cx="268" cy="152" r="7.5" fill="#F7F8FA" />
    </svg>
  );
}

export default function Structure() {
  const reduce = useReducedMotion() ?? false;
  const compact = useMediaQuery("(max-width: 767px)");
  const stageRef = useRef<HTMLDivElement>(null);
  const near = useInView(stageRef, "300px 0px");
  const visible = useInView(stageRef, "0px");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (near) setMounted(true);
  }, [near]);

  const [focused, setFocused] = useState<DivisionId | null>(null);
  const [hovered, setHovered] = useState<DivisionId | null>(null);
  const toggle = useCallback((id: DivisionId) => setFocused((f) => (f === id ? null : id)), []);

  const current = divisions.find((d) => d.id === (focused ?? hovered)) ?? null;

  const panel = (
    <div aria-live="polite" className="glass rounded-2xl p-6 md:p-7">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current?.id ?? "si"}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist/70">
            {current ? `${brand.short} division` : `Subsidiary of ${brand.parentShort}`}
          </p>
          <h3 className="mt-3 font-serif text-2xl text-paper md:text-3xl">{current ? current.name : brand.name}</h3>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{current ? current.line : brand.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-mist md:text-[15px]">
            {current
              ? current.body
              : `${brand.positioning} Three divisions share one core: strategy, platforms and research, each drawing on the same document intelligence.`}
          </p>
        </motion.div>
      </AnimatePresence>
      {focused && (
        <button
          type="button"
          onClick={() => setFocused(null)}
          className="mt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-teal-light underline-offset-4 outline-none hover:underline focus-visible:ring-1 focus-visible:ring-gold/70"
        >
          ← Back to the whole system
        </button>
      )}
    </div>
  );

  return (
    <section id="company" aria-labelledby="company-title" className="relative overflow-hidden bg-ink py-28 md:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_45%_at_70%_45%,rgba(203,175,126,0.07),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ---------- copy + hierarchy (real text, also the controls) ---------- */}
          <motion.div
            className="lg:col-span-5"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            <p className="eyebrow">The company</p>
            <h2 id="company-title" className="mt-6 font-serif text-[clamp(2.3rem,5vw,4.5rem)] leading-[1.02] tracking-[-0.02em] text-paper">
              One core. <em className="text-gold-gradient italic">Three</em> ways to work with it.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-mist">
              {brand.name} is a subsidiary of {brand.parent}. Every engagement draws on the same core of document intelligence,
              delivered through the division that fits the problem.
            </p>

            <nav aria-label="Company structure" className="mt-10">
              <ol className="font-sans text-sm">
                <li>
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist/60">Parent company</span>
                  <p className="mt-1 text-paper/90">
                    {brand.parent} <span className="text-mist/60">({brand.parentShort})</span>
                  </p>
                  <ol className="ml-[5px] mt-4 border-l border-gold/25 pl-6">
                    <li>
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist/60">Subsidiary</span>
                      <p className="mt-1 flex items-center gap-3 text-paper">
                        <Logo className="h-5" />
                        {brand.name}
                      </p>
                      <ol className="ml-[5px] mt-4 space-y-1 border-l border-gold/25 pl-4">
                        {divisions.map((d) => {
                          const on = focused === d.id;
                          return (
                            <li key={d.id}>
                              <button
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggle(d.id)}
                                onMouseEnter={() => setHovered(d.id)}
                                onMouseLeave={() => setHovered(null)}
                                onFocus={() => setHovered(d.id)}
                                onBlur={() => setHovered(null)}
                                className={`group flex w-full items-start gap-4 rounded-lg px-3 py-3 text-left outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-gold/70 ${
                                  on ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                                }`}
                              >
                                <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[d.id]}`} />
                                <span>
                                  <span className={`block font-serif text-lg ${on ? "text-gold-light" : "text-paper"}`}>{d.name}</span>
                                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-mist/70">{d.line}</span>
                                  {/* full description stays in the DOM for search engines and screen readers */}
                                  <span className="sr-only">. {d.body}</span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    </li>
                  </ol>
                </li>
              </ol>
            </nav>
          </motion.div>

          {/* ---------- orbital system ---------- */}
          <div className="lg:col-span-7">
            <div
              ref={stageRef}
              className="relative h-[340px] w-full md:h-[520px] lg:h-[640px]"
            >
              <div
                className="absolute inset-0"
                role="img"
                aria-label={`Diagram: ${brand.name} at the centre of ${brand.parent}, orbited by ${divisions.map((d) => d.name).join(", ")}.`}
              >
                {reduce ? (
                  <StaticOrbits />
                ) : (
                  mounted && (
                    <OrbitalScene
                      active={visible}
                      compact={compact}
                      focused={focused}
                      hovered={hovered}
                      onHover={setHovered}
                      onSelect={toggle}
                    />
                  )
                )}
              </div>
              {!compact && <div className="pointer-events-auto absolute z-10 bottom-4 left-4 right-4 max-w-md md:bottom-6 md:left-6">{panel}</div>}
              <p className="pointer-events-none absolute right-4 top-4 hidden font-mono text-[10px] uppercase tracking-[0.24em] text-mist/50 md:block">
                Select a division
              </p>
            </div>
            {compact && <div className="mt-4">{panel}</div>}
          </div>
        </div>

        {/* ---------- founding note ---------- */}
        {/* PLACEHOLDER: founders to supply bio/photo */}
        <motion.div
          className="mt-28 grid gap-10 border-t border-white/10 pt-16 md:mt-36 md:grid-cols-12"
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <div className="md:col-span-4">
            <p className="eyebrow">Founded by family</p>
          </div>
          <div className="md:col-span-8">
            <p className="font-serif text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[1.2] text-paper">
              {brand.name} was started by a father and his son, who share one conviction: the knowledge held in the world&rsquo;s
              documents deserves to be <em className="text-gold-gradient italic">used</em>, not just stored.
            </p>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-mist">
              One generation brings the patience and discipline of academic research; the next brings the pace of modern AI
              engineering. Together they run a small firm that treats every page, in every script, with the same care.
            </p>
            <p className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.24em]">
              <span className="text-gold">Rigour of research.</span>
              <span aria-hidden className="h-px w-8 bg-white/20" />
              <span className="text-teal-light">Speed of engineering.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
