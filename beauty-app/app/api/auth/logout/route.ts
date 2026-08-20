import { NextRequest, NextResponse } from "next/server";
import { goFetch } from "@/lib/go-api";
import { clearAccessTokenCookie, relaySetCookie } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const refreshCookie = request.cookies.get("refresh_token_session");

  const goResponse = await goFetch("/auth/logout", {
    method: "POST",
    headers: refreshCookie
      ? { cookie: `refresh_token_session=${refreshCookie.value}` }
      : undefined,
  });

  const response = NextResponse.json({ success: true });
  relaySetCookie(response, goResponse);
  clearAccessTokenCookie(response);
  return response;
}
