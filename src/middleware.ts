import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // الصفحات العامة (لا تحتاج تسجيل دخول)
  if (pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // تحقق من وجود جلسة
  const session = request.cookies.get("session_token");

  if (pathname.startsWith("/dashboard") && !session) {
    // إعادة التوجيه لصفحة تسجيل الدخول
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
