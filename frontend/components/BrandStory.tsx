import Image from "next/image";
import Link from "next/link";
import { normalizeEmbedUrl } from "@/lib/embeds";

export default function BrandStory({
  title,
  subtitle,
  image,
  video,
  embed_url,
}: {
  title?: string | null;
  subtitle?: string | null;
  image?: string;
  video?: string;
  embed_url?: string;
}) {
  // Priority: embed_url > video > image
  const mediaType = embed_url ? "embed" : video ? "video" : "image";

  return (
    <section className="container py-16 md:py-24" data-testid="brand-story">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="relative aspect-[5/4] rounded-lg overflow-hidden bg-blush">
          {mediaType === "embed" && embed_url && (
            <iframe
              src={normalizeEmbedUrl(embed_url)}
              className="absolute inset-0 w-full h-full"
              frameBorder={0}
              allow="autoplay; fullscreen; picture-in-picture"
              title="Brand story video"
            />
          )}
          {mediaType === "video" && video && (
            <video
              src={video}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              playsInline
            />
          )}
          {mediaType === "image" && image && (
            <Image
              src={image}
              alt="Jack & Jill store in Kolhapur"
              fill
              sizes="(min-width:768px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-3">Our Story</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-navy leading-tight tracking-tight">
            {title ?? "The Jack & Jill Story"}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            {subtitle ?? "Kolhapur's trusted kids brand since 2003."}
          </p>
          <p className="mt-4 text-ink leading-relaxed">
            Founded in 2003 by Ajit Mehta with a single flagship store in Shahupuri, Kolhapur, Jack &amp; Jill has grown into a beloved kids lifestyle destination — trusted by over <strong>10,000 families</strong> across India. From newborn cuddles to teen adventures, everything we curate is <strong>skin-safe, thoughtfully designed and built to last</strong>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="inline-flex items-center bg-navy text-white rounded px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
              Read the full story
            </Link>
            <Link href="/shop" className="inline-flex items-center border-2 border-gold text-gold rounded px-6 py-3 text-sm font-medium hover:bg-gold hover:text-white transition-all">
              Explore the store
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
