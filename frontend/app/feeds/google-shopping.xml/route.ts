// Public, crawlable address for the Google Merchant Center product feed.
// robots.txt blocks /api/, so point Merchant Center at /feeds/google-shopping.xml.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { GET } from "@/app/api/feed/google-shopping.xml/route";
