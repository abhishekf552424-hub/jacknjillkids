import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Refresh the Supabase session only where the signed-in user matters.
// Public catalogue pages (home, shop, category, product, about…) skip it, so
// they don't make an auth round-trip on every visit and can be cached.
export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/auth/:path*",
    "/api/:path*",
  ],
};
