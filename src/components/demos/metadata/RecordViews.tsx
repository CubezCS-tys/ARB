"use client";

import { Fragment, type ReactNode } from "react";
import { motion } from "framer-motion";
import { FIELD_LABEL, FIELD_ORDER, langName, type FieldKey, type Sample } from "./samples";

const isArabic = (s: string) => /[؀-ۿ]/.test(s);

export function ConfidenceChip({ value, pending }: { value: number | null; pending?: boolean }) {
  if (pending) return <span className="inline-block h-4 w-9 animate-pulse rounded-full bg-white/[0.06]" aria-hidden />;
  if (value === null)
    return (
      <span className="rounded-full border border-white/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mist">
        absent
      </span>
    );
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.95
      ? "border-teal/50 text-teal-light bg-teal/10"
      : value >= 0.85
        ? "border-gold/40 text-gold-light bg-gold/[0.07]"
        : "border-gold-dim/60 text-gold-dim bg-gold-dim/10";
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-1.5 py-0.5 font-mono text-[9px] tabular-nums ${tone}`}
      title={value < 0.85 ? "Below review threshold" : "Confidence"}
    >
      {pct}%{value < 0.85 ? " · review" : ""}
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      dir="auto"
      className={`inline-block rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-paper ${
        typeof children === "string" && isArabic(children) ? "font-arabic text-[12px]" : ""
      }`}
    >
      {children}
    </span>
  );
}

function FieldValue({ k, sample }: { k: FieldKey; sample: Sample }) {
  const r = sample.record;
  switch (k) {
    case "title":
      return r.title.lang === "ar" ? (
        <p dir="rtl" lang="ar" className="font-arabic text-[15px] leading-relaxed text-paper">
          {r.title.value}
        </p>
      ) : (
        <p className="font-serif text-[15px] leading-snug text-paper">{r.title.value}</p>
      );
    case "titleAlt":
      return (
        <div className="space-y-1">
          {r.titleAlt.transliteration && (
            <p className="text-[12px] italic leading-snug text-mist">
              <span className="mr-1.5 font-mono text-[9px] not-italic uppercase tracking-wider text-gold-dim">translit</span>
              {r.titleAlt.transliteration}
            </p>
          )}
          {r.titleAlt.translation && (
            <p
              dir={r.titleAlt.translationLang === "ar" ? "rtl" : "ltr"}
              lang={r.titleAlt.translationLang}
              className={`leading-snug text-paper ${r.titleAlt.translationLang === "ar" ? "font-arabic text-[13px]" : "text-[12px]"}`}
            >
              <span className="mx-1.5 font-mono text-[9px] uppercase tracking-wider text-gold-dim">
                {r.titleAlt.translationLang}
              </span>
              {r.titleAlt.translation}
            </p>
          )}
        </div>
      );
    case "authors":
      return (
        <ul className="space-y-1">
          {r.authors.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline gap-x-2">
              <span dir="auto" className={isArabic(a.name) ? "font-arabic text-[14px] text-paper" : "text-[13px] text-paper"}>
                {a.name}
              </span>
              {a.latin && <span className="text-[12px] text-mist">{a.latin}</span>}
              {a.role && a.role !== "author" && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-gold-dim">{a.role}</span>
              )}
              <span className="font-mono text-[10px] text-teal-light">id {a.id}</span>
            </li>
          ))}
        </ul>
      );
    case "affiliation":
      return (
        <ul className="space-y-0.5">
          {r.affiliation.map((a) => (
            <li key={a} dir="auto" className={isArabic(a) ? "font-arabic text-[13px] text-paper" : "text-[12px] text-paper"}>
              {a}
            </li>
          ))}
        </ul>
      );
    case "container":
      return r.container ? (
        <div>
          <p dir="auto" className={isArabic(r.container.value) ? "font-arabic text-[13px] text-paper" : "text-[12px] text-paper"}>
            {r.container.value}
          </p>
          {r.container.translation && <p className="text-[11px] text-mist">{r.container.translation}</p>}
        </div>
      ) : (
        <p className="text-[12px] text-mist">—</p>
      );
    case "date":
      return (
        <p className="text-[12px] text-paper">
          <span className="font-mono text-gold-light">{r.date.iso}</span>
          <span className="ml-2 text-mist">{r.date.display}</span>
        </p>
      );
    case "type":
      return <p className="text-[12px] text-paper">{r.type}</p>;
    case "language":
      return (
        <div className="flex flex-wrap gap-1">
          {r.language.map((l) => (
            <Tag key={l}>{`${l} · ${langName(l)}`}</Tag>
          ))}
        </div>
      );
    case "subjects":
    case "keywords":
      return (
        <div className="flex flex-wrap gap-1">
          {r[k].map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      );
    case "identifier":
      return r.identifier ? (
        <p className="break-all font-mono text-[11px] text-teal-light">
          {r.identifier.scheme}:{r.identifier.scheme === "doi" ? r.identifier.value : r.identifier.value.replace(/^hdl:/, "")}
        </p>
      ) : (
        <p className="text-[12px] text-mist">—</p>
      );
    case "references":
      return r.references !== null ? (
        <p className="text-[12px] text-paper">
          <span className="font-serif text-[16px] text-gold-light">{r.references}</span> entries parsed and queued for linking
        </p>
      ) : (
        <p className="text-[12px] text-mist">—</p>
      );
  }
}

export function CardView({
  sample,
  isFilled,
  flash,
  rowRef,
}: {
  sample: Sample;
  isFilled: (k: FieldKey) => boolean;
  flash: Set<FieldKey>;
  rowRef: (k: FieldKey) => (el: HTMLElement | null) => void;
}) {
  return (
    <dl className="divide-y divide-white/[0.06]">
      {FIELD_ORDER.map((k) => {
        const meta = sample.fields[k];
        const filled = isFilled(k);
        return (
          <div
            key={k}
            ref={rowRef(k)}
            className={`grid grid-cols-[92px_minmax(0,1fr)_auto] items-start gap-3 px-1 py-2.5 transition-colors duration-700 sm:grid-cols-[118px_minmax(0,1fr)_auto] ${
              flash.has(k) ? "bg-gold/[0.08]" : "bg-transparent"
            }`}
          >
            <dt className="pt-0.5 font-mono text-[9.5px] uppercase leading-tight tracking-[0.14em] text-mist">{FIELD_LABEL[k]}</dt>
            <dd className="min-w-0">
              {filled ? (
                <motion.div
                  initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FieldValue k={k} sample={sample} />
                  {meta.note && <p className="mt-1 font-mono text-[9.5px] text-mist/80">{meta.note}</p>}
                </motion.div>
              ) : (
                <span className="mt-1 block h-3 w-2/3 rounded bg-white/[0.05]" aria-label="pending" />
              )}
            </dd>
            <dd className="pt-0.5">
              <ConfidenceChip value={meta.confidence} pending={!filled} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

// ---------- machine-readable views ----------

export function buildRecord(sample: Sample, isFilled: (k: FieldKey) => boolean) {
  const r = sample.record;
  const o: Record<string, unknown> = {};
  const conf: Record<string, number | null> = {};
  for (const k of FIELD_ORDER) {
    if (!isFilled(k)) continue;
    conf[k] = sample.fields[k].confidence;
    switch (k) {
      case "title":
        o.title = { value: r.title.value, lang: r.title.lang };
        break;
      case "titleAlt":
        o.title_alt = {
          ...(r.titleAlt.transliteration ? { transliteration: r.titleAlt.transliteration, scheme: "ALA-LC" } : {}),
          ...(r.titleAlt.translation ? { translation: r.titleAlt.translation, lang: r.titleAlt.translationLang } : {}),
        };
        break;
      case "authors":
        o.authors = r.authors.map((a) => ({
          name: a.name,
          ...(a.latin ? { name_latin: a.latin } : {}),
          role: a.role ?? "author",
          id: a.id,
          id_scheme: "orcid-style (demo)",
        }));
        break;
      case "affiliation":
        o.affiliations = r.affiliation;
        break;
      case "container":
        o.is_part_of = r.container ? r.container.value : null;
        break;
      case "date":
        o.date = r.date.iso;
        break;
      case "type":
        o.type = r.type;
        break;
      case "language":
        o.language = r.language;
        break;
      case "subjects":
        o.subjects = r.subjects;
        break;
      case "keywords":
        o.keywords = r.keywords;
        break;
      case "identifier":
        o.identifier = r.identifier;
        break;
      case "references":
        o.reference_count = r.references;
        break;
    }
  }
  o._extraction = {
    source: sample.file,
    engine: "si-parse (simulated demo)",
    confidence: conf,
  };
  return o;
}

const TOKEN = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;

export function JsonView({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2);
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of Array.from(text.matchAll(TOKEN))) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<span key={i++} className="text-mist/70">{text.slice(last, idx)}</span>);
    if (m[1] && m[2]) {
      out.push(
        <Fragment key={i++}>
          <span className="text-gold">{m[1]}</span>
          <span className="text-mist/70">{m[2]}</span>
        </Fragment>
      );
    } else if (m[1]) {
      out.push(
        <span key={i++} className={`text-teal-light [unicode-bidi:isolate] ${isArabic(m[1]) ? "font-arabic" : ""}`}>
          {m[1]}
        </span>
      );
    } else if (m[3]) {
      out.push(<span key={i++} className="text-gold-dim">{m[3]}</span>);
    } else if (m[4]) {
      out.push(<span key={i++} className="text-gold-light">{m[4]}</span>);
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(<span key={i++} className="text-mist/70">{text.slice(last)}</span>);
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.7]" aria-label="Record as JSON">
      <code>{out}</code>
    </pre>
  );
}

function Line({ tag, attrs, value }: { tag: string; attrs?: string; value: string }) {
  return (
    <div className="break-words">
      <span className="text-teal">&lt;{tag}</span>
      {attrs && <span className="text-gold-dim"> {attrs}</span>}
      <span className="text-teal">&gt;</span>
      <span dir="auto" className={`text-paper [unicode-bidi:isolate] ${isArabic(value) ? "font-arabic" : ""}`}>
        {value}
      </span>
      <span className="text-teal">&lt;/{tag}&gt;</span>
    </div>
  );
}

export function DublinCoreView({ sample, isFilled }: { sample: Sample; isFilled: (k: FieldKey) => boolean }) {
  const r = sample.record;
  const f = isFilled;
  return (
    <div className="font-mono text-[11px] leading-[1.75]" aria-label="Record as Dublin Core XML">
      <div className="text-mist/70">&lt;oai_dc:dc xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot;&gt;</div>
      <div className="pl-4">
        {f("title") && <Line tag="dc:title" attrs={`xml:lang="${r.title.lang}"`} value={r.title.value} />}
        {f("titleAlt") && r.titleAlt.translation && (
          <Line tag="dcterms:alternative" attrs={`xml:lang="${r.titleAlt.translationLang}"`} value={r.titleAlt.translation} />
        )}
        {f("authors") &&
          r.authors.map((a) => (
            <Line key={a.id} tag={a.role === "supervisor" ? "dc:contributor" : "dc:creator"} value={a.latin ?? a.name} />
          ))}
        {f("affiliation") && r.affiliation.map((a) => <Line key={a} tag="dc:publisher" value={a} />)}
        {f("container") && r.container && <Line tag="dcterms:isPartOf" value={r.container.value} />}
        {f("date") && <Line tag="dc:date" value={r.date.iso} />}
        {f("type") && <Line tag="dc:type" value={r.type} />}
        {f("language") && r.language.map((l) => <Line key={l} tag="dc:language" value={l} />)}
        {f("subjects") && r.subjects.map((s) => <Line key={s} tag="dc:subject" value={s} />)}
        {f("keywords") && r.keywords.map((s) => <Line key={s} tag="dc:subject" attrs='type="keyword"' value={s} />)}
        {f("identifier") && r.identifier && (
          <Line tag="dc:identifier" value={r.identifier.scheme === "doi" ? `https://doi.org/${r.identifier.value}` : r.identifier.value} />
        )}
      </div>
      <div className="text-mist/70">&lt;/oai_dc:dc&gt;</div>
    </div>
  );
}

