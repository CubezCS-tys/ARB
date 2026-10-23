/**
 * Scripted corpus for the "Ask the archive" demo.
 * Every collection, passage and reference below is INVENTED for illustration.
 * No real works, people or historical claims are quoted.
 */

export type CollectionId = "treatise" | "journal" | "letters";

export const COLLECTIONS: Record<CollectionId, { en: string; ar: string; note: string }> = {
  treatise: {
    en: "Treatise on Orchard Husbandry",
    ar: "رسالة في فلاحة البساتين",
    note: "Imagined Andalusian agronomy treatise, c. 1850",
  },
  journal: {
    en: "Journal of Water Management Studies",
    ar: "مجلة دراسات تدبير المياه",
    note: "Fictional scholarly journal",
  },
  letters: {
    en: "Letters from the Valley Archive",
    ar: "رسائل أرشيف الوادي",
    note: "Fictional collection of letters",
  },
};

export type Passage = { id: string; collection: CollectionId; ref: string; ar: string; en: string };

export const PASSAGES: Record<string, Passage> = {
  p1: {
    id: "p1",
    collection: "treatise",
    ref: "ch. 3 §2",
    ar: "ويُزرع القمح في الأرض البعلية بعد أول مطر يبلّ التراب إلى عمق شبر، ولا يُعجَّل به قبل ذلك، فإن البذر في الأرض اليابسة يأكله النمل والطير.",
    en: "Wheat is sown in rain-fed land after the first rain that wets the soil to the depth of a hand-span; one should not hasten before that, for seed in dry ground is eaten by ants and birds.",
  },
  p2: {
    id: "p2",
    collection: "treatise",
    ref: "ch. 3 §4",
    ar: "وأحسن أوقات الزراعة في البعل من منتصف نونبر إلى آخر دجنبر، فما زُرع بعد ذلك قلّ حبّه وضعفت سنابله.",
    en: "The best time for sowing in rain-fed land is from mid-November to the end of December; what is sown after that yields less grain and weaker ears.",
  },
  p3: {
    id: "p3",
    collection: "treatise",
    ref: "ch. 7 §1",
    ar: "ومما يُصلح الأرض ويُعيد إليها خصبها أن تُترك سنةً بُوراً، أو تُزرع فيها الفول والحمص فإنها تُقوّي التربة، ويُطرح فيها الزبل المتعفّن دون الطري.",
    en: "Among what restores land and returns its fertility: leaving it fallow for a year, or sowing beans and chickpeas, for they strengthen the soil; and spreading well-rotted manure rather than fresh.",
  },
  p4: {
    id: "p4",
    collection: "journal",
    ref: "vol. 12, p. 41",
    ar: "وكان الماء يُقسم بين القرى بالنوبة، لكل قرية عدد من الساعات يُقاس بالطاسة المثقوبة، ويُشرف على ذلك أمين الماء الذي يُنتخب من شيوخ القرى.",
    en: "Water was divided between villages by rotation, each village receiving a number of hours measured with a perforated bowl, overseen by a water steward elected from among the village elders.",
  },
  p5: {
    id: "p5",
    collection: "journal",
    ref: "vol. 14, p. 7",
    ar: "وتُظهر سجلات النزاع أن الخلاف كان يُحال إلى مجلس السقي، فيُعاد توزيع الحصص في سنوات القحط بحسب عدد الأشجار لا بحسب مساحة الأرض.",
    en: "Dispute registers show that disagreements were referred to the irrigation council, which redistributed shares in drought years according to the number of trees rather than the area of land.",
  },
  p6: {
    id: "p6",
    collection: "letters",
    ref: "letter 23",
    ar: "وأما حال الزرع عندنا فقد أمسك المطر هذا العام حتى يبست السنابل قبل أن تمتلئ، وباع الناس مواشيهم بنصف ثمنها.",
    en: "As for the state of our crops, the rain held off this year until the ears dried before they filled, and people sold their livestock at half price.",
  },
  p7: {
    id: "p7",
    collection: "letters",
    ref: "letter 31",
    ar: "وقد أشار علينا الشيخ بأن نؤخر غرس الزيتون الجديد إلى أن يعود الماء إلى الساقية، وأن نسقي الأشجار القديمة ليلاً حفظاً للماء من الحرّ.",
    en: "The elder advised us to delay planting new olive trees until water returns to the channel, and to water the old trees at night to keep the water from the heat.",
  },
  p8: {
    id: "p8",
    collection: "journal",
    ref: "vol. 12, p. 44",
    ar: "ويُنظَّف مجرى الساقية مرتين في السنة، في الربيع والخريف، ويشارك في ذلك كل من له حصة في الماء.",
    en: "The channel bed is cleaned twice a year, in spring and autumn, and everyone holding a water share takes part.",
  },
  p9: {
    id: "p9",
    collection: "letters",
    ref: "letter 8",
    ar: "وصلنا كتابكم مع القافلة، والحمد لله على سلامة الطريق، وقد أرسلنا إليكم ما طلبتم من بذور البطيخ.",
    en: "Your letter reached us with the caravan, thank God for the safe road; we have sent you the melon seeds you asked for.",
  },
};

