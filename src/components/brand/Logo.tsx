import { MONO_DOTS, MONO_GOLD } from "./monogram";

type Props = {
  className?: string;
  /** "gold" on dark backgrounds, "navy" on light ones, "mono" for single-colour use */
  tone?: "gold" | "navy" | "mono";
  /** show the INK2INSIGHT wordmark next to the monogram */
  wordmark?: boolean;
};

/**
 * i2i monogram: two lowercase serif i's with teal dots around a serif 2.
 * Geometry lives in ./monogram.ts.
 */
export default function Logo({ className = "", tone = "gold", wordmark = false }: Props) {
  const fill = tone === "gold" ? "url(#i2i-gold)" : tone === "navy" ? "#101B2D" : "currentColor";
  const dot = tone === "mono" ? "currentColor" : "#4C9DAB";
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-full w-auto" aria-hidden={wordmark} role="img" aria-label="Ink2Insight">
        <defs>
          <linearGradient id="i2i-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E3CFA6" />
            <stop offset="55%" stopColor="#CBAF7E" />
            <stop offset="100%" stopColor="#8C7650" />
          </linearGradient>
        </defs>
        <path d={MONO_GOLD} fill={fill} />
        {MONO_DOTS.map((d) => (
          <circle key={d.cx} cx={d.cx} cy={d.cy} r={d.r} fill={dot} />
        ))}
      </svg>
      {wordmark && (
        <span className="whitespace-nowrap font-sans text-[11px] font-medium uppercase tracking-brand">
          <span className="text-paper">Ink</span>
          <span className="text-gold-light">2</span>
          <span className="text-gold">Insight</span>
        </span>
      )}
    </span>
  );
}
