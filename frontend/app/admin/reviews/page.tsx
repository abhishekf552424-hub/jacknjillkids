import { createAdminClient } from "@/lib/supabase/admin";
import ReviewsClient from "./ReviewsClient";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  await requireAdminPage(["super_admin", "content_manager"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("reviews")
    .select("*, product:products(name, slug), images:review_images(url)")
    .order("created_at", { ascending: false })
    .limit(200);
  return <ReviewsClient initial={data ?? []} />;
}
