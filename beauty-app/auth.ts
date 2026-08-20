import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";

/**
 * Reads the Go API access token for the current request, for use in server
 * components that need to call the Go API directly during SSR. The cookie is
 * set by app/api/auth/{login,register,refresh}/route.ts and expires after 15
 * minutes — callers that render logged-in-only data should treat an absent
 * token as "not authenticated" rather than retrying, since a stale page load
 * just means the client-side session check (app/api/auth/session) hasn't
 * refreshed it yet.
 */
export async function getAuthToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}
