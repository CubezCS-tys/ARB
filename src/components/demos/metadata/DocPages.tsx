"use client";

/**
 * Styled HTML mockups of the three sample pages. All sizes are in container
 * query units (cqw) so the same markup renders as a full page or a thumbnail.
 * Parent must set `container-type: inline-size`.
 */

import type { Sample } from "./samples";

export type Reg = (id: string) => (el: HTMLElement | null) => void;
const noop: Reg = () => () => {};

const INK = "text-[#1C2333]";
const FAINT = "text-[#5B6478]";

/** Greyed body text: lines of filler so the page reads as a page without lorem ipsum */
function Lines({ n, seed = 1, rtl = false }: { n: number; seed?: number; rtl?: boolean }) {
  return (
    <div className={`flex flex-col gap-[1.15cqw] ${rtl ? "items-end" : "items-start"}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const w = i === n - 1 ? 35 + ((seed * 13 + i * 7) % 30) : 88 + ((seed * 7 + i * 11) % 12);
        return <span key={i} className="block h-[0.9cqw] rounded-full bg-[#1C2333]/[0.13]" style={{ width: `${w}%` }} />;
      })}
    </div>
  );
}

function ArabicJournal({ reg }: { reg: Reg }) {
  return (
    <div dir="rtl" lang="ar" className={`flex h-full flex-col px-[7cqw] pb-[5cqw] pt-[6cqw] font-arabic ${INK}`}>
      <header ref={reg("masthead")} className="flex items-end justify-between border-b border-[#1C2333]/30 pb-[1.6cqw]">
        <div>
          <p className="text-[3.1cqw] font-semibold leading-tight">مجلة الدراسات اللغوية الحاسوبية</p>
          <p className={`text-[1.9cqw] ${FAINT}`}>مجلة علمية محكّمة · بحث أصيل</p>
        </div>
        <p className={`text-left text-[1.9cqw] leading-snug ${FAINT}`}>
          المجلد ١٢، العدد ٢
          <br />
          رمضان ١٤٤٥هـ / مارس ٢٠٢٤
        </p>
      </header>

      <h4 ref={reg("title")} className="mx-auto mt-[5cqw] max-w-[92%] text-center text-[4.6cqw] font-semibold leading-[1.45]">
        نحو معالجة صرفية للمخطوطات العربية الرقمية: مقاربة قائمة على الجذر والوزن
      </h4>
      <p ref={reg("authors")} className="mx-auto mt-[2.4cqw] text-center text-[2.7cqw]">
        ليلى بن عمر<sup>١</sup>، كريم الحداد<sup>٢</sup>
      </p>
      <p ref={reg("affiliation")} className={`mx-auto mt-[1cqw] text-center text-[1.95cqw] leading-relaxed ${FAINT}`}>
        <sup>١</sup> قسم علوم الحاسوب، جامعة الواحات الشرقية · <sup>٢</sup> معهد دراسات التراث المخطوط، جامعة الواحات الشرقية
      </p>

      <section ref={reg("abstract")} className="mt-[3.6cqw] border-y border-[#1C2333]/15 py-[2.2cqw]">
        <p className="text-[2.3cqw] font-semibold">الملخص</p>
        <p className="mt-[0.6cqw] text-justify text-[2.05cqw] leading-[1.75]">
          تقترح هذه الدراسة منهجاً لتحليل البنية الصرفية في المخطوطات العربية بعد رقمنتها، يعتمد على استخراج الجذور
          والأوزان وربطها بسياقها. وتُظهر التجارب على مدوّنة تجريبية تحسّناً في دقة الاسترجاع مقارنةً بالطرق القائمة على
          الكلمة المفردة.
        </p>
      </section>
      <p ref={reg("keywords")} className="mt-[1.8cqw] text-[1.95cqw]">
        <span className="font-semibold">الكلمات المفتاحية: </span>
        الصرف العربي، المخطوطات، الرقمنة، الاسترجاع، الجذر والوزن
      </p>

      <div className="mt-[3cqw] grid min-h-0 flex-1 grid-cols-2 gap-[4cqw] overflow-hidden">
        <div>
          <p className="mb-[1.2cqw] text-[2.2cqw] font-semibold">١. المقدمة</p>
          <Lines n={9} seed={2} rtl />
        </div>
        <div className="flex flex-col">
          <Lines n={3} seed={5} rtl />
          <div ref={reg("references")} className="mt-[2cqw]">
            <p className="text-[2.2cqw] font-semibold">المراجع</p>
            <ol className={`mt-[0.6cqw] space-y-[0.5cqw] text-[1.65cqw] leading-snug ${FAINT}`}>
              <li>[١] الحداد، ك. (٢٠١٩). الجذر بوصفه وحدة فهرسة.</li>
              <li>[٢] بن عمر، ل. (٢٠٢١). مدوّنات المخطوطات الرقمية.</li>
              <li>[٣] Haddad, K. (2022). Root-based indexing…</li>
            </ol>
          </div>
        </div>
      </div>

      <footer className={`mt-[2cqw] flex items-center justify-between border-t border-[#1C2333]/20 pt-[1.4cqw] text-[1.7cqw] ${FAINT}`}>
        <span ref={reg("doi")} dir="ltr" className="font-mono">
          DOI: 10.0000/demo.jcls.2024.031
        </span>
        <span>١</span>
      </footer>
    </div>
  );
}

function EnglishConference({ reg }: { reg: Reg }) {
  return (
    <div lang="en" className={`flex h-full flex-col px-[7cqw] pb-[5cqw] pt-[5.5cqw] font-serif ${INK}`}>
      <header ref={reg("masthead")} className={`border-b border-[#1C2333]/25 pb-[1.4cqw] text-center text-[1.75cqw] italic ${FAINT}`}>
        Proceedings of the 9th Symposium on Document Intelligence (SDI ’24) · September 2024 · pp. 112–124
      </header>
      <h4 ref={reg("title")} className="mx-auto mt-[4.5cqw] max-w-[90%] text-center text-[4.5cqw] font-bold leading-[1.2]">
        Layout-Aware Reference Linking for Mixed-Script Scholarly Archives
      </h4>
      <p ref={reg("authors")} className="mt-[2.6cqw] text-center text-[2.5cqw]">
        Amira Rahimi<sup>1</sup> · Joseph Okafor<sup>1</sup> · Maja Lindqvist<sup>2</sup>
      </p>
      <p ref={reg("affiliation")} className={`mx-auto mt-[0.8cqw] max-w-[88%] text-center text-[1.8cqw] leading-snug ${FAINT}`}>
        <sup>1</sup> Dept. of Information Science, Northbridge Institute of Technology
        <br />
        <sup>2</sup> Centre for Archival Computing, Harbourline University
      </p>

      <div className="mt-[3.6cqw] grid min-h-0 flex-1 grid-cols-2 gap-[3.5cqw] overflow-hidden font-sans">
        <div className="flex flex-col">
          <section ref={reg("abstract")}>
            <p className="font-serif text-[2.2cqw] font-bold">Abstract</p>
            <p className="mt-[0.6cqw] text-justify text-[1.75cqw] leading-[1.55]">
              Scholarly archives in the Arab world mix Arabic and Latin script on the same page, which breaks reference
              parsers trained on English layouts. We describe a layout-aware linker that segments reference blocks, reads
              them in the correct direction and resolves them against a citation index.
            </p>
          </section>
          <p ref={reg("keywords")} className="mt-[1.6cqw] text-[1.7cqw] leading-snug">
            <span className="font-semibold italic">Keywords: </span>
            reference extraction, layout analysis, Arabic script, citation linking, digital archives
          </p>
          <p className="mb-[1cqw] mt-[2.4cqw] font-serif text-[2.1cqw] font-bold">1&nbsp;&nbsp;Introduction</p>
          <Lines n={6} seed={3} />
        </div>
        <div className="flex flex-col">
          <Lines n={10} seed={4} />
          <p className="mb-[1cqw] mt-[2cqw] font-serif text-[2.1cqw] font-bold">2&nbsp;&nbsp;Related work</p>
          <Lines n={5} seed={6} />
          <div ref={reg("references")} className="mt-[2cqw]">
            <p className="font-serif text-[2.1cqw] font-bold">References</p>
            <ol className={`mt-[0.6cqw] space-y-[0.5cqw] text-[1.55cqw] leading-snug ${FAINT}`}>
              <li>[1] K. Haddad. Root-based indexing of manuscripts. 2022.</li>
              <li>[2] L. Ben Omar. Corpora of digitised manuscripts. 2021.</li>
              <li>[3] S. Toumi et al. Reading order in bidi layouts. 2020.</li>
            </ol>
          </div>
        </div>
      </div>

      <footer className={`mt-[2cqw] flex items-center justify-between border-t border-[#1C2333]/20 pt-[1.4cqw] text-[1.6cqw] ${FAINT}`}>
        <span ref={reg("doi")} className="font-mono">
          https://doi.org/10.0000/demo.sdi.2024.117
        </span>
        <span>112</span>
      </footer>
    </div>
  );
}

function Crest() {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full" aria-hidden>
      <g fill="none" stroke="#1C2333" strokeWidth="1.4">
        <rect x="14" y="14" width="32" height="32" />
        <rect x="14" y="14" width="32" height="32" transform="rotate(45 30 30)" />
        <circle cx="30" cy="30" r="9" stroke="#8C7650" />
      </g>
      <path d="M30 23 L33 30 L30 37 L27 30 Z" fill="#8C7650" />
    </svg>
  );
}

function BilingualThesis({ reg }: { reg: Reg }) {
  return (
    <div className={`flex h-full flex-col items-center px-[8cqw] pb-[6cqw] pt-[7cqw] text-center ${INK}`}>
      <div ref={reg("affiliation")} className="flex flex-col items-center">
        <div className="h-[10cqw] w-[10cqw]">
          <Crest />
        </div>
        <p dir="rtl" lang="ar" className="mt-[1.6cqw] font-arabic text-[2.8cqw] font-semibold leading-snug">
          جامعة الساحل الأرزي · كلية دراسات المعلومات
        </p>
        <p className="font-serif text-[2.2cqw] uppercase tracking-[0.12em]">Cedar Coast University · Faculty of Information Studies</p>
      </div>

      <span className="mt-[4cqw] block h-px w-[30%] bg-[#8C7650]" aria-hidden />

      <h4 ref={reg("title")} dir="rtl" lang="ar" className="mt-[4cqw] font-arabic text-[5cqw] font-semibold leading-[1.5]">
        الذكاء الاصطناعي في فهرسة التراث المخطوط: نماذج للتعرّف والوصف
      </h4>
      <p ref={reg("titleEn")} lang="en" className="mt-[2.4cqw] max-w-[88%] font-serif text-[3.2cqw] italic leading-[1.3]">
        Artificial Intelligence in Cataloguing Manuscript Heritage: Models for Recognition and Description
      </p>

      <div ref={reg("authors")} className="mt-[6cqw] grid w-full grid-cols-2 gap-[4cqw]">
        <div className="font-serif">
          <p className={`text-[1.8cqw] uppercase tracking-[0.15em] ${FAINT}`}>Candidate</p>
          <p className="mt-[0.6cqw] text-[2.7cqw]">Yusuf Al-Amin</p>
          <p className={`mt-[1.6cqw] text-[1.8cqw] uppercase tracking-[0.15em] ${FAINT}`}>Supervisor</p>
          <p className="mt-[0.6cqw] text-[2.4cqw]">Prof. Hana Mansour</p>
        </div>
        <div dir="rtl" lang="ar" className="font-arabic">
          <p className={`text-[2cqw] ${FAINT}`}>إعداد</p>
          <p className="text-[3cqw]">يوسف الأمين</p>
          <p className={`mt-[1cqw] text-[2cqw] ${FAINT}`}>إشراف</p>
          <p className="text-[2.7cqw]">أ.د. هناء منصور</p>
        </div>
      </div>

      <div ref={reg("degree")} className="mt-[6cqw] space-y-[1cqw]">
        <p dir="rtl" lang="ar" className="font-arabic text-[2.3cqw] leading-relaxed">
          رسالة مقدَّمة استكمالاً لمتطلبات نيل درجة الدكتوراه في علوم المعلومات
        </p>
        <p className="font-serif text-[2.1cqw] italic leading-snug">
          A thesis submitted in fulfilment of the requirements for the degree of Doctor of Philosophy
        </p>
        <p className="pt-[1cqw] font-serif text-[2.2cqw]">
          <span dir="rtl" lang="ar" className="font-arabic">
            ربيع الأول ١٤٤٥هـ
          </span>{" "}
          · September 2023
        </p>
      </div>

      <div className="flex-1" />
      <p ref={reg("doi")} className={`font-mono text-[1.7cqw] ${FAINT}`}>
        Repository ID: hdl:0000/demo-thesis-0412
      </p>
    </div>
  );
}

export function DocPage({ sample, reg = noop }: { sample: Sample; reg?: Reg }) {
  switch (sample.id) {
    case "ar-journal":
      return <ArabicJournal reg={reg} />;
    case "en-conference":
      return <EnglishConference reg={reg} />;
    case "bi-thesis":
      return <BilingualThesis reg={reg} />;
  }
}
