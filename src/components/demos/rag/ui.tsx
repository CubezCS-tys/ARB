"use client";

/** Small pieces shared by the RAG and OCR demos. */

export function SimBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gold/30 bg-gold/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-light/90 ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold/80" />
      Simulated demo · illustrative data
    </span>
  );
}

/** Two-option segmented control built from real buttons. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          title={o.title}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold ${
            value === o.id ? "bg-gold/15 text-gold-light" : "text-mist hover:text-paper"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
