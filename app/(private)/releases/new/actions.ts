"use server";

import { redirect } from "next/navigation";
import { createRelease } from "@/lib/db";
import { parseReleaseInput } from "@/lib/release-input";

export async function createReleaseAction(
  _: { error: string },
  formData: FormData,
) {
  const parsed = parseReleaseInput(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error };

  const slug = await createRelease(parsed.data);
  redirect(`/releases/${slug}`);
}
