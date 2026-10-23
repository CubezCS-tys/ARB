"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { brand, divisions } from "@/content/site";
import GlyphField from "./GlyphField";

const TOPICS = [
  "Arabic documents",
  "OCR",
  "Metadata",
  "Parsing",
  "Deep research",
  "Citation index",
  "Strategy",
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Fields = { name: string; organisation: string; email: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please tell us your name.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "That email address doesn't look complete.";
  if (f.message.trim().length < 20)
    e.message = "A sentence or two about your project helps us reply properly (20+ characters).";
  if (f.organisation.length > 160) e.organisation = "Please shorten the organisation name.";
  return e;
}

function buildMailto(f: Fields, topics: string[]) {
  const subject = `Enquiry from ${f.name.trim()}${f.organisation.trim() ? ` (${f.organisation.trim()})` : ""}`;
  const body = [
    `Name: ${f.name.trim()}`,
    `Organisation: ${f.organisation.trim() || "-"}`,
    `Email: ${f.email.trim()}`,
    `Working with: ${topics.length ? topics.join(", ") : "-"}`,
    "",
    f.message.trim(),
  ].join("\r\n");
  return `mailto:${brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Contact() {
  const [fields, setFields] = useState<Fields>({ name: "", organisation: "", email: "", message: "" });
  const [topics, setTopics] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [sentHref, setSentHref] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...fields, [k]: e.target.value };
    setFields(next);
    if (touched) setErrors(validate(next));
  };

  const toggle = (t: string) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate(fields);
    setErrors(errs);
    const first = (Object.keys(errs) as (keyof Fields)[])[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const href = buildMailto(fields, topics);
    setSentHref(href);
    window.location.href = href;
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(brand.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked: the address is visible as text anyway */
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="contact"
        aria-labelledby="contact-title"
        className="relative isolate overflow-hidden border-t border-white/[0.05] bg-ink py-28 md:py-40"
      >
        {/* backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_80%,transparent)]"
        >
          <GlyphField className="opacity-70" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%]"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 50% 100%, rgba(203,175,126,0.10), transparent 70%), radial-gradient(ellipse 35% 40% at 85% 30%, rgba(76,157,171,0.06), transparent 70%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            Contact
          </motion.p>

          <h2
            id="contact-title"
            className="mt-8 max-w-6xl font-serif text-[clamp(2.75rem,8.5vw,8.25rem)] font-medium leading-[0.98] tracking-[-0.02em] text-paper"
          >
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.1, ease: EASE }}
            >
              Your archive has answers.
            </motion.span>
            <motion.span
              className="text-gold-gradient block pb-[0.08em] italic"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
            >
              Let&rsquo;s find them.
            </motion.span>
          </h2>

          <div className="mt-16 grid gap-14 md:mt-24 lg:grid-cols-12 lg:gap-16">
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <p className="max-w-md text-lg leading-relaxed text-mist">
                Tell us what you are working with: a manuscript collection, a journal backlist, a scanned archive, or a
                research question that won&rsquo;t sit still. We&rsquo;ll reply with a straight answer about what AI
                can, and can&rsquo;t, do for it.
              </p>

              <div className="mt-12">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-dim">Write to us directly</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <a
                    href={`mailto:${brand.email}`}
                    className="font-serif text-2xl text-paper underline decoration-gold/40 decoration-1 underline-offset-[6px] transition-colors hover:text-gold-light hover:decoration-gold md:text-3xl"
                  >
                    {brand.email}
                  </a>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-mist transition-colors hover:border-gold/50 hover:text-gold-light focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <ul className="mt-12 space-y-3 border-t border-white/[0.06] pt-8">
                {divisions.map((d) => (
                  <li key={d.id} className="flex items-baseline gap-4 text-sm">
                    <span className="w-28 shrink-0 text-paper">{d.name}</span>
                    <span className="text-mist">{d.line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1, ease: EASE, delay: 0.1 }}
            >
              <div className="glass relative overflow-hidden rounded-[28px] bg-midnight/40 p-6 sm:p-10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
                />
                <AnimatePresence mode="wait" initial={false}>
                  {sentHref ? (
                    <motion.div
                      key="sent"
                      role="status"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.6, ease: EASE }}
                      className="flex min-h-[420px] flex-col justify-center"
                    >
                      <svg viewBox="0 0 56 56" className="h-14 w-14" aria-hidden="true">
                        <motion.circle
                          cx="28"
                          cy="28"
                          r="26"
                          fill="none"
                          stroke="#CBAF7E"
                          strokeWidth="1"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, ease: EASE }}
                        />
                        <motion.path
                          d="M18 29 L25 36 L39 21"
                          fill="none"
                          stroke="#4C9DAB"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
                        />
                      </svg>
                      <h3 className="mt-8 font-serif text-3xl text-paper md:text-4xl">
                        Your message is <span className="text-gold-gradient italic">ready to send.</span>
                      </h3>
                      <p className="mt-4 max-w-md leading-relaxed text-mist">
                        We&rsquo;ve opened it in your email app, addressed to{" "}
                        <span className="text-paper">{brand.email}</span>. Press send there and it comes straight to us.
                        Nothing is stored on this site.
                      </p>
                      <div className="mt-10 flex flex-wrap gap-3">
                        <a
                          href={sentHref}
                          className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-light focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
                        >
                          Open email again
                        </a>
                        <button
                          type="button"
                          onClick={() => setSentHref(null)}
                          className="rounded-full border border-white/15 px-6 py-3 text-sm text-paper transition-colors hover:border-gold/60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
                        >
                          Edit message
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      ref={formRef}
                      noValidate
                      onSubmit={onSubmit}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      aria-label="Contact Soltani Intelligence"
                    >
                      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                        <Field
                          label="Name"
                          name="name"
                          autoComplete="name"
                          value={fields.name}
                          onChange={set("name")}
                          error={errors.name}
                          required
                        />
                        <Field
                          label="Organisation"
                          name="organisation"
                          autoComplete="organization"
                          value={fields.organisation}
                          onChange={set("organisation")}
                          error={errors.organisation}
                          optional
                        />
                        <Field
                          className="sm:col-span-2"
                          label="Email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          value={fields.email}
                          onChange={set("email")}
                          error={errors.email}
                          required
                        />
                      </div>

                      <fieldset className="mt-9">
                        <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
                          What are you working with?{" "}
                          <span className="normal-case tracking-normal text-mist/60">(choose any)</span>
                        </legend>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          {TOPICS.map((t) => {
                            const on = topics.includes(t);
                            return (
                              <button
                                key={t}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggle(t)}
                                className={`rounded-full border px-4 py-2 text-[13px] transition-all duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                                  on
                                    ? "border-gold bg-gold/15 text-gold-light shadow-[0_0_20px_-6px_rgba(203,175,126,0.6)]"
                                    : "border-white/10 text-mist hover:border-white/25 hover:text-paper"
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle transition-colors ${on ? "bg-teal" : "bg-white/20"}`}
                                />
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      <Field
                        className="mt-9"
                        label="Message"
                        name="message"
                        multiline
                        value={fields.message}
                        onChange={set("message")}
                        error={errors.message}
                        required
                        placeholder="The collection, the scale, the question you want answered…"
                      />

                      <div className="mt-10 flex flex-col-reverse items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-xs text-xs leading-relaxed text-mist/70">
                          Sending opens your own email app with this message filled in. No data is stored on this site.
                        </p>
                        <button
                          type="submit"
                          className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-[background-color,box-shadow] duration-300 hover:bg-gold-light hover:shadow-[0_0_36px_-8px_rgba(203,175,126,0.8)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
                        >
                          Start the conversation
                          <span
                            aria-hidden="true"
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          >
                            &rarr;
                          </span>
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

type FieldProps = {
  label: string;
  name: keyof Fields;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  optional?: boolean;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  className?: string;
};

function Field({
  label,
  name,
  value,
  onChange,
  error,
  required,
  optional,
  multiline,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  className = "",
}: FieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  const base =
    "peer mt-2 block w-full border-0 border-b bg-transparent px-0 pb-3 pt-1 text-base text-paper placeholder:text-mist/40 transition-colors duration-300 focus:outline-none focus:ring-0";
  const tone = error ? "border-gold-light" : "border-white/15 hover:border-white/30 focus:border-gold";
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal text-mist/60">(optional)</span>}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            id={id}
            name={name}
            rows={4}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errId : undefined}
            className={`${base} ${tone} resize-none`}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            autoComplete={autoComplete}
            inputMode={inputMode}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errId : undefined}
            className={`${base} ${tone}`}
          />
        )}
        {/* focus underline that draws from the left */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] peer-focus:scale-x-100"
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={errId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-2 text-[12px] text-gold-light"
          >
            <span aria-hidden="true" className="mr-1.5 text-gold">
              &#9670;
            </span>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
