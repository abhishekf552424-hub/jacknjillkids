import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("cms_pages").select("*").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Not found" };
  return { title: data.meta_title || data.title, description: data.meta_description ?? undefined };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("cms_pages").select("*").eq("slug", slug).maybeSingle();
  if (!data) return notFound();

  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Legal</p>
      <h1 className="font-display text-3xl md:text-5xl text-navy tracking-tight mb-6">{data.title}</h1>
      <article className="prose-jj text-ink">
        {(data.content ?? "").split(/\n\n+/).map((p: string, i: number) => (
          <p key={i}>{p}</p>
        ))}
      </article>
    </div>
  );
}
