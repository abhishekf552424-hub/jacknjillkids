import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Award, ShieldCheck, Heart, Sparkles, Package, ArrowRight } from "lucide-react";
import ParentsReviews from "@/components/ParentsReviews";

export const revalidate = 300;

export const metadata = {
  title: "About Jack & Jill — 22 Years of Kids Fashion in Kolhapur",
  description:
    "Founded in 2003 by Ajit Mehta, Jack & Jill is Kolhapur's trusted kids lifestyle brand — serving 10,000+ families across India.",
};

/**
 * Phase U — About Us full redesign.
 * Reuses the existing design system (Fredoka/Nunito, brand tokens, cards,
 * shadow-soft, brand-gradient) and the existing ParentsReviews carousel — no
 * new patterns invented, no text testimonials.
 */
export default async function AboutPage() {
  const supabase = await createClient();
  const [{ data: cms }, { data: reviewsSection }] = await Promise.all([
    supabase.from("cms_pages").select("*").eq("slug", "about").maybeSingle(),
    supabase.from("homepage_sections").select("*").eq("section_type", "parents_reviews").eq("is_active", true).maybeSingle(),
  ]);

  const stats = [
    { n: "22+", l: "Years of Trust" },
    { n: "10K+", l: "Happy Families" },
    { n: "500+", l: "Styles Available" },
    { n: "0", l: "Compromises" },
  ];

  const timeline = [
    { year: "2003", title: "Where it began", body: "Ajit Mehta opens the first Jack & Jill flagship store in Shahupuri, Kolhapur — a single shop, one big promise." },
    { year: "2008", title: "The family grows", body: "Footwear, school uniforms and accessories join the range." },
    { year: "2012", title: "A decade of smiles", body: "3,000+ families have dressed their children with us." },
    { year: "2018", title: "Store 2.0", body: "The Shahupuri flagship is redesigned — same warmth, brighter aisles." },
    { year: "2020", title: "Now online", body: "We take the brand online — same care, wider reach." },
    { year: "2025", title: "22 years young", body: "10,000+ families, 500+ styles, and counting." },
  ];

  const promises = [
    { icon: Award, title: "Expertise", body: "Two decades of specialising in kids-only fashion — we know what fits little bodies and busy days." },
    { icon: ShieldCheck, title: "Assurance", body: "Every fabric is skin-safe and lab-tested. If it wouldn't touch our own kids, it doesn't make the shelf." },
    { icon: Heart, title: "Care", body: "Personal help before and after every order — from size charts to hassle-free exchanges." },
    { icon: Sparkles, title: "Style", body: "Trend-forward, ceremony-ready, everyday-comfortable — curated so parents don't have to choose." },
    { icon: Package, title: "Quality", body: "Reinforced stitching, colour-fast dyes, and premium mills — clothes that live through play and last through siblings." },
  ];

  return (
    <>
      {/* Hero band */}
      <section className="bg-gradient-to-br from-cream to-white border-b border-navy/5">
        <div className="container py-16 md:py-24 text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Est. 17 August 2003 · Shahupuri, Kolhapur</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-navy tracking-tight leading-[1.05]">
            22 Years of Dressing<br />
            Kolhapur&apos;s Children <em className="not-italic text-gold">with Love</em>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-muted leading-relaxed">
            One trusted store, one clear promise — style that fits little bodies and lives that lasts through play, siblings and monsoons.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.l} className="bg-white rounded-lg p-5 md:p-6 text-center shadow-soft border border-navy/5">
                <p className="font-display text-3xl md:text-4xl text-navy">{s.n}</p>
                <p className="text-[10px] md:text-xs text-muted uppercase tracking-widest mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story — editorial layout with founder */}
      <section className="container py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr_1fr] gap-10 md:gap-16 items-center">
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-premium border-8 border-white">
            <Image
              src="/founder-ajit-mehta.jpg"
              alt="Ajit Mehta, Founder — Jack & Jill"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Our Story</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl text-navy tracking-tight leading-tight">
              It started with one question: <em className="not-italic text-gold">why is it so hard to dress a child well?</em>
            </h2>
            <p className="mt-5 text-muted leading-relaxed">
              {cms?.content?.split("\n").slice(0, 2).join(" ") ??
                "In 2003, Ajit Mehta opened the doors of the first Jack & Jill store in Shahupuri, Kolhapur — a small shop with a single, stubborn idea. Kids deserve clothes that feel as good as they look. Fabrics that don't itch. Stitches that survive play. Colours that don't fade in the second wash."}
            </p>
            <p className="mt-4 text-muted leading-relaxed">
              Twenty-two years later, that idea has dressed over ten thousand families across India — and it&apos;s still the only one that runs the store.
            </p>

            <div className="mt-6 rounded-xl bg-cream/60 border-l-4 border-gold p-5">
              <p className="font-display italic text-navy text-lg leading-snug">
                &ldquo;If a piece isn&apos;t good enough for my own daughter, it doesn&apos;t go on our shelf. That&apos;s the whole rulebook.&rdquo;
              </p>
              <p className="mt-3 text-xs uppercase tracking-widest text-gold font-bold">— Ajit Mehta, Founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white/60">
        <div className="container py-16 md:py-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Our Journey</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl text-navy tracking-tight">Milestones in trust</h2>
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gold/40" />
            <div className="space-y-10 md:space-y-14">
              {timeline.map((t, i) => (
                <div key={t.year} className={`relative pl-12 md:pl-0 md:grid md:grid-cols-2 md:gap-8 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <div className={`md:text-right ${i % 2 === 1 ? "md:text-left" : ""}`}>
                    <div className="absolute left-0 md:left-1/2 -md:translate-x-1/2 top-1 w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center text-[10px] font-bold shadow-soft md:-translate-x-1/2">
                      {t.year.slice(-2)}
                    </div>
                    <p className="text-sm text-gold font-bold">{t.year}</p>
                    <h3 className="font-display text-xl text-navy mt-1">{t.title}</h3>
                  </div>
                  <div>
                    <p className="text-muted leading-relaxed">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission + Vision */}
      <section className="container py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-5 md:gap-8">
          <div className="bg-white rounded-lg p-8 shadow-soft border-l-4 border-gold">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Mission</p>
            <h3 className="mt-2 font-display text-2xl md:text-3xl text-navy tracking-tight">Make dressing a child the easiest part of a parent&apos;s day.</h3>
            <p className="mt-4 text-muted leading-relaxed">By curating a single, trusted range — thoughtful sizing, safe fabrics, honest prices — so every parent can walk in and walk out sure they&apos;ve chosen well.</p>
          </div>
          <div className="bg-navy text-white rounded-lg p-8 shadow-premium">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Vision</p>
            <h3 className="mt-2 font-display text-2xl md:text-3xl tracking-tight">Be India&apos;s most-loved kids brand — one family at a time.</h3>
            <p className="mt-4 opacity-90 leading-relaxed">Not the biggest. The one families come back to when the second child arrives, and recommend to the third neighbour.</p>
          </div>
        </div>
      </section>

      {/* The Jack & Jill Promise */}
      <section className="bg-cream/40 border-y border-navy/5">
        <div className="container py-16 md:py-24">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">The Jack &amp; Jill Promise</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl text-navy tracking-tight">Five commitments, twenty-two years, zero shortcuts.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
            {promises.map((p) => (
              <div key={p.title} className="bg-white rounded-lg p-6 shadow-soft border border-navy/5 hover:shadow-premium transition-shadow">
                <div className="w-11 h-11 rounded-full bg-brand-gradient text-white flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg text-navy">{p.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Video Reviews — REUSED existing homepage carousel */}
      <ParentsReviews
        title={reviewsSection?.title || "Parents love us"}
        subtitle={reviewsSection?.subtitle || "22 years of smiles — hear it from the families"}
        videos={reviewsSection?.config?.videos || []}
      />

      {/* Shop Our Collection CTA */}
      <section className="bg-gradient-to-br from-navy to-navy/95 text-white">
        <div className="container py-16 md:py-20 text-center">
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Ready when you are</p>
          <h2 className="mt-2 font-display text-3xl md:text-5xl tracking-tight">Shop the collection that families come back for.</h2>
          <p className="mt-4 max-w-xl mx-auto opacity-90">Frocks, footwear, school essentials, gift hampers and toys — everything a growing family needs, in one trusted place.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/shop" className="inline-flex items-center gap-2 bg-brand-gradient text-white font-bold rounded-full px-8 py-4 shadow-premium hover:-translate-y-0.5 transition-transform">
              Shop all <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/shop?sort=newest" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold rounded-full px-8 py-4 hover:bg-white hover:text-navy transition-colors">
              New arrivals
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
