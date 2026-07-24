import { NextResponse } from "next/server";

export function proxy(req) {
  // Gate on the long-lived refresh_token, not the ~1h access_token. The access_token
  // cookie lapses every hour, so gating on it would bounce a still-logged-in user to
  // /login on any navigation. The refresh_token slides forward on every refresh, so a
  // session that's used at all stays alive — apiFetch refreshes the access token as needed.
  const token = req.cookies.get("refresh_token")?.value;

  const { pathname } = req.nextUrl;

  // Protect dashboard/settings
  if (
    !token &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/clipboards") ||
      pathname.startsWith("/settings"))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent logged-in users from seeing the landing/login/register pages
  if (token && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/settings/:path*", "/clipboards/:path*", "/login", "/register"],
};