export const PASSAGE_COUNT = Object.keys(PASSAGES).length;

/** A citation points at an exact span inside a passage (Arabic + its English gloss). */
export type Citation = { n: number; pid: string; ar: string; en: string };
/** Answer is a list of text runs and citation numbers. */
export type Seg = string | number;
export type TraceLine = { k: string; v: string; dir: "rtl" | "ltr" };

export type Script = {
  id: string;
  q: string;
  gloss: string;
  dir: "rtl" | "ltr";
  trace: TraceLine[];
  retrieve: { pid: string; score: number }[];
  rerank: Record<string, number>;
  citations: Citation[];
  answer: { ar: Seg[]; en: Seg[] };
  keywords: string[];
  /** Illustrative timings in ms for the readout. */
  ms: { normalise: number; retrieve: number; rerank: number; generate: number };
};

export const KEEP_THRESHOLD = 0.5;

export const SCRIPTS: Script[] = [
  {
    id: "wheat",
    q: "متى يُزرَع القمح في الأرض البعلية؟",
    gloss: "When is wheat sown in rain-fed land?",
    dir: "rtl",
    trace: [
      { k: "strip diacritics", v: "يُزرَع ← يزرع", dir: "rtl" },
      { k: "normalise letters", v: "البعلية ← البعليه", dir: "rtl" },
      { k: "root extraction", v: "استخراج الجذر: ز-ر-ع · ق-م-ح · ب-ع-ل", dir: "rtl" },
      { k: "query expansion", v: "زرع، زراعة، بذر، بعل", dir: "rtl" },
    ],
    retrieve: [
      { pid: "p1", score: 0.912 },
      { pid: "p2", score: 0.884 },
      { pid: "p9", score: 0.611 },
      { pid: "p3", score: 0.574 },
      { pid: "p6", score: 0.468 },
      { pid: "p8", score: 0.302 },
    ],
    rerank: { p1: 0.97, p2: 0.95, p6: 0.41, p3: 0.33, p9: 0.18, p8: 0.07 },
    citations: [
      { n: 1, pid: "p1", ar: "بعد أول مطر يبلّ التراب إلى عمق شبر", en: "after the first rain that wets the soil to the depth of a hand-span" },
      { n: 2, pid: "p1", ar: "فإن البذر في الأرض اليابسة يأكله النمل والطير", en: "for seed in dry ground is eaten by ants and birds" },
      {
        n: 3,
        pid: "p2",
        ar: "من منتصف نونبر إلى آخر دجنبر، فما زُرع بعد ذلك قلّ حبّه وضعفت سنابله",
        en: "from mid-November to the end of December; what is sown after that yields less grain and weaker ears",
      },
    ],
    answer: {
      en: [
        "According to the treatise, wheat in rain-fed land is sown only after the first rain has wet the soil to a hand-span's depth",
        1,
        ", because seed left in dry ground is lost to ants and birds",
        2,
        ". The preferred window runs from mid-November to the end of December; later sowings give less grain and weaker ears",
        3,
        ".",
      ],
      ar: [
        "بحسب «رسالة في فلاحة البساتين»، لا يُزرع القمح في الأرض البعلية إلا بعد أول مطر يبلّ التراب إلى عمق شبر",
        1,
        "، لأن البذر في الأرض اليابسة يأكله النمل والطير",
        2,
        ". وأحسن أوقات الزرع من منتصف نونبر إلى آخر دجنبر، وما زُرع بعد ذلك قلّ حبّه وضعفت سنابله",
        3,
        ".",
      ],
    },
    keywords: ["قمح", "زرع", "زراعه", "بعل", "بذر", "مطر", "wheat", "sow", "sown", "rain-fed", "seed", "plant"],
    ms: { normalise: 9, retrieve: 74, rerank: 38, generate: 1180 },
  },
  {
    id: "water",
    q: "How was irrigation water shared between villages?",
    gloss: "كيف كان يُقسم ماء الري بين القرى؟",
    dir: "ltr",
    trace: [
      { k: "language", v: "en → ar · cross-lingual retrieval", dir: "ltr" },
      { k: "translate query", v: "كيف كان يقسم ماء الري بين القرى", dir: "rtl" },
      { k: "root extraction", v: "استخراج الجذر: ق-س-م · س-ق-ي · ق-ر-ي", dir: "rtl" },
      { k: "query expansion", v: "نوبة، حصة، ساقية، سقي", dir: "rtl" },
    ],
    retrieve: [
      { pid: "p4", score: 0.931 },
      { pid: "p5", score: 0.858 },
      { pid: "p8", score: 0.717 },
      { pid: "p7", score: 0.496 },
      { pid: "p6", score: 0.351 },
      { pid: "p2", score: 0.218 },
    ],
    rerank: { p4: 0.98, p5: 0.93, p8: 0.81, p7: 0.29, p6: 0.12, p2: 0.05 },
    citations: [
      { n: 1, pid: "p4", ar: "يُقسم بين القرى بالنوبة", en: "divided between villages by rotation" },
      { n: 2, pid: "p4", ar: "يُقاس بالطاسة المثقوبة", en: "measured with a perforated bowl" },
      { n: 3, pid: "p4", ar: "أمين الماء الذي يُنتخب من شيوخ القرى", en: "a water steward elected from among the village elders" },
      { n: 4, pid: "p5", ar: "بحسب عدد الأشجار لا بحسب مساحة الأرض", en: "according to the number of trees rather than the area of land" },
      { n: 5, pid: "p8", ar: "ويشارك في ذلك كل من له حصة في الماء", en: "everyone holding a water share takes part" },
    ],
    answer: {
      en: [
        "Water was shared by rotation: each village held a fixed number of hours",
        1,
        ", timed with a perforated bowl",
        2,
        ". A water steward elected from the village elders oversaw the turns",
        3,
        ". In drought years, disputes went to an irrigation council that redistributed shares by number of trees rather than land area",
        4,
        ", and every shareholder helped clean the channel twice a year",
        5,
        ".",
      ],
      ar: [
        "كان الماء يُقسم بين القرى بالنوبة، لكل قرية عدد معلوم من الساعات",
        1,
        " يُقاس بالطاسة المثقوبة",
        2,
        "، ويُشرف على النوبة أمين ماء يُنتخب من شيوخ القرى",
        3,
        ". وفي سنوات القحط كان النزاع يُحال إلى مجلس السقي فيُعاد توزيع الحصص بحسب عدد الأشجار لا مساحة الأرض",
        4,
        "، ويشارك كل صاحب حصة في تنظيف الساقية مرتين في السنة",
        5,
        ".",
      ],
    },
    keywords: ["ماء", "مياه", "قسم", "يقسم", "قري", "قريه", "سقي", "ري", "نوبه", "ساقيه", "حصه", "water", "irrigation", "share", "shared", "village", "rotation", "channel"],
    ms: { normalise: 21, retrieve: 88, rerank: 44, generate: 1460 },
  },
  {
    id: "drought",
    q: "ماذا تقول الرسائل عن أثر الجفاف على المحاصيل؟",
    gloss: "What do the letters say about drought and the crops?",
    dir: "rtl",
    trace: [
      { k: "strip diacritics", v: "لا تغيير", dir: "rtl" },
      { k: "strip clitics", v: "الرسائل ← رسائل · المحاصيل ← محاصيل", dir: "rtl" },
      { k: "root extraction", v: "استخراج الجذر: ج-ف-ف · ح-ص-ل · ر-س-ل", dir: "rtl" },
      { k: "query expansion", v: "قحط، يبس، أمسك المطر، غلة", dir: "rtl" },
      { k: "collection boost", v: "رسائل أرشيف الوادي ×1.4", dir: "rtl" },
    ],
    retrieve: [
      { pid: "p6", score: 0.924 },
      { pid: "p7", score: 0.813 },
      { pid: "p5", score: 0.632 },
      { pid: "p9", score: 0.577 },
      { pid: "p1", score: 0.402 },
      { pid: "p8", score: 0.288 },
    ],
    rerank: { p6: 0.96, p7: 0.91, p5: 0.74, p9: 0.22, p1: 0.14, p8: 0.06 },
    citations: [
      { n: 1, pid: "p6", ar: "يبست السنابل قبل أن تمتلئ", en: "the ears dried before they filled" },
      { n: 2, pid: "p6", ar: "باع الناس مواشيهم بنصف ثمنها", en: "people sold their livestock at half price" },
      { n: 3, pid: "p7", ar: "نؤخر غرس الزيتون الجديد", en: "delay planting new olive trees" },
      { n: 4, pid: "p7", ar: "نسقي الأشجار القديمة ليلاً حفظاً للماء من الحرّ", en: "water the old trees at night to keep the water from the heat" },
      { n: 5, pid: "p5", ar: "بحسب عدد الأشجار لا بحسب مساحة الأرض", en: "according to the number of trees rather than the area of land" },
    ],
    answer: {
      en: [
        "The letters describe a year when the rain held off until the ears dried before they filled",
        1,
        ", and people sold their livestock at half price",
        2,
        ". Correspondents were advised to delay planting new olive trees",
        3,
        " and to water old trees at night to save water from the heat",
        4,
        ". The water-management journal adds that in such years shares were reallocated by number of trees",
        5,
        ".",
      ],
      ar: [
        "تصف الرسائل عاماً أمسك فيه المطر حتى يبست السنابل قبل أن تمتلئ",
        1,
        "، فباع الناس مواشيهم بنصف ثمنها",
        2,
        ". وأُشير على أهل الوادي بتأخير غرس الزيتون الجديد",
        3,
        " وبسقي الأشجار القديمة ليلاً حفظاً للماء من الحرّ",
        4,
        ". وتذكر مجلة تدبير المياه أن الحصص في مثل هذه السنين كانت تُوزَّع بحسب عدد الأشجار",
        5,
        ".",
      ],
    },
    keywords: ["جفاف", "قحط", "رسائل", "رساله", "محاصيل", "مطر", "يبس", "drought", "letters", "letter", "crop", "crops", "dry", "rain"],
    ms: { normalise: 12, retrieve: 81, rerank: 41, generate: 1390 },
  },
  {
    id: "soil",
    q: "How did the treatise restore soil fertility?",
    gloss: "كيف تُعاد خصوبة التربة بحسب الرسالة؟",
    dir: "ltr",
    trace: [
      { k: "language", v: "en → ar · cross-lingual retrieval", dir: "ltr" },
      { k: "translate query", v: "كيف تعاد خصوبه التربه", dir: "rtl" },
      { k: "root extraction", v: "استخراج الجذر: خ-ص-ب · ت-ر-ب · ص-ل-ح", dir: "rtl" },
      { k: "query expansion", v: "خصب، بور، زبل، إصلاح الأرض", dir: "rtl" },
    ],
    retrieve: [
      { pid: "p3", score: 0.943 },
      { pid: "p1", score: 0.582 },
      { pid: "p2", score: 0.514 },
      { pid: "p9", score: 0.431 },
      { pid: "p8", score: 0.289 },
    ],
    rerank: { p3: 0.99, p1: 0.31, p2: 0.27, p9: 0.09, p8: 0.04 },
    citations: [
      { n: 1, pid: "p3", ar: "أن تُترك سنةً بُوراً", en: "leaving it fallow for a year" },
      { n: 2, pid: "p3", ar: "تُزرع فيها الفول والحمص فإنها تُقوّي التربة", en: "sowing beans and chickpeas, for they strengthen the soil" },
      { n: 3, pid: "p3", ar: "الزبل المتعفّن دون الطري", en: "well-rotted manure rather than fresh" },
    ],
    answer: {
      en: [
        "The treatise recommends three remedies: leaving the land fallow for a year",
        1,
        ", sowing beans and chickpeas, which strengthen the soil",
        2,
        ", and spreading well-rotted rather than fresh manure",
        3,
        ".",
      ],
      ar: [
        "توصي الرسالة بثلاث وسائل لإعادة الخصب إلى الأرض: تركها سنةً بوراً",
        1,
        "، وزرع الفول والحمص فيها لأنهما يقوّيان التربة",
        2,
        "، وطرح الزبل المتعفّن دون الطري",
        3,
        ".",
      ],
    },
    keywords: ["خصب", "خصوبه", "تربه", "ارض", "زبل", "سماد", "بور", "soil", "fertility", "fertile", "manure", "fallow", "restore"],
    ms: { normalise: 18, retrieve: 69, rerank: 35, generate: 980 },
  },
];

