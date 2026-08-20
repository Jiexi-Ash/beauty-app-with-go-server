// Server-only helper for talking to the Go API directly (no browser access).
// Route handlers under app/api/* use this to proxy requests.
const GO_API_URL = process.env.GO_API_URL ?? "http://localhost:8080";

export function goApiUrl(path: string) {
  return `${GO_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function goFetch(path: string, init?: RequestInit) {
  return fetch(goApiUrl(path), init);
}
