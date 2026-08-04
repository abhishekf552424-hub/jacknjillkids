import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";
import PromoPopup from "@/components/PromoPopup";
import AnalyticsPixels from "@/components/AnalyticsPixels";
import InitialSiteLoader from "@/components/InitialSiteLoader";
import { createClient } from "@/lib/supabase/server";
import { getTrackingSettings, getPromoPopup, getBrandSettings } from "@/lib/settings";
import type { Category, AgeGroup, TrustBadge } from "@/lib/types";

const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alankarfashions.com";

export const revalidate = 60;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jack & Jill — Premium Kids Fashion & Baby Essentials | Kolhapur",
    template: "%s | Jack & Jill",
  },
  description:
    "Shop premium kids fashion, baby essentials, footwear, toys and gift hampers at Jack & Jill — Kolhapur's trusted kids brand since 2003. Free shipping above ₹999.",
  applicationName: "Jack & Jill",
  keywords: [
    "kids fashion",
    "baby essentials",
    "Kolhapur kids store",
    "premium kids clothing",
    "school bags",
    "kids toys",
    "gift hampers for kids",
    "Jack and Jill Kolhapur",
  ],
  openGraph: {
    title: "Jack & Jill — Premium Kids Fashion & Baby Essentials",
    description: "22 years of making parenting simpler. Style • Comfort • Care.",
    type: "website",
    locale: "en_IN",
    siteName: "Jack & Jill",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "Jack & Jill — Premium Kids Fashion & Baby Essentials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jack & Jill — Premium Kids Fashion & Baby Essentials",
    description: "22 years of making parenting simpler. Style • Comfort • Care.",
    images: [`${SITE_URL}/og-default.png`],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

async function fetchGlobals() {
  const supabase = await createClient();
  const [{ data: cats }, { data: ages }, { data: badges }, { data: setBrand }, { data: contact }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("age_groups").select("*").order("sort_order"),
    supabase.from("trust_badges").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("settings").select("value").eq("key", "brand").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "contact_info").maybeSingle(),
  ]);
  const flat = (cats ?? []) as Category[];
  const map = new Map(flat.map((c) => [c.id, { ...c, children: [] as Category[] }]));
  const tree: Category[] = [];
  map.forEach((c) => {
    if (c.parent_id && map.get(c.parent_id)) map.get(c.parent_id)!.children!.push(c);
    else tree.push(c);
  });
  return {
    categoriesFlat: flat,
    categoriesTree: tree.sort((a, b) => a.sort_order - b.sort_order),
    ageGroups: (ages ?? []) as AgeGroup[],
    trustBadges: (badges ?? []) as TrustBadge[],
    brand: setBrand?.value ?? { name: "Jack & Jill" },
    contact: contact?.value ?? {},
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const globals = await fetchGlobals();
  const tracking = await getTrackingSettings();
  const promo = await getPromoPopup();
  const brandCfg = await getBrandSettings();
  const logoSize = brandCfg.logo_size;
  const logoAlign = brandCfg.logo_align;
  const logoSizeMobile = brandCfg.logo_size_mobile;
  const logoSizeTablet = brandCfg.logo_size_tablet;
  const logoSizeDesktop = brandCfg.logo_size_desktop;

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jack & Jill",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    sameAs: [globals.brand?.instagram, globals.brand?.facebook].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Opp. Shahji Law College, E Ward, Shahupuri",
      addressLocality: "Kolhapur",
      addressRegion: "Maharashtra",
      postalCode: "416001",
      addressCountry: "IN",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+91-83299-84160",
        contactType: "customer service",
        areaServed: "IN",
      },
    ],
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Jack & Jill",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={query}`,
      "query-input": "required name=query",
    },
  };
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${SITE_URL}/#store`,
    name: "Jack & Jill",
    image: `${SITE_URL}/logo.svg`,
    url: SITE_URL,
    telephone: "+91-83299-84160",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Opp. Shahji Law College, E Ward, Shahupuri",
      addressLocality: "Kolhapur",
      addressRegion: "Maharashtra",
      postalCode: "416001",
      addressCountry: "IN",
    },
    geo: { "@type": "GeoCoordinates", latitude: 16.7050, longitude: 74.2433 },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "21:00",
      },
    ],
    sameAs: [globals.brand?.instagram, globals.brand?.facebook].filter(Boolean),
  };

  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body>
        <InitialSiteLoader logoUrl={globals.brand?.logo_url} />
        <SiteChrome
          header={<Header categoriesTree={globals.categoriesTree} ageGroups={globals.ageGroups} logoUrl={globals.brand?.logo_url} storeName={globals.brand?.store_name} logoSizeMobile={logoSizeMobile} logoSizeTablet={logoSizeTablet} logoSizeDesktop={logoSizeDesktop} logoAlign={logoAlign} />}
          footer={<Footer contact={globals.contact} brand={globals.brand} logoSize={logoSize} />}
        >
          {children}
        </SiteChrome>
        <PromoPopup popup={promo} />
        <AnalyticsPixels gaId={tracking.ga4_id} pixelId={tracking.meta_pixel_id} />
        <Toaster position="top-right" richColors closeButton />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
        />
      </body>
    </html>
  );
}
