"use client";

import { motion, type Variants } from "framer-motion";
import { brand } from "@/content/site";
import { scrollToId } from "@/lib/scroll";

type Props = { show: boolean; reduced: boolean };

const EASE = [0.16, 1, 0.3, 1] as const;

const letter: Variants = {
  hidden: { y: "108%", opacity: 0, rotate: 4 },
  show: (i: number) => ({
    y: "0%",
    opacity: 1,
    rotate: 0,
    transition: { duration: 1.15, ease: EASE, delay: 0.35 + i * 0.035 },
  }),
};

const fade: Variants = {
  hidden: { y: 18, opacity: 0, filter: "blur(6px)" },
  show: (d: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: EASE, delay: d },
  }),
};

const insight: Variants = {
  hidden: { clipPath: "inset(-10% 100% -20% 0%)", opacity: 0, x: -12 },
  show: {
    clipPath: "inset(-10% -6% -20% 0%)",
    opacity: 1,
    x: 0,
    transition: { duration: 1.5, ease: EASE, delay: 0.95 },
  },
};

/** Splits a line into per-letter masked spans; returns the next letter index. */
function Letters({ text, start }: { text: string; start: number }) {
  return (
    <>
      {text.split(" ").map((word, w, words) => {
        const offset = start + words.slice(0, w).join("").length + w;
        return (
          <span key={w} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            {word.split("").map((ch, c) => (
              <motion.span key={c} custom={offset + c} variants={letter} className="inline-block origin-bottom-left">
                {ch}
              </motion.span>
            ))}
            {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        );
      })}
    </>
  );
}

export default function HeroOverlay({ show, reduced }: Props) {
  const state = reduced || show ? "show" : "hidden";
  const initial = reduced ? false : "hidden";

  return (
    <motion.div
      initial={initial}
      animate={state}
      className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col justify-end px-6 pb-32 pt-24 md:justify-center md:px-12 md:pb-12 lg:px-20"
    >
      <div data-hero-copy className="max-w-[52rem] will-change-transform">
        <motion.p variants={fade} custom={0.1} className="eyebrow">
          {brand.name} · {brand.tagline}
        </motion.p>

        <h1 className="mt-6 font-serif text-[clamp(3.4rem,10.5vw,9.75rem)] font-medium leading-[0.92] tracking-[-0.025em] text-paper md:mt-8">
          <span className="sr-only">From ink to insight.</span>
          <span aria-hidden className="block">
            <span className="block">
              <Letters text="From ink" start={0} />
            </span>
            <span className="block">
              <Letters text="to" start={8} />{" "}
              <motion.span variants={insight} className="text-gold-gradient -mb-[0.16em] inline-block pb-[0.26em] pr-[0.12em] italic">
                insight.
              </motion.span>
            </span>
          </span>
        </h1>

        <motion.p
          variants={fade}
          custom={1.25}
          lang="ar"
          dir="rtl"
          className="mt-4 inline-block font-arabic text-lg text-gold/60 md:text-xl"
        >
          من الحبر إلى البصيرة
        </motion.p>

        <motion.p variants={fade} custom={1.35} className="mt-5 max-w-xl text-base leading-relaxed text-mist md:text-lg">
          We build AI that reads Arabic and multilingual archives, from OCR on the hardest pages to metadata
          extraction, citation indexes and RAG answers cited to their sources.
        </motion.p>

        <motion.div variants={fade} custom={1.55} className="mt-9 flex flex-wrap items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => scrollToId("demos")}
            className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-colors duration-300 hover:bg-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            See it work
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2 8h11M9 4l4 4-4 4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToId("contact")}
            className="glass inline-flex items-center rounded-full px-7 py-3.5 text-sm text-paper transition-colors duration-300 hover:border-gold/40 hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Start a conversation
          </button>
        </motion.div>
      </div>

      <motion.button
        type="button"
        data-hero-scroll
        variants={fade}
        custom={2}
        onClick={() => scrollToId("story")}
        aria-label="Scroll to the story"
        className="absolute bottom-8 left-6 flex items-center gap-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.3em] text-mist transition-colors hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light md:left-12 lg:left-20"
      >
        <span className="relative block h-10 w-px overflow-hidden bg-white/15">
          {!reduced && (
            <motion.span
              className="absolute left-0 top-0 block h-3 w-px bg-gold"
              animate={{ y: [-12, 40] }}
              transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
            />
          )}
        </span>
        Scroll
      </motion.button>

      <p
        data-hero-caption
        className="pointer-events-none absolute inset-x-0 bottom-8 mx-auto flex w-fit items-center gap-3 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-mist opacity-0"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-teal shadow-[0_0_12px_rgba(76,157,171,0.9)]" />
        Read <span className="text-gold/60">·</span> Understand <span className="text-gold/60">·</span> Connect
      </p>
    </motion.div>
  );
}
