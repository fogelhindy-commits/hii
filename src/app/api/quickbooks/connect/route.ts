import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getViewerContext } from "@/lib/auth";
import { getQuickBooksAuthUrl, getQuickBooksRedirectUri } from "@/lib/quickbooks";
import { getAppOrigin } from "@/lib/site-url";

const QUICKBOOKS_STATE_COOKIE = "campus-hub-quickbooks-state";

export async function GET(request: Request) {
  const viewer = await getViewerContext();

  if (!viewer || (viewer.user.role !== "owner" && viewer.user.role !== "secretary")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(QUICKBOOKS_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });

  const redirectUri = getQuickBooksRedirectUri(getAppOrigin(new URL(request.url).origin));

  return NextResponse.redirect(
    getQuickBooksAuthUrl({
      state,
      redirectUri,
    }),
  );
}
