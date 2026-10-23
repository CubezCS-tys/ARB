"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { capabilities } from "@/content/site";
import { useMediaQuery } from "@/components/structure/hooks";
import CapabilityRow from "./CapabilityRow";

const EASE = [0.22, 1, 0.36, 1] as const;
/** delay before a hovered row takes over, and how long to ignore hover while rows re-layout */
const INTENT_MS = 140;
const SETTLE_MS = 650;

export default function Capabilities() {
  const reduce = useReducedMotion() ?? false;
  const touch = useMediaQuery("(hover: none)");
  const [active, setActive] = useState(0);

  const activeRef = useRef(active);
  const timer = useRef<number | undefined>(undefined);
  const lockedUntil = useRef(0);

  const select = useCallback((i: number) => {
    window.clearTimeout(timer.current);
    if (i === activeRef.current) return;
    activeRef.current = i;
    lockedUntil.current = performance.now() + SETTLE_MS;
    setActive(i);
  }, []);

  // Hover intent: rows move as one expands and another collapses, so wait a beat
  // and ignore hover until the layout settles, otherwise the list chases the cursor.
  const intent = useCallback(
    (i: number) => {
      if (i === activeRef.current || performance.now() < lockedUntil.current) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => select(i), INTENT_MS);
    },
    [select],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="relative overflow-hidden bg-ink py-28 md:py-40">
      {/* faint gold light from the top-left, teal from the right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_40%_at_10%_0%,rgba(203,175,126,0.08),transparent_70%),radial-gradient(40%_40%_at_100%_60%,rgba(76,157,171,0.06),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <motion.div
            className="md:col-span-8"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            <p className="eyebrow">Capabilities</p>
            <h2 id="capabilities-title" className="mt-6 font-serif text-[clamp(2.4rem,6vw,5.5rem)] leading-[1] tracking-[-0.02em] text-paper">
              Six ways we turn documents into <em className="text-gold-gradient italic">decisions.</em>
            </h2>
          </motion.div>
          <motion.p
            className="max-w-sm text-base leading-relaxed text-mist md:col-span-4 md:justify-self-end"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
          >
            Each one is a stage of the same pipeline, from the first scanned page to the final cited answer, and each is built
            for Arabic first.
          </motion.p>
        </div>

        <div className="mt-16 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-mist/60 md:mt-24">
          <span>Index</span>
          <span aria-hidden>
            <span className="text-gold">{String(active + 1).padStart(2, "0")}</span> / {String(capabilities.length).padStart(2, "0")}
          </span>
        </div>

        <ol className="mt-4" aria-label="Capabilities">
          {capabilities.map((cap, i) => (
            <CapabilityRow
              key={cap.id}
              cap={cap}
              index={i}
              open={active === i}
              reduce={reduce}
              centreTracking={touch}
              onIntent={intent}
              onSelect={select}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
