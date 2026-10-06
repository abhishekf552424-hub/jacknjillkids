import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { publicOrigin } from "@/lib/site";
import { TWO_FA_COOKIE, isTwoFaCookieValid } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let signedInId: string | null = null;

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      signedInId = data.user.id;
      // Create profile if it doesn't exist (same as email/password signup)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();
      
      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
          role: "customer",
        });
      }
    }
  }

  // Back to where the shopper started (same site only).
  const cookieNext = request.headers.get("cookie")?.match(/(?:^|;\s*)jj_next=([^;]+)/)?.[1];
  let next = "/account";
  try {
    next = safeNext(cookieNext ? decodeURIComponent(cookieNext) : null);
  } catch {
    /* bad cookie → account page */
  }
  // requestUrl.origin is the server's internal address (http://0.0.0.0:3000 on Hostinger) — use the real domain.
  const res = NextResponse.redirect(new URL(next, publicOrigin(request)));
  res.cookies.set("jj_next", "", { path: "/", maxAge: 0 });
  // A different person signed in on this browser: drop any admin access left from before.
  const adminCookie = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${TWO_FA_COOKIE}=([^;]+)`))?.[1];
  if (adminCookie && (!signedInId || !isTwoFaCookieValid(decodeURIComponent(adminCookie), signedInId))) {
    res.cookies.set(TWO_FA_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set("jj_preview", "", { path: "/", maxAge: 0 });
  }
  return res;
}
