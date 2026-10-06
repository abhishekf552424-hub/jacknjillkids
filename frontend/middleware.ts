import { updateSession } from "@/lib/supabase/middleware";
import { getSiteMode, isAdminRequestCookie } from "@/lib/site-mode";
import { NextResponse, type NextRequest } from "next/server";

// Pages where the signed-in user matters: refresh the Supabase session there.
// Public catalogue pages skip it, so they make no auth round-trip and stay cacheable.
const SESSION_PATHS = /^\/(admin|account|checkout|orders|auth|api)(\/|$)/;
// Never hidden behind "coming soon": the admin panel, APIs and the page itself.
const ALWAYS_OPEN = /^\/(admin|api|coming-soon)(\/|$)/;
const PREVIEW_FLAG = "jj_preview";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!ALWAYS_OPEN.test(pathname)) {
    const mode = await getSiteMode();
    if (!mode.live) {
      const admin = await isAdminRequestCookie(request.cookies.get("admin_2fa_ok")?.value);
      if (!admin) {
        // Visitors: show the coming-soon page at the same address.
        const res = NextResponse.rewrite(new URL("/coming-soon", request.url));
        res.headers.set("Cache-Control", "no-store");
        if (request.cookies.has(PREVIEW_FLAG)) res.cookies.delete(PREVIEW_FLAG);
        return res;
      }
      // Admin preview: the real site, plus a flag the page uses to show a "preview" bar.
      const res = SESSION_PATHS.test(pathname) ? await updateSession(request) : NextResponse.next();
      res.cookies.set(PREVIEW_FLAG, "1", { path: "/", sameSite: "lax" });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    if (request.cookies.has(PREVIEW_FLAG)) {
      const res = SESSION_PATHS.test(pathname) ? await updateSession(request) : NextResponse.next();
      res.cookies.delete(PREVIEW_FLAG);
      return res;
    }
  }

  return SESSION_PATHS.test(pathname) ? await updateSession(request) : NextResponse.next();
}

export const config = {
  // Every page, but not build files, images, fonts or other static files.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|txt|xml|webmanifest|woff2?|ttf|mp4|webm)$).*)"],
};
