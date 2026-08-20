import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, setAccessTokenCookie } from "@/lib/auth-cookies";
import { refreshAccessToken } from "@/lib/auth-route-helpers";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/onboarding"];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default async function middleware(request: NextRequest) {
  if (!isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.get(ACCESS_TOKEN_COOKIE)) {
    return NextResponse.next();
  }

  // Access token expired (15 min TTL) — try the longer-lived refresh cookie
  // before bouncing the user to sign-in, mirroring Clerk's silent refresh.
  const refreshCookie = request.cookies.get("refresh_token_session");
  const accessToken = refreshCookie ? await refreshAccessToken(refreshCookie.value) : null;

  if (!accessToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  setAccessTokenCookie(response, accessToken);
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
