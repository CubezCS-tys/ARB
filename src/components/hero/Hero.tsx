"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/scroll";
import HeroOverlay from "./HeroOverlay";
import CanvasBoundary from "./CanvasBoundary";
import { heroState } from "./heroState";
import { useIntroDone } from "./useIntroDone";

gsap.registerPlugin(ScrollTrigger);

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false, loading: () => null });

type Env = { mobile: boolean; reduced: boolean };

/**
 * Hero: a sticky full-viewport WebGL glyph field with the real headline on top.
 * The section is taller than the screen so scrolling through it scrubs the
 * field from drifting dust into ordered lines of text and a faint graph.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const introDone = useIntroDone();
  const [env, setEnv] = useState<Env | null>(null);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    setEnv({ mobile: mq.matches, reduced: prefersReducedMotion() });
  }, []);

  // Only render WebGL while the hero is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll scrub: drives the scene (via heroState) and the DOM copy.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !env || env.reduced) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          heroState.scroll = self.progress;
        },
      });
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 } })
        .to("[data-hero-copy]", { yPercent: -10, autoAlpha: 0, ease: "none", duration: 0.32 }, 0)
        .to("[data-hero-scroll]", { autoAlpha: 0, ease: "none", duration: 0.12 }, 0)
        .to("[data-hero-shade]", { opacity: 0.2, ease: "none", duration: 0.45 }, 0.05)
        .to("[data-hero-glow]", { opacity: 0.25, ease: "none", duration: 0.5 }, 0)
        .fromTo("[data-hero-caption]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, ease: "none", duration: 0.2 }, 0.58)
        .to({}, { duration: 0.22 }, 0.78);
    }, el);
    return () => {
      ctx.revert();
      heroState.scroll = 0;
    };
  }, [env]);

  const reduced = env?.reduced ?? false;

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="Introduction"
      className={`relative ${reduced ? "h-[100svh]" : "h-[200vh]"}`}
    >
      <div className="sticky top-0 h-[100svh] min-h-[560px] w-full overflow-hidden bg-ink">
        {/* Static backdrop: visible while the canvas loads, or if WebGL is unavailable. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(90% 70% at 30% 65%, rgba(16,27,45,0.95) 0%, rgba(6,11,24,0) 70%), radial-gradient(60% 55% at 75% 40%, rgba(34,50,79,0.55) 0%, rgba(6,11,24,0) 70%)",
          }}
        />

        {env && (
          <div
            aria-hidden
            className="absolute inset-0 transition-opacity duration-[1800ms] ease-out"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <CanvasBoundary>
              <HeroCanvas
                active={active}
                mobile={env.mobile}
                reduced={env.reduced}
                introDone={introDone}
                onReady={onReady}
              />
            </CanvasBoundary>
          </div>
        )}

        {/* Gold breath where the monogram forms, plus legibility gradients. */}
        <div aria-hidden data-hero-glow className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 mix-blend-screen [background:radial-gradient(38%_42%_at_50%_26%,rgba(203,175,126,0.10),transparent_70%)] md:[background:radial-gradient(32%_48%_at_75%_46%,rgba(203,175,126,0.10),transparent_70%)]" />
        </div>
        <div
          aria-hidden
          data-hero-shade
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent md:bg-gradient-to-r md:from-ink/85 md:via-ink/30 md:to-transparent"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />

        <HeroOverlay show={introDone} reduced={reduced} />
      </div>
    </section>
  );
}