function Marc({ tag, ind = "  ", subs }: { tag: string; ind?: string; subs: [string, string][] }) {
  return (
    <div className="grid grid-cols-[34px_24px_minmax(0,1fr)] gap-2">
      <span className="text-gold">{tag}</span>
      <span className="whitespace-pre text-mist/70">{ind.replace(/ /g, "_")}</span>
      <span className="break-words">
        {subs.map(([c, v], i) => (
          <span key={i}>
            <span className="text-teal">${c}</span>
            <span dir="auto" className={`text-paper [unicode-bidi:isolate] ${isArabic(v) ? "font-arabic" : ""}`}>
              {" "}
              {v}{" "}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}

export function MarcView({ sample, isFilled }: { sample: Sample; isFilled: (k: FieldKey) => boolean }) {
  const r = sample.record;
  const f = isFilled;
  const lang3 = (l: string) => (l === "ar" ? "ara" : l === "en" ? "eng" : l);
  const [first, ...rest] = r.authors;
  return (
    <div className="space-y-0.5 font-mono text-[11px] leading-[1.7]" aria-label="Record as MARC-style fields">
      <p className="mb-2 text-mist/70">LDR  00000nam a2200000 i 4500 · MARC-style view (simplified)</p>
      {f("identifier") && r.identifier && <Marc tag="024" ind="7 " subs={[["a", r.identifier.value], ["2", r.identifier.scheme]]} />}
      {f("language") && <Marc tag="041" ind="0 " subs={r.language.map((l) => ["a", lang3(l)] as [string, string])} />}
      {f("authors") && first && <Marc tag="100" ind="1 " subs={[["a", first.latin ?? first.name], ["0", first.id]]} />}
      {f("title") && <Marc tag="245" ind="10" subs={[["a", r.title.value]]} />}
      {f("titleAlt") && r.titleAlt.transliteration && <Marc tag="880" ind="10" subs={[["a", r.titleAlt.transliteration]]} />}
      {f("titleAlt") && r.titleAlt.translation && <Marc tag="246" ind="31" subs={[["a", r.titleAlt.translation]]} />}
      {f("date") && <Marc tag="264" ind=" 1" subs={[["c", r.date.iso.slice(0, 4)]]} />}
      {f("type") && r.type === "Doctoral thesis" && <Marc tag="502" subs={[["b", "PhD"], ["c", r.affiliation[0]], ["d", r.date.iso.slice(0, 4)]]} />}
      {f("references") && r.references !== null && <Marc tag="504" subs={[["a", `Includes bibliographical references (${r.references}).`]]} />}
      {f("subjects") && r.subjects.map((s) => <Marc key={s} tag="650" ind=" 0" subs={[["a", s]]} />)}
      {f("keywords") && r.keywords.map((s) => <Marc key={s} tag="653" subs={[["a", s]]} />)}
      {f("authors") && rest.map((a) => <Marc key={a.id} tag="700" ind="1 " subs={[["a", a.latin ?? a.name], ["e", a.role ?? "author"], ["0", a.id]]} />)}
      {f("affiliation") && r.affiliation.slice(0, 1).map((a) => <Marc key={a} tag="710" ind="2 " subs={[["a", a]]} />)}
      {f("container") && r.container && <Marc tag="773" ind="0 " subs={[["t", r.container.value]]} />}
    </div>
  );
}
