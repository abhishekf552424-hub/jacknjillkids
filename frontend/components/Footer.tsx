import Link from "next/link";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

export default function Footer({ contact, brand }: { contact: any; brand: any }) {
  return (
    <footer className="bg-navy text-white/90 mt-24">
      <div className="container py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-baseline gap-1 mb-3">
            <span className="font-display text-3xl font-bold text-white">Jack</span>
            <span className="font-display text-3xl font-bold text-gold">&amp;</span>
            <span className="font-display text-3xl font-bold text-white">Jill</span>
          </div>
          <p className="text-sm opacity-70 mb-4">Kolhapur's trusted kids brand since 2003. Style, comfort and care for newborn to teens.</p>
          <div className="flex gap-3">
            {brand?.instagram && (
              <a href={brand.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="p-2 rounded-full bg-white/5 hover:bg-gold hover:text-navy transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {brand?.facebook && (
              <a href={brand.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="p-2 rounded-full bg-white/5 hover:bg-gold hover:text-navy transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-gold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link href="/shop?category=clothing">Clothing</Link></li>
            <li><Link href="/shop?category=footwear">Footwear</Link></li>
            <li><Link href="/shop?category=baby-essentials">Baby Essentials</Link></li>
            <li><Link href="/shop?category=toys">Toys</Link></li>
            <li><Link href="/shop?category=gift-hampers">Gift Hampers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-gold mb-4">Help</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link href="/track">Track Order</Link></li>
            <li><Link href="/legal/shipping">Shipping Policy</Link></li>
            <li><Link href="/legal/returns">Return Policy</Link></li>
            <li><Link href="/legal/refund">Refund Policy</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-gold mb-4">Visit Us</h4>
          <ul className="space-y-3 text-sm opacity-80">
            {contact?.address && (
              <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gold" /><span>{contact.address}</span></li>
            )}
            {contact?.phone && (
              <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 shrink-0 text-gold" /><a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>
            )}
            {contact?.email && (
              <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 shrink-0 text-gold" /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs opacity-60">
          <p>© {new Date().getFullYear()} Jack & Jill. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/cancellation">Cancellation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
