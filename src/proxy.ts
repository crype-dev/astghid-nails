import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.hostname !== "www.astghidnails.com") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = "astghidnails.com";

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/:path*",
};
