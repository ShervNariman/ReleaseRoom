import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { accessKey, sessionSecret } from "@/lib/env";

const COOKIE = "release-room-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const CLOCK_SKEW_SECONDS = 60;

function digest(value: string) {
  return createHmac("sha256", sessionSecret).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const expected = Buffer.from(left);
  const actual = Buffer.from(right);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sessionSignature(issuedAt: number) {
  return digest(`session:${issuedAt}:${accessKey}`);
}

export function verifyAccessKey(value: string) {
  return safeEqual(digest(accessKey), digest(value));
}

export function verifySessionToken(value: string, currentTime = Date.now()) {
  const [issuedAtValue, signature, ...extra] = value.split(".");
  if (!issuedAtValue || !signature || extra.length > 0) return false;

  const issuedAt = Number(issuedAtValue);
  if (!Number.isSafeInteger(issuedAt) || issuedAt <= 0) return false;

  const currentSeconds = Math.floor(currentTime / 1000);
  if (issuedAt > currentSeconds + CLOCK_SKEW_SECONDS) return false;
  if (currentSeconds - issuedAt > SESSION_MAX_AGE_SECONDS) return false;

  return safeEqual(sessionSignature(issuedAt), signature);
}

export async function createSession() {
  const store = await cookies();
  const issuedAt = Math.floor(Date.now() / 1000);
  store.set(COOKIE, `${issuedAt}.${sessionSignature(issuedAt)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      Boolean(process.env.VERCEL) ||
      process.env.RELEASE_ROOM_SECURE_COOKIES === "true",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    priority: "high",
  });
}

export async function hasSession() {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  return value ? verifySessionToken(value) : false;
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
