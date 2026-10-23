"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/scroll";

/**
 * Light canvas2D backdrop: Arabic and Latin glyphs drifting like gold dust,
 * joined by faint hairlines into a slow constellation. Near the pointer the
 * links brighten teal (machine intelligence "reading" the field).
 * Pauses off-screen; draws a single still frame under reduced motion.
 */

const ARABIC = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");
const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glyph: string;
  arabic: boolean;
  size: number;
  alpha: number;
  phase: number;
};

export default function GlyphField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = prefersReducedMotion();
    const styles = getComputedStyle(document.body);
    const serif = styles.getPropertyValue("--font-playfair").trim() || "Georgia, serif";
    const arabicFont = styles.getPropertyValue("--font-arabic").trim() || "serif";

    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let frame = 0;
    let running = false;
    let t = 0;
    const pointer = { x: -9999, y: -9999 };

    const seed = () => {
      const count = w < 768 ? 26 : Math.min(64, Math.round((w * h) / 22000));
      nodes = Array.from({ length: count }, () => {
        const arabic = Math.random() < 0.5;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.08 - 0.03,
          glyph: arabic ? ARABIC[(Math.random() * ARABIC.length) | 0] : LATIN[(Math.random() * LATIN.length) | 0],
          arabic,
          size: 12 + Math.random() * 18,
          alpha: 0.12 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = nw * dpr;
      canvas.height = nh * dpr;
      const reseed = !nodes.length || Math.abs(nw - w) > 80;
      w = nw;
      h = nh;
      if (reseed) seed();
      draw();
    };

    const LINK = 150;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // hairline links
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const k = 1 - Math.sqrt(d2) / LINK;
          const mx = (a.x + b.x) / 2 - pointer.x;
          const my = (a.y + b.y) / 2 - pointer.y;
          const near = Math.max(0, 1 - Math.sqrt(mx * mx + my * my) / 220);
          ctx.strokeStyle =
            near > 0.05
              ? `rgba(124,196,207,${(k * (0.1 + near * 0.35)).toFixed(3)})`
              : `rgba(203,175,126,${(k * 0.1).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // glyphs
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const n of nodes) {
        const twinkle = still ? 1 : 0.75 + 0.25 * Math.sin(t * 0.0012 + n.phase);
        const px = n.x - pointer.x;
        const py = n.y - pointer.y;
        const near = Math.max(0, 1 - Math.sqrt(px * px + py * py) / 200);
        ctx.font = `${n.size}px ${n.arabic ? arabicFont : serif}`;
        ctx.fillStyle = `rgba(227,207,166,${Math.min(0.85, n.alpha * twinkle + near * 0.4).toFixed(3)})`;
        ctx.fillText(n.glyph, n.x, n.y);
        // a tiny node point beside each glyph
        ctx.fillStyle = `rgba(203,175,126,${(0.35 * twinkle).toFixed(3)})`;
        ctx.fillRect(n.x + n.size * 0.55, n.y - n.size * 0.45, 1.2, 1.2);
      }
    };

    const step = (now: number) => {
      t = now;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -40) n.x = w + 40;
        else if (n.x > w + 40) n.x = -40;
        if (n.y < -40) n.y = h + 40;
        else if (n.y > h + 40) n.y = -40;
      }
      draw();
      frame = running ? requestAnimationFrame(step) : 0;
    };

    const start = () => {
      if (still || running) return;
      running = true;
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "100px" });
    io.observe(canvas);
    const host = canvas.closest("section") ?? canvas.parentElement;
    if (!still) {
      host?.addEventListener("pointermove", onPointer, { passive: true });
      host?.addEventListener("pointerleave", onPointerLeave);
    }
    resize();
    // redraw once the web fonts land so glyphs use Playfair / Noto Naskh
    document.fonts?.ready.then(() => draw()).catch(() => undefined);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host?.removeEventListener("pointermove", onPointer);
      host?.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
}
