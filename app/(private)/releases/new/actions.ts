"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createRelease } from "@/lib/db";
import { parseReleaseInput } from "@/lib/release-input";

export async function createReleaseAction(
  _: { error: string },
  formData: FormData,
) {
  await requireSession();
  const parsed = parseReleaseInput(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error };

  const slug = await createRelease(parsed.data);
  redirect(`/releases/${slug}`);
}
