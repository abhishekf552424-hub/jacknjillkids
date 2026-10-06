import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Navigation, Instagram, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { optimised } from "@/lib/img";
import StoreMap from "@/components/home/StoreMap";
import OpenNow from "@/components/home/OpenNow";
import AgeIcon from "@/components/home/AgeIcons";

// Shown to visitors while Admin → Settings → Website status is "Coming soon".
// Middleware serves it at every shop address; it is never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jack & Jill Kolhapur — our new online store is coming soon",
  description: "Kolhapur's kids store since 2003 is opening its new online store soon. Visit us in Shahupuri or message us on WhatsApp.",
};

async function load() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("settings").select("key, value").in("key", ["contact_info", "social", "brand"]);
    const m = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? {}]));
    return { contact: (m.contact_info ?? {}) as { address?: string; phone?: string; hours?: string }, social: (m.social ?? {}) as { instagram?: string }, brand: (m.brand ?? {}) as { logo_url?: string; store_name?: string } };
  } catch {
    return { contact: {}, social: {}, brand: {} } as any;
  }
}

const FLOATERS = [
  { slug: "0-12m", accent: "#F6A49A", pos: "left-[4%] top-[14%]", delay: "0s" },
  { slug: "1-2y", accent: "#FCD325", pos: "right-[5%] top-[10%]", delay: "1.2s" },
  { slug: "2-4y", accent: "#A9C0EA", pos: "left-[7%] top-[46%]", delay: "2.1s" },
  { slug: "4-6y", accent: "#F6A49A", pos: "right-[7%] top-[40%]", delay: "0.6s" },
];

export default async function ComingSoon() {
  const { contact, social, brand } = await load();
  const digits = (contact.phone || "").replace(/\D/g, "");
  const wa = digits ? `https://wa.me/${digits.length === 10 ? "91" + digits : digits}?text=${encodeURIComponent("Hi Jack & Jill! I saw your new website.")}` : null;
  const tel = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address ? `Jack & Jill Kids Store, ${contact.address}` : "Jack & Jill Kids Store Shahupuri Kolhapur")}`;
  const name = brand.store_name || "Jack & Jill";

  return (
    <div className="jj-soon fixed inset-0 z-[200] overflow-y-auto bg-[#FFF8EC] [background-image:radial-gradient(rgba(53,66,117,.08)_1.3px,transparent_1.3px)] [background-size:22px_22px] text-ink" data-testid="coming-soon">
      {/* toran */}
      <svg aria-hidden="true" viewBox="0 0 1200 40" preserveAspectRatio="none" className="jj-bunting absolute inset-x-0 top-0 h-8 sm:h-10 w-full">
        <path d="M0 4 Q600 40 1200 4" fill="none" stroke="#B9923F" strokeOpacity=".6" strokeWidth="1.5" />
        {Array.from({ length: 25 }).map((_, i) => {
          const x = 24 + i * 47;
          const y = 4 + 18 * (1 - Math.pow((x - 600) / 600, 2));
          const c = ["#EA4137", "#FCD325", "#F38838", "#B9923F", "#3661A0"][i % 5];
          return <path key={i} d={`M${x - 12} ${y} L${x + 12} ${y} L${x} ${y + 18} Z`} fill={c} style={{ animationDelay: `${i * 35}ms` }} />;
        })}
      </svg>

      {/* floating line-art toys */}
      {FLOATERS.map((f) => (
        <span key={f.slug} aria-hidden="true" className={`jj-float pointer-events-none absolute hidden md:grid place-items-center w-24 h-24 rounded-full bg-white/70 text-navy shadow-soft ${f.pos}`} style={{ animationDelay: f.delay }}>
          <AgeIcon slug={f.slug} index={0} accent={f.accent} className="w-14 h-14" />
        </span>
      ))}

      <main className="relative mx-auto max-w-3xl px-5 pt-16 sm:pt-20 pb-10 text-center">
        {brand.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={optimised(brand.logo_url, 256)} alt={name} className="page-in mx-auto h-16 sm:h-20 w-auto object-contain" />
        ) : (
          <p className="font-display text-4xl text-navy">{name}</p>
        )}

        <p className="page-in mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-yellow" style={{ animationDelay: "80ms" }}>
          Since 2003 · Kolhapur
        </p>
        <p className="page-in mt-6 font-hand text-2xl sm:text-3xl text-action -rotate-1" style={{ animationDelay: "140ms" }}>
          Something tiny &amp; wonderful is on its way…
        </p>
        <h1 className="page-in mt-2 font-display text-[34px] sm:text-5xl leading-[1.08] text-navy text-balance" style={{ animationDelay: "200ms" }}>
          Our new online store opens <span className="jj-hl">very soon</span>
        </h1>
        <p className="page-in mx-auto mt-4 max-w-xl text-[15px] sm:text-base leading-relaxed text-muted" style={{ animationDelay: "260ms" }}>
          Kolhapur&apos;s favourite kids store is getting a brand-new home online: clothes, footwear, toys and baby essentials, delivered to your door.
          Till then, visit us in Shahupuri or say hello on WhatsApp.
        </p>

        <div className="page-in mt-7 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "320ms" }}>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1F7A4A] hover:bg-[#186540] text-white px-6 py-3.5 text-[15px] font-bold shadow-premium transition-colors">
              <WhatsAppIcon className="w-4 h-4" /> WhatsApp us
            </a>
          )}
          {tel && (
            <a href={tel} className="inline-flex items-center gap-2 rounded-full bg-navy hover:bg-ink text-white px-6 py-3.5 text-[15px] font-bold transition-colors">
              <Phone className="w-4 h-4" aria-hidden="true" /> Call the store
            </a>
          )}
          {social.instagram && (
            <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 bg-white px-5 py-3 text-[15px] font-bold text-navy hover:border-navy/40 transition-colors">
              <Instagram className="w-4 h-4" aria-hidden="true" /> Instagram
            </a>
          )}
        </div>
      </main>

      {/* the store, on the line-art map */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 pb-12" aria-label="Visit the store">
        <div className="overflow-hidden rounded-[28px] border border-line bg-[#FFF8EC] shadow-premium">
          <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Open the store in Google Maps" className="block">
            <StoreMap fit="slice" className="block sm:hidden w-full h-[300px]" />
            <StoreMap className="hidden sm:block w-full h-auto" />
          </a>
          <div className="grid gap-4 bg-navy p-6 sm:p-8 text-white sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-2.5 text-[15px] text-white/90">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-yellow">Visit the store</p>
                <OpenNow hours={contact.hours} />
              </div>
              {contact.address && (
                <p className="flex gap-3"><MapPin className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />{contact.address}</p>
              )}
              {contact.hours && (
                <p className="flex gap-3"><Clock className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />{contact.hours}</p>
              )}
            </div>
            <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-navy px-6 py-3.5 text-[15px] font-bold hover:bg-cream transition-colors">
              <Navigation className="w-4 h-4" aria-hidden="true" /> Get directions
            </a>
          </div>
        </div>
      </section>

      <footer className="relative pb-8 text-center text-xs text-muted">
        © {new Date().getFullYear()} {name}, Kolhapur ·{" "}
        <Link href="/admin/login" className="underline-offset-4 hover:underline">Store team</Link>
      </footer>
    </div>
  );
}
