import type { MouseEvent } from "react";
import { scrollToId } from "@/lib/scroll";

export const NAV_LINKS = [
  { id: "story", label: "Story" },
  { id: "capabilities", label: "Capabilities" },
  { id: "demos", label: "Demos" },
  { id: "company", label: "Company" },
] as const;

/** Every section id the nav tracks, in page order (brand.md rule 8). */
export const SECTION_IDS = ["top", "story", "capabilities", "demos", "company", "contact"] as const;

/** Scroll to an id (or the very top when it is missing), via Lenis when active. */
export function goTo(id: string) {
  if (document.getElementById(id)) {
    scrollToId(id);
    return;
  }
  if (id === "top") {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/** onClick for <a href="#id"> links: keeps the real href for no-JS / new tab, smooth-scrolls otherwise. */
export function anchorClick(id: string, after?: () => void) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    goTo(id);
    after?.();
  };
}
