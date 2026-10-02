/**
 * The quiet brand line at the very end of the page, the way big brands close
 * their apps ("Made with love in Kolhapur"). Text is set in Admin → Homepage.
 */
export default function SignOff({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  const line = (title || "Made with love in Kolhapur.").trim();
  return (
    <section className="bg-cream pt-10 pb-4 md:pt-16 md:pb-6" data-testid="sign-off" aria-label="Jack & Jill">
      <div className="container">
        <p className="font-display font-bold text-[40px] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[88px] tracking-[-0.02em] text-navy/15 text-balance max-w-5xl">
          {line}
        </p>
        <p className="mt-4 text-sm md:text-[15px] font-semibold text-muted">{subtitle || "Jack & Jill · Shahupuri, Kolhapur · Since 2003"}</p>
      </div>
    </section>
  );
}
