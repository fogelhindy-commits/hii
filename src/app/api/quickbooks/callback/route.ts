import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeQuickBooksCode,
  getQuickBooksRedirectUri,
} from "@/lib/quickbooks";
import { getAppOrigin } from "@/lib/site-url";

const QUICKBOOKS_STATE_COOKIE = "campus-hub-quickbooks-state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(QUICKBOOKS_STATE_COOKIE)?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?quickbooks=${encodeURIComponent(error)}`,
        url.origin,
      ),
    );
  }

  if (!code || !realmId || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?quickbooks=invalid_callback", url.origin),
    );
  }

  cookieStore.delete(QUICKBOOKS_STATE_COOKIE);

  try {
    await exchangeQuickBooksCode({
      code,
      realmId,
      redirectUri: getQuickBooksRedirectUri(getAppOrigin(url.origin)),
    });
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?quickbooks=${encodeURIComponent(
          err instanceof Error ? err.message : "quickbooks_error",
        )}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/settings?quickbooks=connected", url.origin),
  );
}
