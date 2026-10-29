"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import Logo from "@/components/brand/Logo";
import { brand } from "@/content/site";
import { NAV_LINKS, SECTION_IDS, anchorClick, goTo } from "./anchors";

const EASE = [0.22, 1, 0.36, 1] as const;

function useIntroDone() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") {
      setDone(true);
      return;
    }
    const on = () => setDone(true);
    window.addEventListener("si:intro-done", on);
    const fallback = window.setTimeout(on, 6000);
    return () => {
      window.removeEventListener("si:intro-done", on);
      window.clearTimeout(fallback);
    };
  }, []);
  return done;
}

export default function Nav() {
  const ready = useIntroDone();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("top");
  const progressRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const firstMenuLink = useRef<HTMLAnchorElement>(null);

  // Scroll: glass state, hide-on-down / show-on-up, progress line.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, y / max)) : 0})`;
      }
      setScrolled(y > 24);
      if (y < 160) {
        setHidden(false);
        lastY = y;
      } else if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  // Active section: whichever section crosses a thin band just above mid-viewport.
  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -54% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // re-run once the intro is done in case sections mounted late
  }, [ready]);

  // Mobile menu: lock scroll, Escape to close, focus management.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const burger = burgerRef.current;
    try {
      window.__lenis?.stop();
    } catch {
      /* noop */
    }
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => firstMenuLink.current?.focus(), 120);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      html.style.removeProperty("overflow");
      try {
        window.__lenis?.start();
      } catch {
        /* noop */
      }
      burger?.focus({ preventScroll: true });
    };
  }, [open]);

  // Close the menu if the viewport grows to desktop.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => mq.matches && setOpen(false);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const menuGo = useCallback(
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setOpen(false);
      // wait for the menu effect cleanup to restart Lenis before scrolling
      window.setTimeout(() => goTo(id), 80);
    },
    [],
  );

  const isHidden = hidden && !open;
  const headerState = !ready
    ? "-translate-y-4 opacity-0"
    : isHidden
      ? "-translate-y-full opacity-100"
      : "translate-y-0 opacity-100";

  return (
    <MotionConfig reducedMotion="user">
      {/* scroll progress */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[52] h-px">
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-gradient-to-r from-gold-dim via-gold to-gold-light"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <header
        onFocusCapture={() => setHidden(false)}
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${headerState}`}
      >
        <div
          aria-hidden="true"
          className={`glass absolute inset-0 border-x-0 border-t-0 bg-ink/60 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] transition-opacity duration-500 ${
            scrolled && !open ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          aria-label="Primary"
          className="relative mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 md:px-10"
        >
          <a
            href="#top"
            onClick={anchorClick("top", () => setOpen(false))}
            aria-label={`${brand.name}, back to top`}
            className="-m-2 rounded-sm p-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Logo wordmark className="h-9" />
          </a>

          <div className="hidden items-center gap-10 md:flex">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((l) => {
                const isActive = active === l.id;
                return (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      onClick={anchorClick(l.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={`relative block py-2 text-[13px] tracking-wide transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                        isActive ? "text-paper" : "text-mist hover:text-paper"
                      }`}
                    >
                      {l.label}
                      {isActive && (
                        <motion.span
                          layoutId="si-nav-underline"
                          transition={{ duration: 0.55, ease: EASE }}
                          className="absolute inset-x-0 -bottom-0.5 h-px bg-gold"
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
            <a
              href="#contact"
              onClick={anchorClick("contact")}
              aria-current={active === "contact" ? "location" : undefined}
              className={`rounded-full bg-gold px-5 py-2 text-[13px] font-medium text-ink transition-[background-color,box-shadow] duration-300 hover:bg-gold-light focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                active === "contact" ? "shadow-[0_0_24px_-4px_rgba(203,175,126,0.7)]" : ""
              }`}
            >
              Contact
            </a>
          </div>

          <button
            ref={burgerRef}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="si-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold md:hidden"
          >
            <span
              aria-hidden="true"
              className={`absolute h-px w-6 bg-paper transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "rotate-45" : "-translate-y-[4px]"
              }`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-px bg-gold transition-[transform,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "w-6 -rotate-45" : "w-4 translate-x-1 translate-y-[4px]"
              }`}
            />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="si-mobile-menu"
            key="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            data-lenis-prevent
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 38px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 38px)" }}
            exit={{
              clipPath: "circle(0% at calc(100% - 44px) 38px)",
              transition: { duration: 0.5, ease: EASE, delay: 0.1 },
            }}
            transition={{ duration: 0.8, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink md:hidden"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 50% at 100% 0%, rgba(203,175,126,0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(76,157,171,0.08), transparent 70%)",
            }}
          >
            <ul className="mt-[120px] flex flex-col gap-2 px-8">
              {[...NAV_LINKS, { id: "contact", label: "Contact" } as const].map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.18 + i * 0.07, duration: 0.7, ease: EASE } }}
                  exit={{ opacity: 0, y: 12, transition: { duration: 0.2, delay: (4 - i) * 0.03 } }}
                >
                  <a
                    ref={i === 0 ? firstMenuLink : undefined}
                    href={`#${l.id}`}
                    onClick={menuGo(l.id)}
                    aria-current={active === l.id ? "location" : undefined}
                    className="group flex items-baseline gap-5 border-b border-white/[0.06] py-4 focus-visible:outline-none"
                  >
                    <span className="w-6 font-mono text-[11px] text-gold-dim">{String(i + 1).padStart(2, "0")}</span>
                    <span
                      className={`font-serif text-[2.6rem] leading-none transition-colors duration-300 group-hover:text-gold-light group-focus-visible:text-gold-light ${
                        active === l.id ? "italic text-gold" : "text-paper"
                      }`}
                    >
                      {l.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.6 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="mt-auto flex flex-col gap-2 px-8 pb-10 pt-12"
            >
              <span className="eyebrow">{brand.tagline}</span>
              <a href={`mailto:${brand.email}`} className="text-sm text-mist hover:text-paper">
                {brand.email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
