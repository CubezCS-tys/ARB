# Ink2Insight: site brief for every engineer

## The company
Ink2Insight (I2I) is a father-and-son AI firm, a subsidiary of Academic Research
Benchmarking (ARB). Divisions: Advisory (strategy), Labs (platforms), Research
(knowledge intelligence). They build: RAG at scale on Arabic documents, OCR, metadata
extraction, document parsing, deep research, citation indexes.
Tagline: "Intelligence. Applied." Positioning: "Turning knowledge into intelligent impact."
All shared copy lives in `src/content/site.ts`; import from it rather than retyping.

## The big idea (the story the whole site tells)
**From ink to insight.** Knowledge starts trapped in pages (Arabic manuscripts, journals,
scans). SI reads it (OCR), understands it (parsing, metadata), connects it (citation
graphs), and answers with it (RAG, deep research). The recurring visual motif: **glyphs**
(Arabic letters + Latin letters) that start as scattered gold dust / ink and organise into
lines of text, then into a glowing knowledge graph of nodes and edges. Gold = knowledge,
teal = machine intelligence (scanlines, links, query beams).

## Visual language
- Palette (Tailwind tokens in `tailwind.config.ts`): `ink` #060B18 page bg, `midnight`
  #101B2D, `navy`, `slate`, `gold` #CBAF7E (+ `gold-light`, `gold-dim`), `teal` #4C9DAB
  (+ `teal-light`), `mint` (sparingly, Labs only), `paper` #F7F8FA text, `mist` muted text.
- Type: `font-serif` Playfair Display for headlines (big, often with one *italic* gold word
  using `.text-gold-gradient italic`), `font-sans` Inter for body, `font-mono` for technical
  labels/data, `font-arabic` Noto Naskh Arabic for Arabic (always `dir="rtl"`).
- Utilities in `globals.css`: `.eyebrow` (uppercase gold label with rule), `.glass`,
  `.text-gold-gradient`. Logo: `src/components/brand/Logo.tsx`.
- Mood: premium, cinematic, editorial, quiet confidence. Dark space, gold light, lots of
  negative space, slow eased motion (think Apple product page x observatory x rare-books
  library). NOT: neon cyberpunk, purple gradients, generic SaaS card grids, emoji.

## Tech stack (already installed; do NOT npm install anything)
Next 14 app router, React 18, TypeScript, Tailwind 3. three 0.169, @react-three/fiber 8,
@react-three/drei 9, @react-three/postprocessing 2, gsap 3.12 (+ScrollTrigger, already
registered in `components/providers/SmoothScroll.tsx`), lenis (global smooth scroll, already
wired), framer-motion 11, maath.

## Engineering rules
1. Only edit the files you own (listed in your task). If you need a new file, create it
   inside your own folder. Never edit page.tsx, layout.tsx, globals.css, tailwind config,
   site.ts, or another engineer's folder. If you think a shared file needs changing, say so
   in your final report instead.
2. Every file with hooks/three needs `"use client"`. Load any R3F `<Canvas>` via
   `next/dynamic(..., { ssr: false })` so the server build never touches WebGL.
3. Performance: `dpr={[1, 1.75]}`, pause rendering when off-screen (IntersectionObserver ->
   `frameloop="never"`/`"demand"` or don't mount), use instancing / Points / custom shaders
   for many objects (never thousands of meshes), dispose what you create. Aim for 60fps on a
   laptop iGPU. Mobile (<768px): reduce particle counts, simpler effects, still beautiful.
4. `prefers-reduced-motion`: provide a static or gently faded fallback (`lib/scroll.ts`
   has `prefersReducedMotion()`).
5. Accessibility: real text in the DOM for headings/copy (not only in WebGL), alt/aria on
   visuals, buttons are buttons, keyboard focus visible.
6. Honesty: do not invent client names, testimonials, or statistics. Demos are clearly
   labelled as simulated/illustrative with scripted data; that's fine and expected.
7. Verify before finishing: `npx tsc --noEmit` (whole project must pass for your files) and
   `npx eslint <your files>`. Do NOT run `next build` or `next dev` (other engineers share
   the folder; the lead runs the build).
8. Section ids used by the nav: `top` (hero), `story`, `capabilities`, `demos`, `company`,
   `contact`.
