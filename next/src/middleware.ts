import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { shouldRedirectToAuth } from "@/lib/auth/gate";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (shouldRedirectToAuth(request.nextUrl.pathname, token)) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/pages", "/pages/:path*"],
};
