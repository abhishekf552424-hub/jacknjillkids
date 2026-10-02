import { Plus } from "lucide-react";
import { HomeSection, SectionHeader, type Tone } from "./Section";

type Faq = { id: string; question: string; answer: string };

/** Questions from Admin → Pages & FAQs. Also tells Google (FAQPage) for rich results and AI answers. */
export default function HomeFaq({ title, subtitle, config, faqs, tone }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string }; faqs: Faq[]; tone?: Tone }) {
  if (!faqs.length) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <HomeSection tone={tone} testid="home-faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="max-w-3xl mx-auto">
        <SectionHeader eyebrow={config?.eyebrow || "Parents ask"} title={title || "Questions, answered"} subtitle={subtitle} center />
        <div className="stagger grid gap-3">
          {faqs.map((f) => (
            <details key={f.id} className="group rounded-[18px] bg-white border border-line px-5 md:px-6 py-4 md:py-5 transition-shadow duration-300 hover:shadow-soft open:shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[17px] md:text-lg text-navy [&::-webkit-details-marker]:hidden">
                {f.question}
                <Plus className="w-5 h-5 shrink-0 text-action transition-transform duration-300 ease-premium group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="faq-body mt-3 text-[15px] leading-relaxed text-muted whitespace-pre-line">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </HomeSection>
  );
}
