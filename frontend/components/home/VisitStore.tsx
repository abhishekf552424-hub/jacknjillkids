import { MapPin, Clock, Phone, Navigation, ExternalLink } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { HomeSection, Media, type Tone } from "./Section";
import { GoogleRating } from "@/components/SocialLinks";
import type { Social } from "@/lib/social";
import OpenNow from "./OpenNow";
import StoreMap from "./StoreMap";

type Contact = { address?: string; hours?: string; phone?: string };

/**
 * "Visit us": a hand-drawn line-art map of the shop fills the card; the
 * details sit on a navy card that floats over the map on big screens and
 * tucks under it on phones. An uploaded store photo appears as a pinned
 * polaroid next to the shop on the map.
 */
export default function VisitStore({ title, subtitle, config, contact, tone, social }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string; image?: string }; contact: Contact; tone?: Tone; social?: Social }) {
  const digits = (contact.phone || "").replace(/\D/g, "");
  const wa = digits ? `https://wa.me/${digits.length === 10 ? "91" + digits : digits}` : null;
  const tel = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null;
  const query = contact.address ? `Jack & Jill Kids Store, ${contact.address}` : "Jack & Jill Kids Store Shahupuri Kolhapur";
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const area = (contact.address || "").match(/Shahupuri|Rajarampuri|Tarabai Park/i)?.[0] || "Kolhapur";

  return (
    <HomeSection tone={tone} testid="visit-store">
      <div className="relative">
        {/* The map */}
        <div className="relative overflow-hidden rounded-[28px] lg:rounded-[36px] border border-line bg-[#FFF8EC] [background-image:radial-gradient(rgba(53,66,117,.09)_1.3px,transparent_1.3px)] [background-size:22px_22px] shadow-premium">
          <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Open the Jack & Jill store in Google Maps" className="block">
            {/* phones: a taller crop around the shop; bigger screens: the whole map */}
            <StoreMap fit="slice" className="block sm:hidden w-full h-[340px]" />
            <StoreMap className="hidden sm:block w-full h-auto xl:h-[640px]" />
          </a>
          <a href={maps} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-3 sm:right-5 sm:top-5 xl:right-auto xl:top-auto xl:left-6 xl:bottom-6 inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-line px-3.5 py-2 text-xs font-bold text-navy shadow-soft hover:bg-white">
            <MapPin className="w-3.5 h-3.5 text-action" aria-hidden="true" /> Open in Google Maps <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
          </a>
          {config?.image && (
            <div className="pointer-events-none absolute hidden sm:block left-[56%] top-[8%] w-[17%] min-w-[120px] rotate-[5deg] rounded-md bg-white p-2 pb-6 shadow-premium">
              <span aria-hidden="true" className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-5 rotate-[-4deg] bg-brand-yellow/70" />
              <Media src={config.image} alt={`Jack & Jill store in ${area}`} className="aspect-[4/3] w-full rounded-sm" sizes="240px" />
              <span className="absolute bottom-1 inset-x-0 text-center font-hand text-sm text-navy">our store</span>
            </div>
          )}
        </div>

        {/* The details */}
        <div className="relative z-10 -mt-10 mx-3 sm:mx-6 lg:mx-10 xl:mx-0 xl:mt-0 xl:absolute xl:right-10 xl:top-1/2 xl:-translate-y-1/2 xl:w-[460px] rounded-[26px] bg-navy text-white p-6 sm:p-8 shadow-premium ring-1 ring-white/10">
          <span aria-hidden="true" className="absolute -top-3 right-8 rotate-6 rounded-full bg-brand-yellow px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-navy shadow-soft">Since 2003</span>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-yellow">{config?.eyebrow || "Visit us"}</p>
            <OpenNow hours={contact.hours} />
          </div>
          <h2 className="mt-3 font-display text-[28px] md:text-[34px] leading-[1.1] text-balance">{title || `Come try it on in ${area}`}</h2>
          <p className="mt-2 text-white/75 leading-relaxed">{subtitle || "Bring the little one along: try sizes, feel the fabrics and pick gifts with our team's help."}</p>

          <ul className="mt-5 grid gap-3 text-[15px] text-white/90">
            {contact.address && (
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
            )}
            {contact.hours && (
              <li className="flex gap-3">
                <Clock className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />
                {contact.hours}
              </li>
            )}
            {contact.phone && tel && (
              <li className="flex gap-3">
                <Phone className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />
                <a href={tel} className="hover:underline underline-offset-4">{contact.phone}</a>
              </li>
            )}
          </ul>

          {social?.google_rating && social.google_reviews_url && (
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4">
              <GoogleRating social={social} tone="light" />
              {social.google_write_url && (
                <a href={social.google_write_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-yellow underline-offset-4 hover:underline">
                  Write a review
                </a>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-navy px-5 py-3.5 text-[15px] font-bold hover:bg-cream transition-colors">
              <Navigation className="w-4 h-4" aria-hidden="true" /> Get directions
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1F7A4A] hover:bg-[#186540] text-white px-5 py-3.5 text-[15px] font-bold transition-colors">
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp us
              </a>
            )}
          </div>
        </div>
      </div>
    </HomeSection>
  );
}
