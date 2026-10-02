import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { HomeSection, Media, type Tone } from "./Section";

type Contact = { address?: string; hours?: string; phone?: string };

export default function VisitStore({ title, subtitle, config, contact, tone }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string; image?: string }; contact: Contact; tone?: Tone }) {
  const digits = (contact.phone || "").replace(/\D/g, "");
  const wa = digits ? `https://wa.me/${digits.length === 10 ? "91" + digits : digits}` : null;
  const tel = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null;
  const maps = contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Jack & Jill ${contact.address}`)}` : null;

  return (
    <HomeSection tone={tone} testid="visit-store">
      <div className="grid overflow-hidden rounded-[28px] bg-navy lg:grid-cols-[1.2fr_1fr]">
        <Media src={config?.image} alt="Jack & Jill store in Shahupuri, Kolhapur" className="h-64 sm:h-80 lg:h-full w-full !bg-[#4A5A93]" sizes="(min-width:1024px) 55vw, 100vw" />
        <div className="p-7 md:p-12 grid content-center gap-5 text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-yellow">{config?.eyebrow || "Visit us"}</p>
          <h2 className="font-display text-[28px] md:text-4xl leading-[1.1] text-balance">{title || "Come try it on in Shahupuri"}</h2>
          {subtitle && <p className="text-white/80 leading-relaxed">{subtitle}</p>}
          <ul className="stagger grid gap-3 text-[15px] text-white/85">
            {contact.address && (
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 shrink-0 text-gold-light" aria-hidden="true" />
                {contact.address}
              </li>
            )}
            {contact.hours && (
              <li className="flex gap-3">
                <Clock className="w-5 h-5 shrink-0 text-gold-light" aria-hidden="true" />
                {contact.hours}
              </li>
            )}
            {contact.phone && tel && (
              <li className="flex gap-3">
                <Phone className="w-5 h-5 shrink-0 text-gold-light" aria-hidden="true" />
                <a href={tel} className="hover:underline">{contact.phone}</a>
              </li>
            )}
          </ul>
          <div className="flex flex-wrap gap-3 pt-1">
            {maps && (
              <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-navy px-6 py-3.5 text-[15px] font-bold hover:bg-cream">
                <Navigation className="w-4 h-4" aria-hidden="true" /> Get directions
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1F7A4A] hover:bg-[#186540] text-white px-6 py-3.5 text-[15px] font-bold">
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp us
              </a>
            )}
          </div>
        </div>
      </div>
    </HomeSection>
  );
}
