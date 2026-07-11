import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { accessKey, sessionSecret } from "@/lib/env";

const COOKIE = "release-room-session";

function digest(value: string) {
  return createHmac("sha256", sessionSecret).update(value).digest("hex");
}

export function verifyAccessKey(value: string) {
  const expected = Buffer.from(digest(accessKey));
  const actual = Buffer.from(digest(value));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createSession() {
  const store = await cookies();
  store.set(COOKIE, digest(accessKey), { httpOnly: true, sameSite: "lax", secure: Boolean(process.env.VERCEL) || process.env.RELEASE_ROOM_SECURE_COOKIES === "true", path: "/", maxAge: 60 * 60 * 24 * 14 });
}

export async function hasSession() {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value) return false;
  const expected = Buffer.from(digest(accessKey));
  const actual = Buffer.from(value);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
