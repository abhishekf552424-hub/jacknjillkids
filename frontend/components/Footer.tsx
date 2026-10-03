import { optimised } from "@/lib/img";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, ChevronDown, Navigation, Truck, RotateCcw, ShieldCheck, Store } from "lucide-react";
import type { Category } from "@/lib/types";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { GoogleRating, SocialIcons } from "./SocialLinks";
import type { Social } from "@/lib/social";

type Contact = { phone?: string; email?: string; address?: string; hours?: string };

function waLink(phone?: string) {
  const d = (phone || "").replace(/\D/g, "");
  return d ? `https://wa.me/${d.length === 10 ? "91" + d : d}` : null;
}

const HELP = [
  { href: "/contact", label: "Contact us" },
  { href: "/track", label: "Track your order" },
  { href: "/faq", label: "FAQs" },
  { href: "/legal/shipping", label: "Shipping" },
  { href: "/legal/returns", label: "Returns & exchange" },
];
const COMPANY = [
  { href: "/about", label: "Our story" },
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/terms", label: "Terms of use" },
  { href: "/legal/refund", label: "Refund policy" },
  { href: "/legal/cancellation", label: "Cancellation" },
];

/** A link column: always open on desktop, a tap-to-open list on phones. */
function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  const list = (
    <ul className="space-y-2.5 text-[15px] text-white/75">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="hover:text-white transition-colors">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div>
      <details className="group md:hidden border-b border-white/10">
        <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-sm font-bold uppercase tracking-wider text-gold-light [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="pb-5">{list}</div>
      </details>
      <div className="hidden md:block">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gold-light mb-4">{title}</h3>
        {list}
      </div>
    </div>
  );
}

export default function Footer({
  contact,
  brand,
  logoSize = 44,
  categories = [],
  freeShippingAbove = 999,
  exchangeDays = 7,
  social = {},
}: {
  social?: Social;
  contact: Contact;
  brand: any;
  logoSize?: number;
  categories?: Category[];
  freeShippingAbove?: number;
  exchangeDays?: number;
}) {
  const tel = contact?.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null;
  const wa = waLink(contact?.phone);
  const maps = contact?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Jack & Jill ${contact.address}`)}` : null;
  const shop = (categories.length
    ? categories.slice(0, 7).map((c) => ({ href: `/category/${c.slug}`, label: c.name }))
    : [
        { href: "/category/clothing", label: "Clothing" },
        { href: "/category/footwear", label: "Footwear" },
        { href: "/category/baby-essentials", label: "Baby Essentials" },
        { href: "/category/toys", label: "Toys" },
      ]
  ).concat([{ href: "/shop?sort=newest", label: "New arrivals" }]);


  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 md:mt-24 bg-navy text-white" data-testid="site-footer">
      {/* Promise strip */}
      <div className="border-b border-white/10">
        <ul className="container grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5 py-6 md:py-7 text-sm">
          {[
            { icon: Truck, t: "Free delivery", s: `On orders above ₹${freeShippingAbove.toLocaleString("en-IN")}` },
            { icon: RotateCcw, t: `${exchangeDays}-day exchange`, s: "Size not right? Swap it" },
            { icon: ShieldCheck, t: "Secure payment", s: "UPI, cards & Cash on Delivery" },
            { icon: Store, t: "Since 2003", s: "Shahupuri, Kolhapur" },
          ].map((p) => (
            <li key={p.t} className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                <p.icon className="w-[18px] h-[18px] text-gold-light" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-white">{p.t}</span>
                <span className="block text-white/65 text-[13px] leading-snug">{p.s}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="container pt-10 md:pt-14 pb-6 md:pb-12 grid gap-8 md:gap-10 md:grid-cols-12">
        {/* Brand + store */}
        <div className="md:col-span-5 lg:col-span-4">
          {brand?.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={optimised(brand.logo_url, 384)} loading="lazy" decoding="async" alt={brand?.store_name || "Jack & Jill"} style={{ height: logoSize }} className="w-auto object-contain bg-white rounded-xl px-3 py-2" />
          ) : (
            <p className="font-display text-3xl font-bold">
              Jack <span className="text-gold-light">&amp;</span> Jill
            </p>
          )}
          <p className="mt-4 text-[15px] text-white/75 leading-relaxed max-w-sm">
            Kolhapur&apos;s trusted kids store since 2003. Clothes, footwear, toys and baby essentials for newborns to teens.
          </p>

          <ul className="mt-6 space-y-3 text-[15px] text-white/80">
            {contact?.address && (
              <li className="flex gap-3">
                <MapPin className="w-[18px] h-[18px] mt-0.5 shrink-0 text-gold-light" aria-hidden="true" />
                <span className="leading-relaxed">{contact.address}</span>
              </li>
            )}
            {contact?.hours && (
              <li className="flex gap-3">
                <Clock className="w-[18px] h-[18px] mt-0.5 shrink-0 text-gold-light" aria-hidden="true" />
                <span>{contact.hours}</span>
              </li>
            )}
            {contact?.phone && tel && (
              <li className="flex gap-3">
                <Phone className="w-[18px] h-[18px] mt-0.5 shrink-0 text-gold-light" aria-hidden="true" />
                <a href={tel} className="hover:text-white">{contact.phone}</a>
              </li>
            )}
            {contact?.email && (
              <li className="flex gap-3">
                <Mail className="w-[18px] h-[18px] mt-0.5 shrink-0 text-gold-light" aria-hidden="true" />
                <a href={`mailto:${contact.email}`} className="hover:text-white break-all">{contact.email}</a>
              </li>
            )}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            {maps && (
              <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-navy px-4 py-2.5 text-sm font-semibold hover:bg-cream">
                <Navigation className="w-4 h-4" aria-hidden="true" /> Get directions
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
                <WhatsAppIcon className="w-4 h-4" /> Chat on WhatsApp
              </a>
            )}
          </div>

          {/* Follow us + Google rating */}
          <div className="mt-6 grid gap-3">
            <SocialIcons social={social} tone="light" hideGoogle={Boolean(social.google_rating)} />
            <GoogleRating social={social} tone="light" />
          </div>
        </div>

        {/* Link columns */}
        <div className="md:col-span-7 lg:col-span-8 grid md:grid-cols-3 gap-0 md:gap-8 border-t border-white/10 md:border-0">
          <Column title="Shop" links={shop} />
          <Column title="Help" links={HELP} />
          <Column title="Company" links={COMPANY} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-5 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-[13px] text-white/60">
          <p className="text-center md:text-left">
            © {year} Jack &amp; Jill, Kolhapur. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">We accept</span>
            {["UPI", "Visa", "Mastercard", "RuPay", "COD"].map((m) => (
              <span key={m} className="rounded-md border border-white/20 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
