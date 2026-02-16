"use client";

import { useEffect, useRef, useState } from "react";

/* ================================================================
   SCROLL REVEAL HOOK
   ================================================================ */
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ================================================================
   ANIMATED COUNTER
   ================================================================ */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ================================================================
   ICONS (inline SVG)
   ================================================================ */
function IconScan({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function IconDocument({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconCitation({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconBrain({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4c0 .7-.2 1.4-.5 2H17a3 3 0 0 1 3 3c0 1-.5 2-1.3 2.6A3.5 3.5 0 0 1 17 18h-1" />
      <path d="M12 2a4 4 0 0 0-4 4c0 .7.2 1.4.5 2H7a3 3 0 0 0-3 3c0 1 .5 2 1.3 2.6A3.5 3.5 0 0 0 7 18h1" />
      <path d="M12 2v20" />
      <path d="M9 14h6" />
      <path d="M10 10h4" />
    </svg>
  );
}

function IconArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconUniversity({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" />
      <path d="M5 20V10" />
      <path d="M19 20V10" />
      <path d="M9 20V14h6v6" />
      <path d="M12 2L2 8h20L12 2z" />
    </svg>
  );
}

function IconPublisher({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="6" y1="8" x2="10" y2="8" />
      <line x1="6" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconResearch({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="11" y1="8" x2="11" y2="14" />
    </svg>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function Home() {
  useReveal();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="grid-bg min-h-screen">
      {/* ===== NAVIGATION ===== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled
            ? "nav-blur bg-midnight/80 border-b border-amber/10 py-3"
            : "py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 border border-amber/50 flex items-center justify-center relative group-hover:border-amber transition-colors">
              <span className="font-serif text-amber text-lg font-bold tracking-tight">A</span>
              <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-amber" />
              <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-amber" />
            </div>
            <div>
              <span className="font-serif text-cream text-xl tracking-wide">ARB</span>
              <span className="hidden sm:block text-steel text-[10px] tracking-[0.3em] uppercase">
                Academic Research Benchmarking
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Solutions", "About", "Clients", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-steel-light text-sm tracking-wider uppercase hover:text-amber transition-colors duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-amber hover:after:w-full after:transition-all after:duration-300"
              >
                {item}
              </a>
            ))}
            <a
              href="#contact"
              className="cta-btn bg-amber text-midnight px-5 py-2.5 text-sm font-semibold tracking-wider uppercase"
            >
              <span className="relative z-10">Get Started</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-cream"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden nav-blur bg-midnight/95 border-t border-amber/10 mt-3">
            <div className="px-6 py-6 flex flex-col gap-4">
              {["Solutions", "About", "Clients", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-steel-light text-sm tracking-wider uppercase hover:text-amber transition-colors"
                >
                  {item}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="cta-btn bg-amber text-midnight px-5 py-2.5 text-sm font-semibold tracking-wider uppercase text-center mt-2"
              >
                <span className="relative z-10">Get Started</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-1/4 right-[15%] w-72 h-72 border border-amber/5 rotate-12 animate-float" />
        <div className="absolute bottom-1/4 left-[10%] w-48 h-48 border border-amber/5 -rotate-6 animate-float" style={{ animationDelay: "2s" }} />

        {/* Decorative document lines */}
        <div className="absolute top-[20%] left-[8%] space-y-3 opacity-[0.06]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-px bg-cream" style={{ width: `${120 - i * 12}px` }} />
          ))}
        </div>
        <div className="absolute bottom-[25%] right-[8%] space-y-3 opacity-[0.06]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-px bg-cream" style={{ width: `${80 + i * 8}px` }} />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Tagline chip */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 border border-amber/20 bg-amber/5 mb-8">
            <div className="w-1.5 h-1.5 bg-amber rounded-full animate-pulse-glow" />
            <span className="text-amber text-xs tracking-[0.25em] uppercase font-mono">
              Digitizing Knowledge
            </span>
          </div>

          {/* Main heading */}
          <h1 className="animate-fade-up font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-cream leading-[0.95] tracking-tight mb-6" style={{ animationDelay: "0.15s" }}>
            Transform Archives
            <br />
            <span className="text-amber amber-glow-text">Into Intelligence</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up max-w-2xl mx-auto text-steel-light text-lg md:text-xl leading-relaxed mb-10" style={{ animationDelay: "0.3s" }}>
            We build production-grade OCR pipelines, citation indexes, searchable PDFs, and
            AI-powered retrieval systems for the institutions that advance human knowledge.
          </p>

          {/* CTA row */}
          <div className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: "0.45s" }}>
            <a
              href="#contact"
              className="cta-btn bg-amber text-midnight px-8 py-4 text-sm font-semibold tracking-[0.2em] uppercase flex items-center gap-3"
            >
              <span className="relative z-10 flex items-center gap-3">
                Schedule a Demo
                <IconArrowRight className="w-4 h-4" />
              </span>
            </a>
            <a
              href="#solutions"
              className="px-8 py-4 border border-steel/30 text-steel-light text-sm tracking-[0.2em] uppercase hover:border-amber/40 hover:text-cream transition-all duration-300"
            >
              Explore Solutions
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="animate-fade-in absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ animationDelay: "1s" }}>
            <span className="text-steel text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-steel/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* ===== SOLUTIONS ===== */}
      <section id="solutions" className="relative py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="reveal max-w-2xl mb-20">
            <span className="text-amber text-xs tracking-[0.3em] uppercase font-mono block mb-4">
              Our Solutions
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-6">
              Purpose-built tools for{" "}
              <span className="text-amber">academic excellence</span>
            </h2>
            <hr className="ornate-hr w-24" />
          </div>

          {/* Services grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: IconScan,
                title: "Archival OCR",
                desc: "High-fidelity optical character recognition engineered for degraded manuscripts, historical journals, and aged documents. Our models handle noise, skew, and faded ink with precision that generic OCR cannot match.",
                detail: "98.7% accuracy on degraded text",
              },
              {
                icon: IconDocument,
                title: "Searchable PDFs",
                desc: "Convert scanned archives into fully indexed, text-searchable PDF documents with preserved layout fidelity. Embedded metadata, bookmark structures, and accessibility compliance included.",
                detail: "PDF/A-3 compliant output",
              },
              {
                icon: IconCitation,
                title: "Citation Indexing",
                desc: "Automated extraction and linking of bibliographic references across massive corpora. Build interconnected citation graphs that reveal research lineage, influence networks, and knowledge gaps.",
                detail: "Cross-corpus reference linking",
              },
              {
                icon: IconBrain,
                title: "RAG Systems",
                desc: "Retrieval-Augmented Generation pipelines that let researchers query entire archives in natural language. Grounded answers with source attribution, built on your institution\u2019s proprietary collections.",
                detail: "Source-attributed AI answers",
              },
            ].map((service, i) => (
              <div
                key={service.title}
                className={`reveal reveal-delay-${i + 1} service-card ornate-border p-8 md:p-10 group cursor-default`}
              >
                <div className="flex items-start justify-between mb-6">
                  <service.icon className="service-icon w-8 h-8 text-steel" />
                  <span className="text-amber/40 font-mono text-xs">0{i + 1}</span>
                </div>
                <h3 className="font-serif text-2xl text-cream mb-3">{service.title}</h3>
                <p className="text-steel-light leading-relaxed mb-6">{service.desc}</p>
                <div className="flex items-center gap-2 text-amber text-sm">
                  <div className="w-1 h-1 bg-amber rounded-full" />
                  <span className="font-mono text-xs tracking-wider">{service.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT / STATS ===== */}
      <section id="about" className="relative py-32">
        <hr className="ornate-hr max-w-7xl mx-auto mb-32" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: About text */}
            <div className="reveal">
              <span className="text-amber text-xs tracking-[0.3em] uppercase font-mono block mb-4">
                About ARB
              </span>
              <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-8">
                Where archival science meets{" "}
                <span className="text-amber">modern AI</span>
              </h2>
              <div className="space-y-5 text-steel-light leading-relaxed">
                <p>
                  ARB was founded on a simple observation: the world&apos;s most valuable knowledge
                  is trapped in formats that modern tools can&apos;t read. Millions of journal
                  articles, dissertations, and institutional records sit in scanned images &mdash;
                  unsearchable and disconnected.
                </p>
                <p>
                  We build the infrastructure that bridges this gap. Our systems combine
                  state-of-the-art machine learning with deep domain expertise in academic
                  publishing, library science, and information retrieval to deliver production-grade
                  solutions &mdash; not prototypes.
                </p>
                <p>
                  Every pipeline we deploy is tuned to the specific characteristics of our
                  clients&apos; collections, because a 15th-century manuscript and a 1990s
                  photocopy demand fundamentally different approaches.
                </p>
              </div>
            </div>

            {/* Right: Visual element */}
            <div className="reveal reveal-delay-2 relative">
              <div className="ornate-border bg-navy/40 p-8 md:p-12 scan-effect">
                {/* Simulated document */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 bg-amber rounded-full" />
                    <span className="font-mono text-amber text-xs tracking-wider uppercase">
                      Document Analysis
                    </span>
                  </div>
                  {[100, 85, 95, 70, 90, 60, 80].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 bg-slate/60 rounded-sm"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Characters recognized", value: "2,847" },
                    { label: "Citations extracted", value: "34" },
                    { label: "Cross-references", value: "128" },
                    { label: "Confidence score", value: "98.7%" },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-midnight/50 p-3 border border-slate/20">
                      <div className="font-mono text-amber text-lg">{metric.value}</div>
                      <div className="text-steel text-[11px] tracking-wider">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating accent */}
              <div className="absolute -top-4 -right-4 w-20 h-20 border border-amber/10 -z-10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-amber/10 -z-10" />
            </div>
          </div>

          {/* Stats row */}
          <div className="reveal mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-b border-slate/20">
            {[
              { value: 12, suffix: "M+", label: "Pages Processed" },
              { value: 98, suffix: "%", label: "OCR Accuracy" },
              { value: 200, suffix: "+", label: "Institutions Served" },
              { value: 45, suffix: "M+", label: "Citations Indexed" },
            ].map((stat, i) => (
              <div key={stat.label} className={`stat-item text-center reveal-delay-${i + 1}`}>
                <div className="font-serif text-4xl md:text-5xl text-amber amber-glow-text mb-2">
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-steel text-sm tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CLIENTS / AUDIENCE ===== */}
      <section id="clients" className="relative py-32">
        <hr className="ornate-hr max-w-7xl mx-auto mb-32" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal text-center max-w-2xl mx-auto mb-20">
            <span className="text-amber text-xs tracking-[0.3em] uppercase font-mono block mb-4">
              Who We Serve
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-6">
              Built for the institutions that{" "}
              <span className="text-amber">shape research</span>
            </h2>
            <hr className="ornate-hr w-24 mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: IconUniversity,
                title: "Universities & Libraries",
                points: [
                  "Digitize rare collections and special archives",
                  "Enable full-text search across institutional repositories",
                  "Deploy AI-powered research assistants for students and faculty",
                  "Meet digital preservation and accessibility mandates",
                ],
              },
              {
                icon: IconPublisher,
                title: "Academic Publishers",
                points: [
                  "Convert legacy back-catalogs to searchable digital formats",
                  "Build comprehensive citation graphs across journals",
                  "Enhance discoverability with structured metadata extraction",
                  "Integrate RAG-based tools into publishing platforms",
                ],
              },
              {
                icon: IconResearch,
                title: "Research Institutions",
                points: [
                  "Unlock decades of archived research data",
                  "Cross-reference findings across departments and disciplines",
                  "Accelerate literature reviews with intelligent retrieval",
                  "Maintain provenance and audit trails for compliance",
                ],
              },
            ].map((audience, i) => (
              <div
                key={audience.title}
                className={`reveal reveal-delay-${i + 1} audience-card ornate-border bg-navy/30 p-8 md:p-10 group`}
              >
                <audience.icon className="w-8 h-8 text-amber mb-6" />
                <h3 className="font-serif text-2xl text-cream mb-6">{audience.title}</h3>

                {/* Animated accent bar */}
                <div className="h-px bg-slate/20 mb-6 relative">
                  <div className="audience-accent absolute top-0 left-0 h-full w-0 bg-amber/40" />
                </div>

                <ul className="space-y-3">
                  {audience.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-steel-light text-sm leading-relaxed">
                      <div className="w-1 h-1 bg-amber/60 rounded-full mt-2 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section className="relative py-32">
        <hr className="ornate-hr max-w-7xl mx-auto mb-32" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal text-center max-w-2xl mx-auto mb-20">
            <span className="text-amber text-xs tracking-[0.3em] uppercase font-mono block mb-4">
              How It Works
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight">
              From dusty shelves to <span className="text-amber">digital intelligence</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Ingest",
                desc: "Upload scanned documents, images, or existing PDFs in any format. We handle batch processing at institutional scale.",
              },
              {
                step: "02",
                title: "Analyze",
                desc: "Our OCR and NLP pipelines extract text, metadata, citations, and structural elements with domain-tuned precision.",
              },
              {
                step: "03",
                title: "Index",
                desc: "Content is organized into searchable indexes with citation graphs, cross-references, and semantic embeddings.",
              },
              {
                step: "04",
                title: "Query",
                desc: "Researchers interact through natural language search, citation exploration, or direct integration with existing tools.",
              },
            ].map((step, i) => (
              <div key={step.step} className={`reveal reveal-delay-${i + 1} relative`}>
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-amber/20 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="font-mono text-amber/30 text-5xl font-bold mb-4">{step.step}</div>
                  <h3 className="font-serif text-xl text-cream mb-3">{step.title}</h3>
                  <p className="text-steel-light text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA / CONTACT ===== */}
      <section id="contact" className="relative py-32">
        <hr className="ornate-hr max-w-7xl mx-auto mb-32" />

        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal ornate-border bg-navy/30 p-10 md:p-16 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <span className="text-amber text-xs tracking-[0.3em] uppercase font-mono block mb-4">
                Get In Touch
              </span>
              <h2 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-6">
                Ready to unlock your <span className="text-amber">archives</span>?
              </h2>
              <p className="text-steel-light text-lg leading-relaxed max-w-xl mx-auto mb-10">
                Whether you&apos;re digitizing a rare collection or building an AI-powered research
                platform, we&apos;d like to understand your challenges and show you what&apos;s
                possible.
              </p>

              {/* Contact form */}
              <form
                className="max-w-lg mx-auto space-y-4 text-left"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-steel text-xs tracking-wider uppercase mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-midnight/60 border border-slate/30 px-4 py-3 text-cream text-sm placeholder:text-steel/40 focus:border-amber/50 transition-colors outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-steel text-xs tracking-wider uppercase mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      className="w-full bg-midnight/60 border border-slate/30 px-4 py-3 text-cream text-sm placeholder:text-steel/40 focus:border-amber/50 transition-colors outline-none"
                      placeholder="University or organization"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-steel text-xs tracking-wider uppercase mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-midnight/60 border border-slate/30 px-4 py-3 text-cream text-sm placeholder:text-steel/40 focus:border-amber/50 transition-colors outline-none"
                    placeholder="your@email.edu"
                  />
                </div>
                <div>
                  <label className="block text-steel text-xs tracking-wider uppercase mb-2">
                    Tell us about your project
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-midnight/60 border border-slate/30 px-4 py-3 text-cream text-sm placeholder:text-steel/40 focus:border-amber/50 transition-colors outline-none resize-none"
                    placeholder="Describe your collection, goals, and timeline..."
                  />
                </div>
                <div className="text-center pt-4">
                  <button
                    type="submit"
                    className="cta-btn bg-amber text-midnight px-10 py-4 text-sm font-semibold tracking-[0.2em] uppercase"
                  >
                    <span className="relative z-10 flex items-center gap-3 justify-center">
                      Send Message
                      <IconArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate/15 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-amber/40 flex items-center justify-center">
                  <span className="font-serif text-amber text-sm font-bold">A</span>
                </div>
                <span className="font-serif text-cream text-lg tracking-wide">ARB</span>
              </div>
              <p className="text-steel text-sm leading-relaxed max-w-xs">
                Academic Research Benchmarking. Transforming the world&apos;s research archives into
                searchable, intelligent knowledge systems.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-cream text-xs tracking-[0.2em] uppercase mb-4">Solutions</h4>
              <ul className="space-y-2">
                {["Archival OCR", "Searchable PDFs", "Citation Indexing", "RAG Systems"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#solutions"
                        className="text-steel text-sm hover:text-amber transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-cream text-xs tracking-[0.2em] uppercase mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Contact", "Privacy Policy", "Terms of Service"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-steel text-sm hover:text-amber transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <hr className="ornate-hr mb-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-steel/60 text-xs tracking-wider">
              &copy; {new Date().getFullYear()} ARB Academic Research Benchmarking. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-steel/40 text-xs">
              <span className="inline-block w-1 h-1 bg-amber/40 rounded-full" />
              <span className="font-mono tracking-wider">Digitizing knowledge since day one</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
