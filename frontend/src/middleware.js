import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("access_token")?.value; // your auth token

  const { pathname } = req.nextUrl;

  // Protect dashboard/settings
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/clipboards"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent logged-in users from seeing login/register
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/clipboards/:path*", "/login", "/register"],
};
