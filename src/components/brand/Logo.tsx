type Props = {
  className?: string;
  /** "gold" on dark backgrounds, "navy" on light ones, "mono" for single-colour use */
  tone?: "gold" | "navy" | "mono";
  /** show the SOLTANI INTELLIGENCE wordmark next to the monogram */
  wordmark?: boolean;
};

/**
 * SI monogram: a serif S, a dotless i stem, and the teal triangle "dot"
 * from the brand board. Typographic exploration, not a final logo.
 */
export default function Logo({ className = "", tone = "gold", wordmark = false }: Props) {
  const fill = tone === "gold" ? "url(#si-gold)" : tone === "navy" ? "#101B2D" : "currentColor";
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-full w-auto" aria-hidden={wordmark} role="img" aria-label="Soltani Intelligence">
        <defs>
          <linearGradient id="si-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E3CFA6" />
            <stop offset="55%" stopColor="#CBAF7E" />
            <stop offset="100%" stopColor="#8C7650" />
          </linearGradient>
        </defs>
        <text
          x="4"
          y="54"
          fontFamily="var(--font-playfair), Georgia, serif"
          fontSize="60"
          fontWeight="600"
          fill={fill}
        >
          S
        </text>
        <rect x="45" y="24" width="7.5" height="30" fill={fill} />
        <path d="M44 20 L58 6 L56 20 Z" fill={tone === "mono" ? "currentColor" : "#4C9DAB"} />
      </svg>
      {wordmark && (
        <span className="whitespace-nowrap font-sans text-[11px] font-medium uppercase tracking-brand">
          <span className="text-paper">Soltani</span> <span className="text-gold">Intelligence</span>
        </span>
      )}
    </span>
  );
}
