import { NextRequest, NextResponse } from "next/server";
import { setAccessTokenCookie } from "@/lib/auth-cookies";
import { refreshAccessToken } from "@/lib/auth-route-helpers";

export async function POST(request: NextRequest) {
  const refreshCookie = request.cookies.get("refresh_token_session");

  if (!refreshCookie) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const accessToken = await refreshAccessToken(refreshCookie.value);

  if (!accessToken) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  setAccessTokenCookie(response, accessToken);
  return response;
}
