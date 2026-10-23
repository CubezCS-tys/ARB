/**
 * Procedural, clearly fictional citation corpus for the "Trace the citations" demo.
 * Everything here is generated from a seeded RNG: no real papers, people or venues.
 */

export interface Field {
  name: string;
  nameAr: string;
  /** hex colour, kept inside the brand palette (golds, teals, mist, copper) */
  color: string;
}

export interface Paper {
  id: number;
  title: string;
  /** present for Arabic-language papers; `title` then holds the English translation */
  titleAr?: string;
  year: number;
  field: number;
  authors: string[];
  venue: string;
  /** ids of earlier papers this one cites */
  cites: number[];
  /** ids of later papers citing this one */
  citedBy: number[];
}

export interface Graph {
  papers: Paper[];
  fields: Field[];
  /** flat [cited, citing, cited, citing, ...]; knowledge flows cited -> citing */
  edges: Uint32Array;
  minYear: number;
  maxYear: number;
}

export const FIELDS: Field[] = [
  { name: "Arabic NLP", nameAr: "معالجة اللغة العربية", color: "#4C9DAB" },
  { name: "Manuscript studies", nameAr: "دراسات المخطوطات", color: "#CBAF7E" },
  { name: "Information retrieval", nameAr: "استرجاع المعلومات", color: "#7CC4CF" },
  { name: "Bibliometrics", nameAr: "القياسات الببليومترية", color: "#B98A5E" },
  { name: "Historical linguistics", nameAr: "اللسانيات التاريخية", color: "#E3CFA6" },
  { name: "Digital humanities", nameAr: "الإنسانيات الرقمية", color: "#8FA9C9" },
];

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

// [term, earliest year it makes sense]
const METHODS: [string, number][] = [
  ["Statistical", 1950],
  ["Comparative", 1950],
  ["Rule-Based", 1960],
  ["Corpus-Based", 1975],
  ["Probabilistic", 1980],
  ["Computational", 1965],
  ["Graph-Based", 1995],
  ["Cross-Lingual", 2000],
  ["Morphology-Aware", 2005],
  ["Layout-Aware", 2008],
  ["Neural", 2013],
  ["Diacritic-Sensitive", 2010],
  ["Retrieval-Augmented", 2020],
];

const OBJECTS = [
  "Retrieval",
  "Segmentation",
  "Transliteration",
  "Cataloguing",
  "Indexing",
  "Stemming",
  "Annotation",
  "Alignment",
  "Dating",
  "Attribution",
  "Classification",
  "Reference Linking",
  "Recognition",
  "Disambiguation",
];

const DOMAINS: string[][] = [
  ["Modern Standard Arabic", "Dialectal Corpora", "Root-and-Pattern Morphology", "Classical Arabic Prose", "Arabic Named Entities"],
  ["Andalusian Manuscripts", "Marginal Glosses", "Maghribi Script", "Colophons", "Waqf Registers"],
  ["Scholarly Archives", "Bilingual Collections", "Digital Libraries", "Long Arabic Queries", "Mixed-Script Search"],
  ["Citation Networks", "Journal Influence", "Co-authorship Graphs", "Regional Research Output", "Reference Lists"],
  ["Classical Lexicons", "Semitic Roots", "Loanwords in Arabic", "Pre-Modern Grammars", "Sound Change"],
  ["Literary Corpora", "Heritage Collections", "Digitised Periodicals", "Archival Metadata", "Scholarly Editions"],
];

const PATTERNS_MODERN = [
  (m: string, o: string, d: string) => `${m} ${o} of ${d}`,
  (m: string, o: string, d: string) => `Towards ${m} ${o} for ${d}`,
  (_m: string, o: string, d: string) => `Revisiting ${o} in ${d}`,
  (m: string, _o: string, d: string) => `${d}: A ${m} Approach`,
  (m: string, o: string, d: string) => `${o} at Scale: ${m} Methods for ${d}`,
];
const PATTERNS_EARLY = [
  (_m: string, _o: string, d: string) => `Notes on ${d}`,
  (_m: string, o: string, d: string) => `On the ${o} of ${d}`,
  (m: string, _o: string, d: string) => `A ${m} Survey of ${d}`,
  (_m: string, o: string, d: string) => `Problems of ${o} in ${d}`,
];

// Arabic title parts with parallel English so every Arabic title has a translation
const AR_OBJECTS: [string, string][] = [
  ["تحليل", "Analysis of"],
  ["فهرسة", "Cataloguing"],
  ["تحقيق", "Editing"],
  ["تصنيف", "Classifying"],
  ["استرجاع", "Retrieving"],
  ["توثيق", "Documenting"],
  ["رقمنة", "Digitising"],
];
const AR_DOMAINS: [string, string][] = [
  ["المخطوطات الأندلسية", "Andalusian manuscripts"],
  ["الحواشي والتعليقات", "marginal glosses"],
  ["المعاجم العربية القديمة", "classical Arabic lexicons"],
  ["النصوص الفقهية", "jurisprudential texts"],
  ["الخط المغربي", "Maghribi script"],
  ["الدوريات العلمية العربية", "Arabic scholarly periodicals"],
  ["سجلات الوقف", "waqf registers"],
  ["اللهجات المغاربية", "Maghrebi dialects"],
  ["الجذور الصرفية", "morphological roots"],
];
const AR_QUALIFIERS: [string, string][] = [
  ["مقاربة حاسوبية", "a computational approach"],
  ["دراسة مقارنة", "a comparative study"],
  ["نحو منهج جديد", "towards a new method"],
  ["", ""],
];

