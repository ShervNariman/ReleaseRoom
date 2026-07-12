"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, verifyAccessKey } from "@/lib/auth";
import { clearRateLimit, consumeRateLimit } from "@/lib/rate-limit";

function requestIdentity(forwardedFor: string | null, realIp: string | null) {
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

export async function loginAction(
  _: { error: string },
  formData: FormData,
) {
  const requestHeaders = await headers();
  const identity = requestIdentity(
    requestHeaders.get("x-forwarded-for"),
    requestHeaders.get("x-real-ip"),
  );
  const rateLimitKey = `login:${identity}`;
  const attempt = consumeRateLimit(rateLimitKey, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!attempt.allowed) {
    return {
      error: `Too many attempts. Try again in about ${Math.ceil(attempt.retryAfterSeconds / 60)} minute(s).`,
    };
  }

  const key = String(formData.get("accessKey") ?? "");
  if (!verifyAccessKey(key)) {
    return { error: "That private access key is not valid." };
  }

  clearRateLimit(rateLimitKey);
  await createSession();
  redirect("/");
}
