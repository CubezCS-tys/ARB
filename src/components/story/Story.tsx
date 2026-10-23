"use client";

import { useEffect, useState } from "react";
import PinnedStory from "./PinnedStory";
import StaticStory from "./StaticStory";

/**
 * "From ink to insight": the pinned five-chapter 3D narrative (section id="story").
 * Reduced motion gets a stacked, static version instead of the pin.
 */
export default function Story() {
  const [mode, setMode] = useState<"pending" | "pinned" | "static">("pending");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      setMode(rm.matches ? "static" : "pinned");
      setIsMobile(mq.matches);
    };
    apply();
    rm.addEventListener("change", apply);
    mq.addEventListener("change", apply);
    return () => {
      rm.removeEventListener("change", apply);
      mq.removeEventListener("change", apply);
    };
  }, []);

  if (mode === "static") return <StaticStory />;
  return <PinnedStory key="pinned" isMobile={isMobile} enabled={mode === "pinned"} />;
}
