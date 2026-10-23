/**
 * Single source of truth for site copy shared across sections.
 * Anything marked PLACEHOLDER must be confirmed by the founders before launch.
 */

export const brand = {
  name: "Soltani Intelligence",
  short: "SI",
  tagline: "Intelligence. Applied.",
  positioning: "Turning knowledge into intelligent impact.",
  parent: "Academic Research Benchmarking",
  parentShort: "ARB",
  email: "hello@soltani-intelligence.com", // PLACEHOLDER
};

export const divisions = [
  {
    id: "advisory",
    name: "SI Advisory",
    line: "AI strategy & consulting",
    body: "Board-level AI strategy, readiness audits and roadmaps grounded in what your documents and data can actually support.",
  },
  {
    id: "labs",
    name: "SI Labs",
    line: "AI platforms & development",
    body: "Production platforms: retrieval pipelines, OCR engines, parsing and extraction services, deployed on your infrastructure.",
  },
  {
    id: "research",
    name: "SI Research",
    line: "Research & knowledge intelligence",
    body: "Deep research, citation indexes and benchmarking that map what a field knows, who knows it, and where the gaps are.",
  },
] as const;

export const capabilities = [
  {
    id: "rag",
    title: "RAG at scale on Arabic documents",
    short: "Arabic RAG",
    body: "Retrieval-augmented generation tuned for Arabic morphology, diacritics and right-to-left layout. Millions of pages, answered in seconds, every claim cited to its source passage.",
    proof: "Morphology-aware retrieval · cited answers",
  },
  {
    id: "ocr",
    title: "OCR for the hard pages",
    short: "OCR",
    body: "Recognition built for degraded scans, historical print, handwriting and mixed Arabic–Latin pages, where generic OCR gives up.",
    proof: "Arabic, Latin & mixed-script pages",
  },
  {
    id: "metadata",
    title: "Metadata extraction",
    short: "Metadata",
    body: "Titles, authors, affiliations, dates, subjects and identifiers pulled from unstructured documents into clean, schema-ready records.",
    proof: "Structured records from unstructured pages",
  },
  {
    id: "parsing",
    title: "Document parsing",
    short: "Parsing",
    body: "Layout-aware parsing of tables, footnotes, figures, references and reading order, so downstream systems see a document the way a scholar does.",
    proof: "Tables, footnotes, figures, reading order",
  },
  {
    id: "research",
    title: "Deep research",
    short: "Deep Research",
    body: "Agentic research systems that read across a corpus, follow the evidence, and return synthesised reports with a traceable trail of sources.",
    proof: "Multi-step agents with source trails",
  },
  {
    id: "citations",
    title: "Citation indexes",
    short: "Citations",
    body: "Reference extraction, disambiguation and linking across journals and archives, building citation graphs that reveal influence and lineage.",
    proof: "Cross-corpus reference linking",
  },
] as const;

/** The scroll narrative: archive -> read -> understand -> connect -> answer */
export const story = [
  {
    id: "archive",
    numeral: "I",
    title: "The archive",
    line: "Centuries of knowledge, locked in pages no machine can read.",
  },
  {
    id: "read",
    numeral: "II",
    title: "Read",
    line: "OCR turns ink and pixels into text, in Arabic, Latin and everything between.",
  },
  {
    id: "understand",
    numeral: "III",
    title: "Understand",
    line: "Parsing and extraction give every page structure: who, what, when, and where it came from.",
  },
  {
    id: "connect",
    numeral: "IV",
    title: "Connect",
    line: "Citation indexes link every work to the works it builds on.",
  },
  {
    id: "answer",
    numeral: "V",
    title: "Answer",
    line: "Ask a question in any language. Get an answer with its sources.",
  },
] as const;
