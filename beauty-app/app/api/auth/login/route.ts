import { NextRequest } from "next/server";
import { goFetch } from "@/lib/go-api";
import { forwardAuthResponse } from "@/lib/auth-route-helpers";

export async function POST(request: NextRequest) {
  const body = await request.text();

  const goResponse = await goFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  return forwardAuthResponse(goResponse);
}
