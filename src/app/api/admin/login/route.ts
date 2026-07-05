import { NextResponse } from "next/server";
import {
  createAdminSessionCookie,
  getAdminSessionCookieName,
  getAdminSessionMaxAge,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { message: "L'accès admin n'est pas encore configuré." },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as { password?: string };

  if (!payload.password || payload.password !== configuredPassword) {
    return NextResponse.json(
      { message: "Mot de passe incorrect." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(getAdminSessionCookieName(), await createAdminSessionCookie(), {
    httpOnly: true,
    maxAge: getAdminSessionMaxAge(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
