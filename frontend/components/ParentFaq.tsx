import { Plus } from "lucide-react";

type Faq = { id: string; question: string; answer: string };

/**
 * "Parents ask us" — short, direct answers (what Google and AI assistants quote),
 * with FAQPage structured data. Questions come from Admin › CMS › FAQs.
 */
export default function ParentFaq({ faqs, title, subtitle }: { faqs: Faq[]; title?: string | null; subtitle?: string | null }) {
  if (!faqs.length) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <section className="container py-8 md:py-12" data-testid="parent-faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h2 className="font-display text-2xl leading-8 md:text-4xl md:leading-tight text-navy">{title || "Parents ask us"}</h2>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      <div className="mt-4 flex flex-col gap-2 max-w-3xl">
        {faqs.map((f) => (
          <details key={f.id} className="group bg-white border border-line rounded-xl">
            <summary className="list-none cursor-pointer min-h-[56px] px-4 py-3 flex items-center justify-between gap-3 text-[15px] leading-[22px] font-bold text-ink [&::-webkit-details-marker]:hidden">
              {f.question}
              <Plus className="w-5 h-5 text-doodle shrink-0 transition-transform group-open:rotate-45" strokeWidth={1.75} aria-hidden="true" />
            </summary>
            <p className="px-4 pb-4 -mt-1 text-[15px] leading-6 text-ink/90 whitespace-pre-line">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
