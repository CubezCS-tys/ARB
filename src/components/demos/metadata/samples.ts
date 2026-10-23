/**
 * Scripted, fictional sample documents for the "Extract the record" demo.
 * Titles, people, institutions and identifiers are invented. DOIs use the
 * unregistered 10.0000 prefix and author IDs carry a DEMO block so nothing
 * resolves to a real record.
 */

export type FieldKey =
  | "title"
  | "titleAlt"
  | "authors"
  | "affiliation"
  | "container"
  | "date"
  | "type"
  | "language"
  | "subjects"
  | "keywords"
  | "identifier"
  | "references";

export const FIELD_ORDER: FieldKey[] = [
  "title",
  "titleAlt",
  "authors",
  "affiliation",
  "container",
  "date",
  "type",
  "language",
  "subjects",
  "keywords",
  "identifier",
  "references",
];

export const FIELD_LABEL: Record<FieldKey, string> = {
  title: "Title",
  titleAlt: "Transliteration / translation",
  authors: "Authors",
  affiliation: "Affiliation",
  container: "Published in",
  date: "Date",
  type: "Type",
  language: "Language",
  subjects: "Subjects",
  keywords: "Keywords",
  identifier: "Identifier",
  references: "References",
};

/** Page-wide inference pass (language, subject classification) */
export const PAGE_STEP = "__page";

export interface Region {
  id: string;
  label: string;
  tone: "gold" | "teal";
}

export interface FieldMeta {
  /** region that yields this field; PAGE_STEP = inferred from the whole page */
  source: string;
  /** 0..1; null when the field is absent from the document */
  confidence: number | null;
  note?: string;
}

export interface Author {
  name: string;
  latin?: string;
  id: string;
  role?: string;
}

export interface MetaRecord {
  title: { value: string; lang: string };
  titleAlt: { transliteration?: string; translation?: string; translationLang?: string };
  authors: Author[];
  affiliation: string[];
  container: { value: string; translation?: string } | null;
  date: { iso: string; display: string };
  type: string;
  language: string[];
  subjects: string[];
  keywords: string[];
  identifier: { scheme: "doi" | "handle"; value: string } | null;
  references: number | null;
}

export interface Sample {
  id: "ar-journal" | "en-conference" | "bi-thesis";
  label: string;
  sub: string;
  file: string;
  timing: string;
  regions: Region[];
  fields: Record<FieldKey, FieldMeta>;
  record: MetaRecord;
}

