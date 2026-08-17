import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import {
  createUser,
  findUserByEmail,
  findUserByGoogleId,
  linkGoogleId,
} from "@/lib/data/store";
import { createSession } from "@/lib/auth/session";
import { exchangeCodeForTokens, fetchGoogleUserInfo } from "@/lib/auth/google-oauth";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  const failure = (reason: string) => {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", reason);
    const response = NextResponse.redirect(url);
    response.cookies.delete(STATE_COOKIE);
    return response;
  };

  if (!code || !state || !expectedState || state !== expectedState) {
    return failure("google_failed");
  }

  try {
    const { access_token } = await exchangeCodeForTokens(code);
    const googleUser = await fetchGoogleUserInfo(access_token);

    if (!googleUser.email || !googleUser.email_verified) {
      return failure("google_failed");
    }

    let user = await findUserByGoogleId(googleUser.sub);

    if (!user) {
      user = await findUserByEmail(googleUser.email);
      if (user) {
        user = (await linkGoogleId(user.email, googleUser.sub)) ?? user;
      }
    }

    if (!user) {
      user = {
        id: randomUUID(),
        fullName: googleUser.name || googleUser.email,
        email: googleUser.email.toLowerCase(),
        passwordHash: null,
        googleId: googleUser.sub,
        createdAt: new Date().toISOString(),
      };
      await createUser(user);
    }

    await createSession({ userId: user.id, email: user.email, fullName: user.fullName });

    const response = NextResponse.redirect(new URL("/overview", request.url));
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return failure("google_failed");
  }
}
