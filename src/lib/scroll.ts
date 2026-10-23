/** Scroll to an element id, going through Lenis when it is active. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -40, duration: 1.6, force: true });
  else el.scrollIntoView({ behavior: "smooth" });
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
