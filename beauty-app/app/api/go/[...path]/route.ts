import { NextRequest, NextResponse } from "next/server";
import { goApiUrl } from "@/lib/go-api";
import { ACCESS_TOKEN_COOKIE, setAccessTokenCookie } from "@/lib/auth-cookies";
import { refreshAccessToken } from "@/lib/auth-route-helpers";

// Generic authenticated proxy: browser calls /api/go/<go-path>, we attach the
// Bearer token from our httpOnly cookie (the browser never sees it directly)
// and forward to the Go API, retrying once via the refresh cookie on a 401.
async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetPath = `/${path.join("/")}${request.nextUrl.search}`;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const doFetch = (token?: string) =>
    fetch(goApiUrl(targetPath), {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });

  let goResponse = await doFetch(accessToken);
  let refreshedToken: string | null = null;

  if (goResponse.status === 401) {
    const refreshCookie = request.cookies.get("refresh_token_session");
    if (refreshCookie) {
      refreshedToken = await refreshAccessToken(refreshCookie.value);
      if (refreshedToken) goResponse = await doFetch(refreshedToken);
    }
  }

  const responseBody = await goResponse.text();
  const response = new NextResponse(responseBody, {
    status: goResponse.status,
    headers: {
      "Content-Type": goResponse.headers.get("content-type") ?? "application/json",
    },
  });

  if (refreshedToken) setAccessTokenCookie(response, refreshedToken);

  return response;
}

export {
  handleProxy as GET,
  handleProxy as POST,
  handleProxy as PATCH,
  handleProxy as PUT,
  handleProxy as DELETE,
};
