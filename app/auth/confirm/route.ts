import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const next = request.nextUrl.searchParams.get("next") || "/";
  // Only allow redirects within this application.
  const destination = new URL(next, request.url);
  const safeDestination = destination.origin === request.nextUrl.origin
    ? destination
    : new URL("/", request.url);
  const response = NextResponse.redirect(safeDestination);

  if (!code && !(token_hash && type === "email")) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.redirect(new URL("/login?error=not_configured", request.url));
  }
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });
  // Default Supabase emails return a PKCE code; custom templates may use a token hash.
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: token_hash!, type: "email" });
  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired_link", request.url));
  }
  return response;
}
