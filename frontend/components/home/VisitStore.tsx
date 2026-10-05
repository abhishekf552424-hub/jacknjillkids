import { MapPin, Clock, Phone, Navigation, ExternalLink } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { HomeSection, Media, type Tone } from "./Section";
import { GoogleRating } from "@/components/SocialLinks";
import type { Social } from "@/lib/social";
import OpenNow from "./OpenNow";

type Contact = { address?: string; hours?: string; phone?: string };

/**
 * "Visit us" block. Left: the store photo from admin, or — until one is
 * uploaded — a live map of the shop (never an empty box). Right: address,
 * hours with a live "open now" pill, phone, Google rating and two actions.
 */
export default function VisitStore({ title, subtitle, config, contact, tone, social }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string; image?: string }; contact: Contact; tone?: Tone; social?: Social }) {
  const digits = (contact.phone || "").replace(/\D/g, "");
  const wa = digits ? `https://wa.me/${digits.length === 10 ? "91" + digits : digits}` : null;
  const tel = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null;
  const query = contact.address ? `Jack & Jill Kids Store, ${contact.address}` : "";
  const maps = query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
  const embed = contact.address ? `https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}&z=16&output=embed` : null;
  const area = (contact.address || "").match(/Shahupuri|Rajarampuri|Tarabai Park|Kolhapur/i)?.[0] || "Kolhapur";

  return (
    <HomeSection tone={tone} testid="visit-store">
      <div className="grid overflow-hidden rounded-[28px] bg-navy shadow-premium lg:grid-cols-[1.15fr_1fr]">
        {/* Picture or map */}
        <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[460px] bg-[#EFE6D3]">
          {config?.image ? (
            <Media src={config.image} alt={`Jack & Jill store in ${area}`} className="absolute inset-0 h-full w-full" sizes="(min-width:1024px) 55vw, 100vw" />
          ) : embed ? (
            <>
              <iframe
                title={`Map: Jack & Jill, ${area}`}
                src={embed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0 pointer-events-none [filter:saturate(0.85)_contrast(1.02)]"
                tabIndex={-1}
                aria-hidden="true"
              />
              {/* The map isn't scrollable (no trapped scrolling on phones); a tap opens Google Maps. */}
              {maps && <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Open the store in Google Maps" className="absolute inset-0 z-10" />}
            </>
          ) : null}

          {/* Little store tag, like a shop sign */}
          <div className="pointer-events-none absolute left-4 bottom-4 sm:left-6 sm:bottom-6 z-20 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-premium">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-action text-white shrink-0">
              <MapPin className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] text-navy">Jack &amp; Jill, {area}</span>
              <span className="block text-xs text-muted">Kolhapur&apos;s kids store since 2003</span>
            </span>
          </div>
          {maps && (
            <a href={maps} target="_blank" rel="noopener noreferrer" className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 inline-flex items-center gap-1.5 rounded-full bg-navy/90 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy">
              Open in Maps <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* Details */}
        <div className="relative p-6 sm:p-9 lg:p-12 grid content-center gap-5 text-white">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-yellow">{config?.eyebrow || "Visit us"}</p>
            <OpenNow hours={contact.hours} />
          </div>
          <h2 className="font-display text-[28px] md:text-4xl leading-[1.1] text-balance">{title || `Come try it on in ${area}`}</h2>
          <p className="text-white/75 leading-relaxed -mt-1">{subtitle || "Bring the little one along: try sizes, feel the fabrics and pick gifts with our team's help."}</p>

          <ul className="grid gap-2.5 text-[15px] text-white/90">
            {contact.address && (
              <li className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
                <MapPin className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
            )}
            {(contact.hours || (contact.phone && tel)) && (
              <li className="grid gap-2.5 sm:grid-cols-2">
                {contact.hours && (
                  <span className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
                    <Clock className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />
                    {contact.hours}
                  </span>
                )}
                {contact.phone && tel && (
                  <a href={tel} className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 hover:bg-white/[0.12] transition-colors">
                    <Phone className="w-5 h-5 shrink-0 text-gold-light mt-0.5" aria-hidden="true" />
                    {contact.phone}
                  </a>
                )}
              </li>
            )}
          </ul>

          {social?.google_rating && social.google_reviews_url && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <GoogleRating social={social} tone="light" />
              {social.google_write_url && (
                <a href={social.google_write_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-yellow underline-offset-4 hover:underline">
                  Write a review
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 pt-1">
            {maps && (
              <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-navy px-6 py-3.5 text-[15px] font-bold hover:bg-cream transition-colors">
                <Navigation className="w-4 h-4" aria-hidden="true" /> Get directions
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1F7A4A] hover:bg-[#186540] text-white px-6 py-3.5 text-[15px] font-bold transition-colors">
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp us
              </a>
            )}
          </div>
        </div>
      </div>
    </HomeSection>
  );
}
