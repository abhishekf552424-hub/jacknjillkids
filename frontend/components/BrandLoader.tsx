/**
 * Site-wide loader: three bouncing dots in the brand's red, orange and yellow.
 * Light (pure CSS, no image), friendly for a kids' store, and the same
 * everywhere it appears.
 *
 * Sizes:
 *  - "sm" → inside buttons; dots take the button's text colour
 *  - "md" → inside cards and sections
 *  - "lg" → full-page waits, with an optional label
 */
export default function BrandLoader({
  size = "lg",
  label,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const dot = size === "sm" ? 6 : size === "md" ? 10 : 14;
  const mono = size === "sm";
  return (
    <span className={`inline-flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <span className="jj-dots" style={{ ["--d" as string]: `${dot}px` }} aria-hidden="true">
        <span style={mono ? undefined : { background: "#EA4137" }} />
        <span style={mono ? undefined : { background: "#F38838" }} />
        <span style={mono ? undefined : { background: "#FCD325" }} />
      </span>
      {label ? <span className="text-xs uppercase tracking-widest text-muted font-bold">{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}
