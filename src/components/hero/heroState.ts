/**
 * Mutable, render-loop friendly state shared between the DOM hero (scroll,
 * pointer) and the WebGL scene. Plain object on purpose: writing to it never
 * triggers React renders, the scene reads it every frame.
 */
export const heroState = {
  /** 0..1 progress of the hero's ScrollTrigger scrub */
  scroll: 0,
  /** pointer in normalised device coordinates (-1..1, y up) */
  pointerX: 0,
  pointerY: 0,
  pointerActive: false,
};
