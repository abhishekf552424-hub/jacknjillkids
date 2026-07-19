import Link from "next/link";
import { getBrandSettings } from "@/lib/settings";

export default async function SiteLogo({ variant = "navy", size = "md", href = "/" }: {
  variant?: "navy" | "white";
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const brand = await getBrandSettings();
  const sizePx = size === "sm" ? 28 : size === "lg" ? 56 : 40;
  const textCls =
    (variant === "white" ? "text-white" : "text-navy") +
    " " +
    (size === "sm" ? "text-lg md:text-xl" : size === "lg" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl") +
    " font-display font-bold";

  return (
    <Link href={href} data-testid="site-logo" className="flex items-center gap-2 flex-shrink-0">
      {brand.logo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={brand.logo_url} alt={brand.store_name} style={{ height: sizePx }} className="w-auto object-contain" />
      ) : (
        <span className="flex items-baseline gap-1">
          <span className={textCls}>Jack</span>
          <span className={textCls + " text-gold"}>&amp;</span>
          <span className={textCls}>Jill</span>
        </span>
      )}
    </Link>
  );
}
