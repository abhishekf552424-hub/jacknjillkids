import { createAdminClient } from "@/lib/supabase/admin";
import ReviewsClient from "./ReviewsClient";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reviews")
    .select("*, product:products(name, slug), images:review_images(url)")
    .order("created_at", { ascending: false })
    .limit(200);
  return <ReviewsClient initial={data ?? []} />;
}
