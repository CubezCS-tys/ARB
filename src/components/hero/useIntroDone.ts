"use client";

import { useEffect, useState } from "react";

/**
 * True once the site intro (Loader) has finished. Listens for the
 * `si:intro-done` window event, honours `<html data-intro="done">` if the
 * intro already ended before mount, and falls back to 2.5s so the hero never
 * stays hidden if no loader is present.
 */
export function useIntroDone(fallbackMs = 2500) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") {
      setDone(true);
      return;
    }
    const finish = () => setDone(true);
    window.addEventListener("si:intro-done", finish, { once: true });
    const timer = window.setTimeout(finish, fallbackMs);
    return () => {
      window.removeEventListener("si:intro-done", finish);
      window.clearTimeout(timer);
    };
  }, [fallbackMs]);

  return done;
}
