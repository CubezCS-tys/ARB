"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { brand } from "@/content/site";
import { MONO_DOTS, MONO_STEMS, MONO_TWO } from "@/components/brand/monogram";
import { prefersReducedMotion } from "@/lib/scroll";

/**
 * Cinematic intro (~2.7s) shown once per session.
 *
 * CONTRACT (other sections depend on it): when the intro finishes or is skipped,
 *   document.documentElement.dataset.intro = "done"
 *   window.dispatchEvent(new Event("si:intro-done"))
 * Both happen together, asynchronously (never inside the first effect pass), so
 * sibling components mounted after the Loader can still attach their listener.
 * A fallback timeout guarantees it fires even if the animation throws.
 */

const SEEN_KEY = "si:intro-seen";
const FALLBACK_MS = 4800;

function hasSeen() {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage unavailable (private mode, blocked cookies): just replay next time */
  }
}

function setLenis(running: boolean) {
  try {
    if (running) window.__lenis?.start();
    else window.__lenis?.stop();
  } catch {
    /* Lenis not ready or already destroyed */
  }
}

// The 2 drawn as a single hairline (viewBox 0 0 64 64), echoing the i2i monogram.
const TWO_PATH = "M22.5 31 C22.5 25.5 26.5 22.5 32 22.5 C37.5 22.5 41 26 41 30.5 C41 36.5 35 40.5 22 53.5 H42";
const STEM_PATH = MONO_STEMS.map((s) => `M${s.x} ${s.y} H${s.x + s.w} V${s.y + s.h} H${s.x} Z`).join(" ");
const DOT_PATH = MONO_DOTS.join(" ");

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    let announced = false;
    let finished = false;

    const announce = () => {
      if (announced) return;
      announced = true;
      markSeen();
      html.dataset.intro = "done";
      try {
        window.dispatchEvent(new Event("si:intro-done"));
      } catch {
        /* ancient browsers without the Event constructor */
      }
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      html.style.removeProperty("overflow");
      setLenis(true);
      announce();
      setVisible(false);
    };

    // Skip path: repeat visit in this session, or reduced motion.
    if (prefersReducedMotion() || hasSeen()) {
      const t = window.setTimeout(finish, 0);
      return () => window.clearTimeout(t);
    }

    html.dataset.intro = "playing";
    html.style.overflow = "hidden";
    setLenis(false);
    // Lenis is created in SmoothScroll's effect, which runs after this child effect.
    const raf = window.requestAnimationFrame(() => {
      if (!finished) setLenis(false);
    });
    const fallback = window.setTimeout(finish, FALLBACK_MS);

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.to(q("[data-progress]"), { scaleX: 1, duration: 2.15, ease: "power1.inOut" }, 0.05)
          // gold hairlines draw the monogram
          .to(q("[data-draw='s']"), { strokeDashoffset: 0, duration: 1.05, ease: "power2.inOut" }, 0.1)
          .to(q("[data-draw='stem']"), { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" }, 0.4)
          .to(q("[data-fill]"), { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.95)
          .to(q("[data-draw]"), { opacity: 0.25, duration: 0.6 }, 1.05)
          // the teal triangle drops in, with a small flash on landing
          .fromTo(
            q("[data-dot]"),
            { y: -26, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.42, ease: "back.out(2.4)" },
            1.05,
          )
          .fromTo(
            q("[data-flash]"),
            { scale: 0.2, opacity: 0, svgOrigin: "52.5 14" },
            { scale: 1.4, opacity: 0.85, duration: 0.16, ease: "power2.out" },
            1.34,
          )
          .to(q("[data-flash]"), { scale: 2.6, opacity: 0, duration: 0.55, ease: "power2.out" }, 1.5)
          // wordmark letter-spaces in, then the tagline
          .to(
            q("[data-word]"),
            { letterSpacing: "0.32em", marginRight: "-0.32em", opacity: 1, duration: 1, ease: "expo.out" },
            1.15,
          )
          .to(q("[data-tag]"), { y: 0, opacity: 1, duration: 0.6 }, 1.55)
          // exit: content lifts, a seam draws across, the two panels part along it
          .addLabel("exit", 2.2)
          .to(q("[data-content]"), { opacity: 0, y: -12, duration: 0.3, ease: "power2.in" }, "exit")
          .to(q("[data-seam]"), { scaleX: 1, duration: 0.3, ease: "power3.inOut" }, "exit+=0.05")
          .add(announce, "exit+=0.3")
          .to(q("[data-panel='top']"), { yPercent: -100, duration: 0.7, ease: "expo.inOut" }, "exit+=0.3")
          .to(q("[data-panel='bottom']"), { yPercent: 100, duration: 0.7, ease: "expo.inOut" }, "exit+=0.3")
          .to(q("[data-seam]"), { opacity: 0, duration: 0.3 }, "exit+=0.45")
          .add(finish);
      }, root);
    } catch {
      finish();
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      ctx?.revert();
      // Unmounting mid-intro (route change / strict-mode remount): release the page.
      html.style.removeProperty("overflow");
      setLenis(true);
    };
  }, []);

  if (!visible) return null;

  return (
    <div ref={root} aria-hidden="true" className="si-loader fixed inset-0 z-[100] overflow-hidden">
      {/* No-JS / catastrophic-failure safety net: fade the overlay away on its own. */}
      <style>{`
        @keyframes si-loader-out { to { opacity: 0; visibility: hidden; } }
        .si-loader { animation: si-loader-out 0.6s ease 6s forwards; }
      `}</style>

      <div
        data-panel="top"
        className="absolute inset-x-0 top-0 h-1/2 bg-ink"
        style={{
          backgroundImage: "radial-gradient(ellipse 60% 90% at 50% 100%, rgba(203,175,126,0.07), transparent 70%)",
        }}
      />
      <div
        data-panel="bottom"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
        style={{
          backgroundImage: "radial-gradient(ellipse 60% 90% at 50% 0%, rgba(203,175,126,0.07), transparent 70%)",
        }}
      />
      <div
        data-seam
        className="absolute inset-x-0 top-1/2 h-px origin-center bg-gradient-to-r from-transparent via-gold-light to-transparent"
        style={{ transform: "scaleX(0)" }}
      />

      <div data-content className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <svg viewBox="0 0 64 64" className="h-24 w-24 overflow-visible md:h-28 md:w-28">
          <defs>
            <linearGradient id="si-loader-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E3CFA6" />
              <stop offset="55%" stopColor="#CBAF7E" />
              <stop offset="100%" stopColor="#8C7650" />
            </linearGradient>
            <radialGradient id="si-loader-flash">
              <stop offset="0%" stopColor="#7CC4CF" stopOpacity="1" />
              <stop offset="40%" stopColor="#4C9DAB" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4C9DAB" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* filled monogram, revealed after the hairlines draw */}
          <g data-fill style={{ opacity: 0 }}>
            <text
              x={MONO_TWO.x}
              y={MONO_TWO.y}
              textAnchor="middle"
              fontFamily="var(--font-playfair), Georgia, serif"
              fontSize={MONO_TWO.size}
              fontWeight="600"
              fill="url(#si-loader-gold)"
            >
              2
            </text>
            {MONO_STEMS.map((s) => (
              <rect key={s.x} x={s.x} y={s.y} width={s.w} height={s.h} fill="url(#si-loader-gold)" />
            ))}
          </g>

          {/* hairlines */}
          <path
            data-draw="s"
            d={TWO_PATH}
            pathLength={1}
            fill="none"
            stroke="#E3CFA6"
            strokeWidth="0.6"
            strokeLinecap="round"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
          />
          <path
            data-draw="stem"
            d={STEM_PATH}
            pathLength={1}
            fill="none"
            stroke="#E3CFA6"
            strokeWidth="0.6"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
          />

          <circle data-flash cx="57" cy="13" r="12" fill="url(#si-loader-flash)" style={{ opacity: 0 }} />
          <path data-dot d={DOT_PATH} fill="#4C9DAB" style={{ opacity: 0 }} />
        </svg>

        <p
          data-word
          className="mt-8 whitespace-nowrap font-sans text-[11px] font-medium uppercase md:text-xs"
          style={{ letterSpacing: "1.1em", marginRight: "-1.1em", opacity: 0 }}
        >
          <span className="text-paper">Ink</span>
          <span className="text-gold-light">2</span>
          <span className="text-gold">Insight</span>
        </p>
        <p
          data-tag
          className="mt-4 font-serif text-lg italic text-mist md:text-xl"
          style={{ opacity: 0, transform: "translateY(8px)" }}
        >
          {brand.tagline}
        </p>

        <div className="mt-10 h-px w-40 overflow-hidden bg-white/10 md:w-56">
          <div
            data-progress
            className="h-full w-full origin-left bg-gradient-to-r from-gold-dim via-gold to-gold-light"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  );
}