const SURNAMES = [
  "Haddad", "Mansour", "Benali", "Okafor", "Lindqvist", "Rahimi", "Farouk", "Idrissi",
  "Nakamura", "Sorensen", "El-Amin", "Kassem", "Moreau", "Petrova", "Qureshi", "Toumi",
  "Varga", "Zahran", "Ortega", "Chraibi", "Halabi", "Brennan", "Saleh", "Aziz",
];
const INITIALS = "ABDFHJKLMNORSTYZ";

const VENUES = [
  "J. of Arabic Computational Studies",
  "Proc. Symposium on Document Intelligence",
  "Manuscript Heritage Quarterly",
  "Review of Scholarly Communication",
  "Annals of Historical Lexicography",
  "Digital Archives Letters",
  "مجلة الدراسات اللغوية الحاسوبية",
];

const ARABIC_FIELDS = new Set([0, 1, 4, 5]);

export function generateGraph(count: number, seed = 20251024): Graph {
  const rng = mulberry32(seed);
  const minYear = 1950;
  const maxYear = 2025;

  // years skewed towards the present: research output grows over time
  const years = Array.from({ length: count }, () => Math.round(minYear + (maxYear - minYear) * Math.pow(rng(), 0.55)));
  years.sort((a, b) => a - b);
  years[0] = minYear;

  const papers: Paper[] = years.map((year, id) => {
    const field = Math.floor(rng() * FIELDS.length);
    const methods = METHODS.filter(([, since]) => since <= year).map(([m]) => m);
    const m = pick(rng, methods);
    const o = pick(rng, OBJECTS);
    const d = pick(rng, DOMAINS[field]);
    let title: string;
    let titleAr: string | undefined;

    if (ARABIC_FIELDS.has(field) && rng() < 0.32) {
      const [ao, eo] = pick(rng, AR_OBJECTS.filter(([a]) => year >= 1990 || a !== "رقمنة"));
      const [ad, ed] = pick(rng, AR_DOMAINS);
      const [aq, eq] = pick(rng, AR_QUALIFIERS.filter(([a]) => year >= 1975 || a !== "مقاربة حاسوبية"));
      titleAr = aq ? `${ao} ${ad}: ${aq}` : `${ao} ${ad}`;
      const en = `${eo} ${ed}${eq ? `: ${eq}` : ""}`;
      title = en.charAt(0).toUpperCase() + en.slice(1);
    } else {
      const patterns = year < 1985 ? PATTERNS_EARLY : PATTERNS_MODERN;
      title = pick(rng, patterns)(m, o, d);
    }

    const nAuthors = year < 1980 ? 1 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 4);
    const authors = Array.from({ length: nAuthors }, () => `${INITIALS[Math.floor(rng() * INITIALS.length)]}. ${pick(rng, SURNAMES)}`);
    const venue = titleAr && rng() < 0.6 ? VENUES[6] : pick(rng, VENUES.slice(0, 6));

    return { id, title, titleAr, year, field, authors, venue, cites: [], citedBy: [] };
  });

  // citations: preferential attachment, same-field bias, recency decay
  const edgeList: number[] = [];
  for (let i = 1; i < count; i++) {
    const p = papers[i];
    const candidates: number[] = [];
    for (let j = 0; j < i; j++) if (papers[j].year < p.year || (j < i && papers[j].year === p.year && rng() < 0.2)) candidates.push(j);
    if (!candidates.length) continue;
    const era = (p.year - minYear) / (maxYear - minYear);
    const wanted = Math.min(candidates.length, 1 + Math.round(rng() * rng() * (3 + era * 7)));
    const chosen = new Set<number>();
    for (let k = 0; k < wanted; k++) {
      let total = 0;
      const weights = candidates.map((j) => {
        if (chosen.has(j)) return 0;
        const q = papers[j];
        const w =
          (q.citedBy.length + 1) * (q.field === p.field ? 5 : 1) * Math.exp(-(p.year - q.year) / 22);
        total += w;
        return w;
      });
      if (total <= 0) break;
      let r = rng() * total;
      let idx = 0;
      for (; idx < weights.length - 1; idx++) {
        r -= weights[idx];
        if (r <= 0) break;
      }
      chosen.add(candidates[idx]);
    }
    chosen.forEach((j) => {
      p.cites.push(j);
      papers[j].citedBy.push(i);
      edgeList.push(j, i);
    });
  }

  return { papers, fields: FIELDS, edges: Uint32Array.from(edgeList), minYear, maxYear };
}

export function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace("#", ""), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

export function nodeRadius(p: Paper) {
  return 0.45 + 0.34 * Math.sqrt(p.citedBy.length);
}
