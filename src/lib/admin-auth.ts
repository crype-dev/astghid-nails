import { cookies } from "next/headers";

const sessionCookieName = "admin_session";
const sessionDurationMs = 24 * 60 * 60 * 1000;

type AdminSession = {
  exp: number;
};

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sign(value: string) {
  const secret = getSessionSecret();

  if (!secret) {
    return "";
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return Buffer.from(signature)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function createAdminSessionCookie() {
  const payload = base64UrlEncode(
    JSON.stringify({ exp: Date.now() + sessionDurationMs } satisfies AdminSession),
  );
  const signature = await sign(payload);

  return `${payload}.${signature}`;
}

export async function verifyAdminSession(value?: string) {
  if (!value) {
    return false;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await sign(payload);
  if (!expectedSignature || signature !== expectedSignature) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as
      | AdminSession
      | undefined;

    return Boolean(session?.exp && session.exp > Date.now());
  } catch {
    return false;
  }
}

export async function isAdminRequest() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(sessionCookieName)?.value);
}

export function getAdminSessionCookieName() {
  return sessionCookieName;
}

export function getAdminSessionMaxAge() {
  return sessionDurationMs / 1000;
}
