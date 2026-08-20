import { NextResponse } from "next/server";
import { relaySetCookie, setAccessTokenCookie } from "./auth-cookies";
import { goFetch } from "./go-api";

/** Exchanges a refresh cookie value for a new access token, or null if invalid/expired. */
export async function refreshAccessToken(refreshCookieValue: string): Promise<string | null> {
  const goResponse = await goFetch("/auth/refresh", {
    method: "POST",
    headers: { cookie: `refresh_token_session=${refreshCookieValue}` },
  });

  if (!goResponse.ok) return null;

  const { access_token } = await goResponse.json();
  return access_token ?? null;
}

/**
 * Calls a Go auth endpoint that returns { access_token, ...user } and
 * mirrors it back to the browser: the refresh cookie Go set is relayed
 * as-is, and the access token is lifted out of the body into our own
 * httpOnly cookie so server components (see auth.ts) can read it later.
 */
export async function forwardAuthResponse(goResponse: Response) {
  const body = await goResponse.json().catch(() => null);

  if (!goResponse.ok) {
    return NextResponse.json(body ?? { error: "request failed" }, {
      status: goResponse.status,
    });
  }

  const { access_token, ...user } = body ?? {};
  const response = NextResponse.json(user, { status: goResponse.status });

  relaySetCookie(response, goResponse);
  if (access_token) setAccessTokenCookie(response, access_token);

  return response;
}
