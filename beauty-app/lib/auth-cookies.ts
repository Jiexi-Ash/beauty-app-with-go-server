import { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "access_token";
// Matches the 15 minute TTL the Go API signs into the access token (jwt.go).
const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

export function setAccessTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAccessTokenCookie(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/**
 * The Go API sets the refresh token as a cookie on its own Set-Cookie header,
 * scoped to Path=/auth/ (Go's own route namespace). Since our route handlers
 * call Go server-to-server, we have to relay that cookie through to the
 * browser ourselves — and re-scope it to Path=/, since our app needs it sent
 * back on /api/auth/refresh, /api/auth/logout, and /api/go/* (none of which
 * start with /auth/). We parse and re-set it via response.cookies rather than
 * copying the raw header, since appending a raw Set-Cookie header and later
 * calling response.cookies.set() (e.g. for the access token) causes Next to
 * rebuild the Set-Cookie header set from its cookie store, silently dropping
 * the raw-appended one.
 */
export function relaySetCookie(response: NextResponse, goResponse: Response) {
  const setCookie = goResponse.headers.get("set-cookie");
  if (!setCookie) return;

  const [nameValue, ...attrs] = setCookie.split(";").map((p) => p.trim());
  const eqIndex = nameValue.indexOf("=");
  if (eqIndex === -1) return;
  const name = nameValue.slice(0, eqIndex);
  const value = nameValue.slice(eqIndex + 1);

  const expiresAttr = attrs.find((a) => a.toLowerCase().startsWith("expires="));
  const expires = expiresAttr ? new Date(expiresAttr.slice(expiresAttr.indexOf("=") + 1)) : undefined;

  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}