export const SAMPLES: Sample[] = [
  {
    id: "ar-journal",
    label: "Journal article",
    sub: "Arabic · p. 1",
    file: "jcls-12-2-031.pdf",
    timing: "1.84 s",
    regions: [
      { id: "masthead", label: "Masthead", tone: "teal" },
      { id: "title", label: "Title", tone: "gold" },
      { id: "authors", label: "Authors", tone: "gold" },
      { id: "affiliation", label: "Affiliation", tone: "gold" },
      { id: "abstract", label: "Abstract", tone: "gold" },
      { id: "keywords", label: "Keywords", tone: "gold" },
      { id: "references", label: "References", tone: "teal" },
      { id: "doi", label: "DOI", tone: "teal" },
    ],
    fields: {
      container: { source: "masthead", confidence: 0.97 },
      date: { source: "masthead", confidence: 0.95, note: "Hijri + Gregorian reconciled" },
      type: { source: "masthead", confidence: 0.93 },
      title: { source: "title", confidence: 0.98 },
      titleAlt: { source: "title", confidence: 0.91, note: "ALA-LC romanisation" },
      authors: { source: "authors", confidence: 0.96 },
      affiliation: { source: "affiliation", confidence: 0.92 },
      subjects: { source: "abstract", confidence: 0.84, note: "classified from abstract" },
      keywords: { source: "keywords", confidence: 0.97 },
      references: { source: "references", confidence: 0.9, note: "list continues pp. 14–16" },
      identifier: { source: "doi", confidence: 0.99 },
      language: { source: PAGE_STEP, confidence: 0.99 },
    },
    record: {
      title: {
        value: "نحو معالجة صرفية للمخطوطات العربية الرقمية: مقاربة قائمة على الجذر والوزن",
        lang: "ar",
      },
      titleAlt: {
        transliteration:
          "Naḥwa muʿālaja ṣarfiyya li-l-makhṭūṭāt al-ʿarabiyya al-raqmiyya: muqāraba qāʾima ʿalā al-jidhr wa-l-wazn",
        translation: "Towards morphological processing of digitised Arabic manuscripts: a root-and-pattern approach",
        translationLang: "en",
      },
      authors: [
        { name: "ليلى بن عمر", latin: "Layla Ben Omar", id: "0000-DEMO-0000-0417" },
        { name: "كريم الحداد", latin: "Karim Al-Haddad", id: "0000-DEMO-0000-0932" },
      ],
      affiliation: [
        "قسم علوم الحاسوب، جامعة الواحات الشرقية",
        "معهد دراسات التراث المخطوط، جامعة الواحات الشرقية",
      ],
      container: { value: "مجلة الدراسات اللغوية الحاسوبية، مج ١٢، ع ٢", translation: "Journal of Computational Linguistic Studies, 12(2)" },
      date: { iso: "2024-03", display: "March 2024 · Ramaḍān 1445 AH" },
      type: "Journal article",
      language: ["ar"],
      subjects: ["Computational linguistics", "Arabic language — Morphology", "Manuscripts, Arabic — Digitization"],
      keywords: ["الصرف العربي", "المخطوطات", "الرقمنة", "الاسترجاع", "الجذر والوزن"],
      identifier: { scheme: "doi", value: "10.0000/demo.jcls.2024.031" },
      references: 38,
    },
  },
  {
    id: "en-conference",
    label: "Conference paper",
    sub: "English · p. 1",
    file: "sdi24-paper-117.pdf",
    timing: "1.21 s",
    regions: [
      { id: "masthead", label: "Venue line", tone: "teal" },
      { id: "title", label: "Title", tone: "gold" },
      { id: "authors", label: "Authors", tone: "gold" },
      { id: "affiliation", label: "Affiliations", tone: "gold" },
      { id: "abstract", label: "Abstract", tone: "gold" },
      { id: "keywords", label: "Keywords", tone: "gold" },
      { id: "references", label: "References", tone: "teal" },
      { id: "doi", label: "DOI", tone: "teal" },
    ],
    fields: {
      container: { source: "masthead", confidence: 0.98 },
      date: { source: "masthead", confidence: 0.96 },
      type: { source: "masthead", confidence: 0.97 },
      title: { source: "title", confidence: 0.99 },
      titleAlt: { source: "title", confidence: 0.88, note: "machine translation, for Arabic catalogues" },
      authors: { source: "authors", confidence: 0.97 },
      affiliation: { source: "affiliation", confidence: 0.94 },
      subjects: { source: "abstract", confidence: 0.86, note: "classified from abstract" },
      keywords: { source: "keywords", confidence: 0.98 },
      references: { source: "references", confidence: 0.93, note: "list continues pp. 123–124" },
      identifier: { source: "doi", confidence: 0.99 },
      language: { source: PAGE_STEP, confidence: 0.99 },
    },
    record: {
      title: { value: "Layout-Aware Reference Linking for Mixed-Script Scholarly Archives", lang: "en" },
      titleAlt: {
        translation: "ربط المراجع المراعي لتخطيط الصفحة في الأرشيفات العلمية متعددة الخطوط",
        translationLang: "ar",
      },
      authors: [
        { name: "Amira Rahimi", id: "0000-DEMO-0000-1208" },
        { name: "Joseph Okafor", id: "0000-DEMO-0000-2271" },
        { name: "Maja Lindqvist", id: "0000-DEMO-0000-3305" },
      ],
      affiliation: [
        "Dept. of Information Science, Northbridge Institute of Technology",
        "Centre for Archival Computing, Harbourline University",
      ],
      container: { value: "Proc. 9th Symposium on Document Intelligence (SDI ’24), pp. 112–124" },
      date: { iso: "2024-09", display: "September 2024" },
      type: "Conference paper",
      language: ["en"],
      subjects: ["Information retrieval", "Document analysis (Computer science)", "Bibliometrics"],
      keywords: ["reference extraction", "layout analysis", "Arabic script", "citation linking", "digital archives"],
      identifier: { scheme: "doi", value: "10.0000/demo.sdi.2024.117" },
      references: 41,
    },
  },
  {
    id: "bi-thesis",
    label: "Doctoral thesis",
    sub: "Bilingual · title page",
    file: "ccu-thesis-0412.pdf",
    timing: "0.96 s",
    regions: [
      { id: "affiliation", label: "Institution", tone: "gold" },
      { id: "title", label: "Title (ar)", tone: "gold" },
      { id: "titleEn", label: "Title (en)", tone: "gold" },
      { id: "authors", label: "Candidate · supervisor", tone: "gold" },
      { id: "degree", label: "Degree statement", tone: "teal" },
      { id: "doi", label: "Handle", tone: "teal" },
    ],
    fields: {
      affiliation: { source: "affiliation", confidence: 0.95 },
      title: { source: "title", confidence: 0.97 },
      titleAlt: { source: "titleEn", confidence: 0.98, note: "parallel title on page" },
      authors: { source: "authors", confidence: 0.94 },
      type: { source: "degree", confidence: 0.96 },
      date: { source: "degree", confidence: 0.93, note: "Hijri + Gregorian reconciled" },
      identifier: { source: "doi", confidence: 0.98 },
      container: { source: PAGE_STEP, confidence: null, note: "not applicable to theses" },
      language: { source: PAGE_STEP, confidence: 0.97 },
      subjects: { source: PAGE_STEP, confidence: 0.78, note: "inferred from titles only" },
      keywords: { source: PAGE_STEP, confidence: 0.71, note: "suggested, needs review" },
      references: { source: PAGE_STEP, confidence: null, note: "not on title page" },
    },
    record: {
      title: { value: "الذكاء الاصطناعي في فهرسة التراث المخطوط: نماذج للتعرّف والوصف", lang: "ar" },
      titleAlt: {
        transliteration: "al-Dhakāʾ al-iṣṭināʿī fī fahrasat al-turāth al-makhṭūṭ: namādhij li-l-taʿarruf wa-l-waṣf",
        translation: "Artificial Intelligence in Cataloguing Manuscript Heritage: Models for Recognition and Description",
        translationLang: "en",
      },
      authors: [
        { name: "يوسف الأمين", latin: "Yusuf Al-Amin", id: "0000-DEMO-0000-5560", role: "author" },
        { name: "هناء منصور", latin: "Hana Mansour", id: "0000-DEMO-0000-0088", role: "supervisor" },
      ],
      affiliation: ["Faculty of Information Studies, Cedar Coast University", "كلية دراسات المعلومات، جامعة الساحل الأرزي"],
      container: null,
      date: { iso: "2023-09", display: "September 2023 · Rabīʿ al-Awwal 1445 AH" },
      type: "Doctoral thesis",
      language: ["ar", "en"],
      subjects: ["Cataloging of manuscripts", "Artificial intelligence", "Manuscripts, Arabic"],
      keywords: ["manuscript cataloguing", "handwriting recognition", "heritage metadata"],
      identifier: { scheme: "handle", value: "hdl:0000/demo-thesis-0412" },
      references: null,
    },
  },
];

export function stepsOf(sample: Sample): Region[] {
  return [...sample.regions, { id: PAGE_STEP, label: "Language & subject inference", tone: "teal" }];
}

export function fieldsFrom(sample: Sample, stepId: string): FieldKey[] {
  return FIELD_ORDER.filter((k) => sample.fields[k].source === stepId);
}

const LANG_NAME: Record<string, string> = { ar: "Arabic", en: "English" };
export const langName = (c: string) => LANG_NAME[c] ?? c;
