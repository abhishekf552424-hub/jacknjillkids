import Image from "next/image";
import Link from "next/link";
import { normalizeEmbedUrl } from "@/lib/embeds";
import { HomeSection, type Tone } from "./home/Section";

export default function BrandStory({
  title,
  subtitle,
  image,
  video,
  embed_url,
  body,
  tone = "cream",
}: {
  body?: string;
  tone?: Tone;
  title?: string | null;
  subtitle?: string | null;
  image?: string;
  video?: string;
  embed_url?: string;
}) {
  // Priority: embed_url > video > image
  const mediaType = embed_url ? "embed" : video ? "video" : "image";

  return (
    <HomeSection tone={tone} testid="brand-story">
      <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
        <div className="relative aspect-[5/4] rounded-[26px] overflow-hidden bg-blush">
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
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C2621B] mb-3">Our story</p>
          <h2 className="font-display text-[28px] md:text-4xl lg:text-[40px] leading-[1.1] text-navy text-balance">
            {title ?? "The Jack & Jill Story"}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            {subtitle ?? "Kolhapur's trusted kids brand since 2003."}
          </p>
          {body ? (
            <p className="mt-4 text-ink leading-relaxed whitespace-pre-line">{body}</p>
          ) : (
            <p className="mt-4 text-ink leading-relaxed">
              Founded in 2003 by Ajit Mehta with a single flagship store in Shahupuri, Kolhapur, Jack &amp; Jill has grown into a beloved kids lifestyle destination — trusted by over <strong>10,000 families</strong> across India. From newborn cuddles to teen adventures, everything we curate is <strong>skin-safe, thoughtfully designed and built to last</strong>.
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="inline-flex items-center rounded-full bg-navy hover:bg-ink text-white px-6 py-3.5 text-[15px] font-bold transition-colors">
              Read our story
            </Link>
            <Link href="/shop" className="inline-flex items-center rounded-full border-2 border-navy text-navy px-6 py-3 text-[15px] font-bold hover:bg-navy hover:text-white transition-colors">
              Explore the shop
            </Link>
          </div>
        </div>
      </div>
    </HomeSection>
  );
}
