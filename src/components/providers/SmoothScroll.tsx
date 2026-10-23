"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * One Lenis instance for the whole page, driven by GSAP's ticker so
 * ScrollTrigger-pinned sections and Lenis never disagree about scroll position.
 * Exposed on window.__lenis for anchor links (see lib/scroll.ts).
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Late-loading fonts change section heights; re-measure pinned triggers once they land
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}
