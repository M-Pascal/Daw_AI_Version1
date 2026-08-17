import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getGoogleAuthUrl, isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(url);
  }

  const state = randomUUID();
  const response = NextResponse.redirect(getGoogleAuthUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });
  return response;
}
