import Image from "next/image";
import { MapPin, Clock } from "lucide-react";

type Contact = { address?: string; phone?: string; hours?: string };

/** Store card: address, hours, directions and WhatsApp. Data from Admin › Settings › Contact. */
export default function VisitStore({
  title,
  subtitle,
  image,
  contact,
  whatsapp,
}: {
  title?: string | null;
  subtitle?: string | null;
  image?: string;
  contact: Contact;
  whatsapp?: string;
}) {
  const address = contact.address || "Opp. Shahaji Law College, E Ward, Shahupuri, Kolhapur 416001";
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Jack & Jill kids store, ${address}`)}`;
  const wa = (whatsapp || contact.phone || "").replace(/\D/g, "");
  const waNumber = wa.length === 10 ? `91${wa}` : wa;
  return (
    <section className="container py-8 md:py-12" data-testid="visit-store">
      <div className="bg-white rounded-2xl shadow-soft p-4 md:p-6 grid md:grid-cols-2 gap-4 md:gap-8 items-center">
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-sky">
          {image && <Image src={image} alt="Jack & Jill store front in Shahupuri, Kolhapur" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" />}
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-xl leading-7 md:text-3xl md:leading-tight text-navy">{title || "Visit our Shahupuri store"}</h2>
          {subtitle && <p className="text-muted">{subtitle}</p>}
          <p className="flex gap-2 text-[15px] leading-[22px] text-ink">
            <MapPin className="w-5 h-5 mt-0.5 text-doodle shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{address}</span>
          </p>
          {contact.hours && (
            <p className="flex gap-2 text-[15px] leading-[22px] text-ink">
              <Clock className="w-5 h-5 mt-0.5 text-doodle shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{contact.hours}</span>
            </p>
          )}
          <div className="mt-1 flex gap-3">
            <a href={directions} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center h-12 rounded-full border-2 border-navy text-navy font-extrabold text-[15px] hover:bg-navy hover:text-white transition-colors">
              Get directions
            </a>
            {waNumber && (
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center h-12 rounded-full bg-navy text-white font-extrabold text-[15px] hover:bg-ink transition-colors">
                WhatsApp us
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
