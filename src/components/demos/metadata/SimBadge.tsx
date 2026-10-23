/** Small honesty label shared by the Metadata and Citation demos. */
export default function SimBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-ink/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-light backdrop-blur ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden />
      Simulated demo · illustrative data
    </span>
  );
}
