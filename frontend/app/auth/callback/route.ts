import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/safe-next";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
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
  const res = NextResponse.redirect(new URL(next, requestUrl.origin));
  res.cookies.set("jj_next", "", { path: "/", maxAge: 0 });
  return res;
}
