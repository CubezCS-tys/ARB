"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StoryOverlay, { type OverlayHandle } from "./StoryOverlay";
import { buildGraph } from "./graph";
import { JUMP, chapterAt } from "./timeline";

gsap.registerPlugin(ScrollTrigger);

const StoryScene = dynamic(() => import("./scene/StoryScene"), { ssr: false });

/** Pinned distance in viewport heights (the section is this + 1 screen tall). */
const PIN_VH_DESKTOP = 4.5;
const PIN_VH_MOBILE = 3.2;

export default function PinnedStory({ isMobile, enabled }: { isMobile: boolean; enabled: boolean }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const overlay = useRef<OverlayHandle>(null);
  const progress = useRef(0);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [mountScene, setMountScene] = useState(false);
  const [inView, setInView] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  const graph = useMemo(() => buildGraph(isMobile ? 190 : 560), [isMobile]);

  // Mount the canvas once the section approaches; render only while it is on screen.
  useEffect(() => {
    const el = section.current;
    if (!el || !enabled) return;
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMountScene(true), { rootMargin: "100% 0px" });
    const vis = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "10% 0px" });
    near.observe(el);
    vis.observe(el);
    return () => {
      near.disconnect();
      vis.disconnect();
    };
  }, [enabled]);

  // Pin + scrub. Progress goes to a ref (read by the scene each frame) and to the overlay imperatively.
  useEffect(() => {
    if (!enabled || !section.current || !stage.current) return;
    const apply = (p: number) => {
      progress.current = p;
      overlay.current?.update(p);
      const idx = chapterAt(p);
      setActive((prev) => (prev === idx ? prev : idx));
    };
    const ctx = gsap.context(() => {
      trigger.current = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: () => `+=${window.innerHeight * (isMobile ? PIN_VH_MOBILE : PIN_VH_DESKTOP)}`,
        pin: stage.current,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Created one render after siblings (needs matchMedia), so refresh first:
        // its pin spacing shifts every section below.
        refreshPriority: 1,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });
    }, section);
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    apply(trigger.current?.progress ?? 0);
    return () => {
      ctx.revert();
      trigger.current = null;
    };
  }, [enabled, isMobile]);

  const jump = useCallback((i: number) => {
    const st = trigger.current;
    if (!st) return;
    const y = st.start + JUMP[i] * (st.end - st.start);
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.8 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const onReady = useCallback(() => setSceneReady(true), []);

  return (
    <section ref={section} id="story" aria-labelledby="story-heading" className="relative bg-ink">
      <div ref={stage} className="relative h-[100svh] w-full overflow-hidden bg-ink">
        <div
          role="img"
          aria-label="Animated illustration: an aged Arabic manuscript page is scanned, its text lifts into clean digital lines, splits into labelled data blocks, joins a citation graph, and a question is answered with three cited sources."
          className={`absolute inset-0 transition-opacity duration-1000 ${sceneReady ? "opacity-100" : "opacity-0"}`}
        >
          {mountScene && (
            <StoryScene progress={progress} active={inView} isMobile={isMobile} graph={graph} onReady={onReady} />
          )}
        </div>
        <StoryOverlay
          ref={overlay}
          active={active}
          onJump={jump}
          nodes={graph.count}
          edges={graph.edgeCount}
          compact={isMobile}
        />
      </div>
    </section>
  );
}
