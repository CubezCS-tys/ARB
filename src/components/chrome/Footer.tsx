"use client";

import Logo from "@/components/brand/Logo";
import { brand, capabilities, divisions } from "@/content/site";
import { NAV_LINKS, anchorClick, goTo } from "./anchors";

const linkCls =
  "text-sm text-mist transition-colors duration-300 hover:text-paper focus-visible:text-paper focus-visible:outline-none focus-visible:underline focus-visible:decoration-gold focus-visible:underline-offset-4";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/[0.06] bg-ink">
      {/* large faint monogram */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[12%] -right-[6%] -z-10 h-[26rem] text-gold/[0.045] md:h-[40rem]"
      >
        <Logo tone="mono" className="h-full" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64"
        style={{ background: "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(203,175,126,0.06), transparent 70%)" }}
      />

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo wordmark className="h-9" />
            <p className="mt-6 max-w-xs font-serif text-2xl leading-snug text-paper">
              {brand.positioning.replace(/\.$/, "")}
              <span className="text-gold">.</span>
            </p>
            <p className="mt-4 font-serif italic text-gold-light/80">{brand.tagline}</p>
          </div>

          <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3 md:col-span-8">
            <FooterCol title="Divisions">
              {divisions.map((d) => (
                <li key={d.id}>
                  <a href="#company" onClick={anchorClick("company")} className={`${linkCls} block`}>
                    <span className="text-paper/90">{d.name}</span>
                    <span className="mt-0.5 block text-xs text-mist/70">{d.line}</span>
                  </a>
                </li>
              ))}
            </FooterCol>
            <FooterCol title="Capabilities">
              {capabilities.map((c) => (
                <li key={c.id}>
                  <a href="#capabilities" onClick={anchorClick("capabilities")} className={linkCls}>
                    {c.short}
                  </a>
                </li>
              ))}
            </FooterCol>
            <FooterCol title="Company">
              {[...NAV_LINKS, { id: "contact", label: "Contact" } as const].map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={anchorClick(l.id)} className={linkCls}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a href={`mailto:${brand.email}`} className={`${linkCls} break-all text-gold/90 hover:text-gold-light`}>
                  {brand.email}
                </a>
              </li>
            </FooterCol>
          </nav>
        </div>

        <div className="mt-20 h-px bg-gradient-to-r from-gold/40 via-white/10 to-transparent" aria-hidden="true" />

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 text-xs text-mist/80">
            <p>
              {brand.name} is a company of {brand.parent} ({brand.parentShort}).
            </p>
            <p className="font-mono text-[11px] tracking-wide text-mist/60">
              &copy; {year} {brand.name}. All rights reserved.
            </p>
          </div>

          <button
            type="button"
            onClick={() => goTo("top")}
            className="group inline-flex items-center gap-3 self-start rounded-full border border-white/10 py-2 pl-5 pr-2 text-xs uppercase tracking-[0.2em] text-mist transition-colors duration-300 hover:border-gold/50 hover:text-paper focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold md:self-auto"
          >
            Back to top
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1"
            >
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 10.5V1.5M2 5.5l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-dim">{title}</h2>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}
