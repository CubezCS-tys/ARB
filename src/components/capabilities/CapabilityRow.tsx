"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, type PointerEvent } from "react";
import type { capabilities } from "@/content/site";
import CapabilityVisual from "./MicroVisuals";

type Capability = (typeof capabilities)[number];

type Props = {
  cap: Capability;
  index: number;
  open: boolean;
  reduce: boolean;
  /** touch devices: open the row when it crosses the viewport centre */
  centreTracking: boolean;
  onIntent: (index: number) => void;
  onSelect: (index: number) => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CapabilityRow({ cap, index, open, reduce, centreTracking, onIntent, onSelect }: Props) {
  const ref = useRef<HTMLLIElement>(null);
  const num = String(index + 1).padStart(2, "0");
  const panelId = `cap-panel-${cap.id}`;
  const headId = `cap-head-${cap.id}`;

  // magnetic title + tilting visual, driven by the pointer position inside the row
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 140, damping: 18, mass: 0.6 });
  const titleX = useTransform(sx, (v) => v * 14);
  const tiltY = useTransform(sx, (v) => v * 9);
  const tiltX = useTransform(sy, (v) => v * -7);

  const onMove = (e: PointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== "mouse") return;
    onIntent(index);
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  useEffect(() => {
    if (!centreTracking) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onSelect(index);
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [centreTracking, index, onSelect]);

  return (
    <motion.li
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={reduce ? false : { opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 1, ease: EASE, delay: (index % 3) * 0.06 }}
      className="group relative border-t border-white/10 last:border-b"
    >
      {/* gold rule that draws across the active row */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -top-px left-0 h-px w-full origin-left bg-gradient-to-r from-gold via-gold-light to-transparent"
        initial={false}
        animate={{ scaleX: open ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
      />
      <h3 id={headId} className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onSelect(index)}
          onFocus={() => onSelect(index)}
          className="grid w-full grid-cols-[2.75rem_1fr_auto] items-baseline gap-x-4 py-7 text-left outline-none focus-visible:ring-1 focus-visible:ring-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-ink md:grid-cols-[5rem_1fr_auto] md:py-9"
        >
          <span
            className={`font-mono text-xs tracking-[0.2em] transition-colors duration-500 md:text-sm ${open ? "text-gold" : "text-mist/60"}`}
          >
            {num}
          </span>
          <motion.span
            style={{ x: titleX }}
            className={`block font-serif text-[clamp(1.6rem,4.6vw,4.25rem)] leading-[1.02] tracking-[-0.01em] transition-colors duration-500 ${
              open ? "text-paper" : "text-paper/40 group-hover:text-paper/70"
            }`}
          >
            {cap.title}
          </motion.span>
          <span className="hidden items-center gap-4 self-center md:flex">
            <span
              className={`font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-500 ${open ? "text-teal-light" : "text-mist/50"}`}
            >
              {cap.short}
            </span>
            <span
              aria-hidden
              className={`relative grid h-9 w-9 place-items-center rounded-full border transition-all duration-500 ${
                open ? "rotate-45 border-gold/70 text-gold" : "border-white/15 text-mist"
              }`}
            >
              <span className="absolute h-px w-3 bg-current" />
              <span className="absolute h-3 w-px bg-current" />
            </span>
          </span>
        </button>
      </h3>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={headId}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
        className="overflow-hidden"
      >
        <div className="grid gap-8 pb-10 pl-[calc(2.75rem+1rem)] md:grid-cols-[1fr_minmax(0,22rem)] md:gap-12 md:pb-14 md:pl-[calc(5rem+1rem)] lg:grid-cols-[1fr_minmax(0,26rem)]">
          <div className="max-w-xl">
            <p className="text-base leading-relaxed text-mist md:text-lg">{cap.body}</p>
            <p className="mt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
              <span aria-hidden className="h-px w-6 bg-gold/60" />
              {cap.proof}
            </p>
          </div>
          <div style={{ perspective: 900 }}>
            <motion.div
              style={{ rotateX: tiltX, rotateY: tiltY }}
              className="relative aspect-[13/8] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-midnight to-ink shadow-[0_30px_80px_-40px_rgba(203,175,126,0.35)]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(154,167,189,0.18)_1px,transparent_1px)] [background-size:14px_14px]"
              />
              <div className="relative h-full w-full p-3">
                {/* mounted only while open so off-screen loops cost nothing */}
                {open && <CapabilityVisual id={cap.id} reduce={reduce} />}
              </div>
              <span className="absolute bottom-2 right-3 font-mono text-[9px] uppercase tracking-[0.2em] text-mist/50">
                Illustrative
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}
