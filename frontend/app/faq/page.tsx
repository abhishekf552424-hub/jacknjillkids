import { createClient } from "@/lib/supabase/server";
import type { Faq } from "@/lib/types";

export const metadata = {
  title: "FAQ — Jack & Jill",
  description: "Frequently asked questions about shipping, returns, sizing and more at Jack & Jill.",
};

export const revalidate = 300;

export default async function FaqPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("faqs").select("*").eq("is_active", true).order("sort_order");
  const faqs = (data ?? []) as Faq[];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="container py-12 md:py-20 max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">FAQ</p>
      <h1 className="font-display text-4xl md:text-5xl text-navy tracking-tight mb-8">Questions, answered</h1>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.id} className="bg-white rounded-lg p-5 shadow-soft group open:shadow-premium transition-shadow">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
              <h2 className="font-medium text-navy leading-snug text-base">{f.question}</h2>
              <span className="text-gold text-xl leading-none shrink-0 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-muted leading-relaxed">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
