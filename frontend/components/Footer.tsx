import Link from "next/link";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

export default function Footer({ contact, brand, logoSize = 44 }: { contact: any; brand: any; logoSize?: number }) {
  return (
    <footer className="bg-navy text-white/90 mt-24" data-testid="site-footer">
      <div className="container py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-2">
          {brand?.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={brand.logo_url}
              alt={brand?.name || "Jack & Jill"}
              style={{ height: logoSize }}
              className="w-auto object-contain bg-white rounded-md p-1 mb-3"
            />
          ) : (
            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-display text-3xl font-bold text-white">Jack</span>
              <span className="font-display text-3xl font-bold text-gold-light">&amp;</span>
              <span className="font-display text-3xl font-bold text-white">Jill</span>
            </div>
          )}
          <p className="text-sm opacity-70 mb-4 max-w-sm leading-relaxed">Kolhapur&apos;s trusted kids brand since 2003. Style, comfort and care for newborn to teens.</p>
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
          <h4 className="text-xs font-bold uppercase tracking-widest text-gold-light mb-4">Shop</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link href="/category/clothing" className="hover:text-gold-light transition-colors">Clothing</Link></li>
            <li><Link href="/category/footwear" className="hover:text-gold-light transition-colors">Footwear</Link></li>
            <li><Link href="/category/baby-essentials" className="hover:text-gold-light transition-colors">Baby Essentials</Link></li>
            <li><Link href="/category/toys" className="hover:text-gold-light transition-colors">Toys</Link></li>
            <li><Link href="/category/gift-hampers" className="hover:text-gold-light transition-colors">Gift Hampers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gold-light mb-4">Company</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link href="/about" className="hover:text-gold-light transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-gold-light transition-colors">Contact</Link></li>
            <li><Link href="/faq" className="hover:text-gold-light transition-colors">FAQ</Link></li>
            <li><Link href="/track" className="hover:text-gold-light transition-colors">Track Order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gold-light mb-4">Legal</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link href="/legal/shipping" className="hover:text-gold-light transition-colors">Shipping</Link></li>
            <li><Link href="/legal/returns" className="hover:text-gold-light transition-colors">Returns</Link></li>
            <li><Link href="/legal/refund" className="hover:text-gold-light transition-colors">Refund</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-gold-light transition-colors">Privacy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-gold-light transition-colors">Terms</Link></li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gold-light mb-4">Contact</h4>
          <ul className="space-y-3 text-sm opacity-80">
            {contact?.address && (
              <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gold-light" /><span className="leading-relaxed">{contact.address}</span></li>
            )}
            {contact?.phone && (
              <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 shrink-0 text-gold-light" /><a className="hover:text-gold-light transition-colors" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>
            )}
            {contact?.email && (
              <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 shrink-0 text-gold-light" /><a className="hover:text-gold-light transition-colors" href={`mailto:${contact.email}`}>{contact.email}</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs opacity-60">
          <p>© {new Date().getFullYear()} Jack & Jill. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-gold-light transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-gold-light transition-colors">Terms</Link>
            <Link href="/legal/cancellation" className="hover:text-gold-light transition-colors">Cancellation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
