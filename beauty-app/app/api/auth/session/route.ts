import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, setAccessTokenCookie } from "@/lib/auth-cookies";
import { refreshAccessToken } from "@/lib/auth-route-helpers";

// Lightweight "am I logged in" check for client components (e.g. the navbar).
// If the short-lived access token cookie has expired, transparently tries the
// refresh cookie before giving up — same UX Clerk gave us for free.
export async function GET(request: NextRequest) {
  if (request.cookies.get(ACCESS_TOKEN_COOKIE)) {
    return NextResponse.json({ authenticated: true });
  }

  const refreshCookie = request.cookies.get("refresh_token_session");
  if (!refreshCookie) {
    return NextResponse.json({ authenticated: false });
  }

  const accessToken = await refreshAccessToken(refreshCookie.value);
  if (!accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  const response = NextResponse.json({ authenticated: true });
  setAccessTokenCookie(response, accessToken);
  return response;
}
