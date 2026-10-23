"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor: a gold dot that tracks the pointer exactly plus a lagging ring
 * (lerped in rAF) that grows over interactive elements.
 * Only on fine pointers without reduced motion; never intercepts clicks.
 *
 * Optional attributes on any element:
 *   data-cursor            treat as interactive (ring grows)
 *   data-cursor="hide"     hide the custom cursor over this element
 *   data-cursor-label="View"  show a small label inside the grown ring
 */

const INTERACTIVE =
  'a[href], button:not([disabled]), [role="button"], label, select, summary, input[type="submit"], input[type="checkbox"], input[type="radio"], [data-cursor]';
const TEXT_INPUT =
  'input:not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const check = () => setEnabled(fine.matches && !reduced.matches);
    check();
    fine.addEventListener("change", check);
    reduced.addEventListener("change", check);
    return () => {
      fine.removeEventListener("change", check);
      reduced.removeEventListener("change", check);
    };
  }, []);

  return enabled ? <CursorLayer /> : null;
}

const REST = 0.42;
const HOVER = 1;
const PRESS = 0.32;

function CursorLayer() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const d = dot.current;
    const r = ring.current;
    const l = label.current;
    if (!d || !r || !l) return;

    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100, s: REST };
    let target = REST;
    let hovering = false;
    let pressed = false;
    let visible = false;
    let frame = 0;

    const setVisible = (v: boolean) => {
      if (visible === v) return;
      visible = v;
      d.style.opacity = v ? "1" : "0";
      r.style.opacity = v ? "1" : "0";
    };

    const tick = () => {
      pos.x += (mouse.x - pos.x) * 0.16;
      pos.y += (mouse.y - pos.y) * 0.16;
      pos.s += (target - pos.s) * 0.18;
      r.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${pos.s})`;
      const settled =
        Math.abs(mouse.x - pos.x) < 0.1 && Math.abs(mouse.y - pos.y) < 0.1 && Math.abs(target - pos.s) < 0.002;
      frame = settled ? 0 : window.requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    const updateTarget = () => {
      target = pressed ? (hovering ? HOVER * 0.85 : PRESS) : hovering ? HOVER : REST;
      d.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${hovering ? 0 : 1})`;
      kick();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) {
        // first move: jump the ring to the pointer instead of flying in from a corner
        if (pos.x < 0) {
          pos.x = mouse.x;
          pos.y = mouse.y;
        }
        setVisible(true);
      }
      d.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${hovering ? 0 : 1})`;
      kick();
    };

    const onOver = (e: Event) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (el.closest('[data-cursor="hide"]') || el.closest(TEXT_INPUT)) {
        setVisible(false);
        return;
      }
      setVisible(true);
      const hit = el.closest(INTERACTIVE);
      hovering = !!hit;
      const text = hit?.getAttribute("data-cursor-label") ?? "";
      l.textContent = text;
      l.style.opacity = text ? "1" : "0";
      r.classList.toggle("si-cursor-ring--label", !!text);
      updateTarget();
    };

    const onDown = () => {
      pressed = true;
      updateTarget();
    };
    const onUp = () => {
      pressed = false;
      updateTarget();
    };
    const onLeave = () => setVisible(false);

    html.classList.add("si-cursor");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      html.classList.remove("si-cursor");
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <>
      <style>{`
        html.si-cursor, html.si-cursor * { cursor: none !important; }
        html.si-cursor input:not([type="submit"]):not([type="checkbox"]):not([type="radio"]),
        html.si-cursor textarea,
        html.si-cursor [contenteditable="true"] { cursor: text !important; }
        .si-cursor-ring--label { background: rgba(203,175,126,0.9); border-color: transparent !important; }
      `}</style>
      <div
        ref={ring}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] flex h-[72px] w-[72px] items-center justify-center rounded-full border-[1.5px] border-gold-light mix-blend-difference transition-[opacity,background-color] duration-300 will-change-transform"
        style={{ opacity: 0, transform: `translate3d(-100px,-100px,0) translate(-50%,-50%) scale(${REST})` }}
      >
        <span
          ref={label}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink opacity-0 transition-opacity duration-300"
        />
      </div>
      <div
        ref={dot}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[201] h-1.5 w-1.5 rounded-full bg-gold-light mix-blend-difference transition-opacity duration-200 will-change-transform"
        style={{ opacity: 0, transform: "translate3d(-100px,-100px,0)" }}
      />
    </>
  );
}