export const FALLBACK = {
  en: "This demo answers the suggested questions only. Try one of the prompts below, in Arabic or English.",
  ar: "يجيب هذا العرض التوضيحي عن الأسئلة المقترحة فقط. جرّب أحد الأسئلة أدناه بالعربية أو الإنجليزية.",
};

/** Light Arabic normalisation used for keyword matching. */
export function normaliseArabic(s: string) {
  return s
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

export const isArabic = (s: string) => /[؀-ۿ]/.test(s);

/** Find the scripted question whose keywords best match free text. */
export function matchScript(text: string): Script | null {
  const n = normaliseArabic(text);
  let best: Script | null = null;
  let bestHits = 0;
  for (const s of SCRIPTS) {
    if (normaliseArabic(s.q) === n.trim()) return s;
    const hits = s.keywords.reduce((acc, k) => (n.includes(normaliseArabic(k)) ? acc + 1 : acc), 0);
    if (hits > bestHits) {
      best = s;
      bestHits = hits;
    }
  }
  return best;
}

/** Split answer runs into stream tokens (words, spaces, citation numbers). */
export function tokenize(segs: Seg[]): Seg[] {
  const out: Seg[] = [];
  for (const s of segs) {
    if (typeof s === "number") out.push(s);
    else out.push(...s.split(/(\s+)/).filter(Boolean));
  }
  return out;
}

export const TOKENS: Record<string, { ar: Seg[]; en: Seg[] }> = Object.fromEntries(
  SCRIPTS.map((s) => [s.id, { ar: tokenize(s.answer.ar), en: tokenize(s.answer.en) }]),
);

export const wordCount = (tokens: Seg[], upto = tokens.length) =>
  tokens.slice(0, upto).filter((t) => typeof t === "number" || t.trim().length > 0).length;
