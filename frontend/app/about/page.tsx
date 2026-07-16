import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export const metadata = {
  title: "About Jack & Jill — 22 Years of Kids Fashion in Kolhapur",
  description: "Founded in 2003 by Ajit Mehta, Jack & Jill is Kolhapur's trusted kids lifestyle brand — serving 10,000+ families across India.",
};

export default async function AboutPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("cms_pages").select("*").eq("slug", "about").maybeSingle();

  const timeline = [
    { year: "2003", title: "Where it began", body: "Ajit Mehta opens the first Jack & Jill flagship store in Shahupuri, Kolhapur." },
    { year: "2008", title: "Growing the range", body: "Accessories, footwear and school uniforms join the family." },
    { year: "2012", title: "A decade strong", body: "10 years of trust — over 3,000 families dressed by Jack & Jill." },
    { year: "2020", title: "Digital expansion", body: "We take the brand online — same care, same quality, wider reach." },
    { year: "2025", title: "22 years young", body: "Celebrating 10,000+ families, 500+ styles, and counting." },
  ];

  return (
    <div className="container py-12 md:py-20 max-w-4xl">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Our Story</p>
      <h1 className="font-display text-4xl md:text-6xl text-navy tracking-tight leading-none">
        Making parenting <em className="text-gold not-italic">simpler</em>, one little smile at a time.
      </h1>
      <p className="mt-6 text-lg text-muted leading-relaxed">
        {data?.content ?? "Founded in 2003 by Ajit Mehta in Kolhapur, Maharashtra, Jack & Jill has grown from a single flagship store into a beloved premium kids lifestyle brand serving over 10,000 families across India."}
      </p>

      <div className="mt-16">
        <h2 className="font-display text-3xl text-navy mb-8">A journey of trust</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gold/40" />
          <div className="space-y-10">
            {timeline.map((t) => (
              <div key={t.year} className="relative pl-12">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center text-[10px] font-bold shadow-soft">
                  {t.year.slice(-2)}
                </div>
                <p className="text-sm text-gold font-bold">{t.year}</p>
                <h3 className="font-display text-xl text-navy mt-1">{t.title}</h3>
                <p className="text-muted mt-1">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-20 grid md:grid-cols-4 gap-4">
        {[
          { n: "22", l: "Years of Trust" },
          { n: "10K+", l: "Happy Families" },
          { n: "500+", l: "Styles Curated" },
          { n: "5★", l: "Skin-Safe Quality" },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-lg p-6 text-center shadow-soft">
            <p className="font-display text-4xl text-navy">{s.n}</p>
            <p className="text-xs text-muted uppercase tracking-widest mt-2">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
