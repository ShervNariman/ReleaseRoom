"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createRelease } from "@/lib/db";
const schema = z.object({ title:z.string().min(3).max(120), summary:z.string().min(10).max(500), owner:z.string().min(2).max(80), environment:z.string().min(2).max(40), repository:z.string().min(3).max(160), branch:z.string().min(1).max(160), commitSha:z.string().min(4).max(64), prUrl:z.string().url().optional().or(z.literal("")), linearUrl:z.string().url().optional().or(z.literal("")), previewUrl:z.string().url().optional().or(z.literal("")), changedFiles:z.string().min(1) });
export async function createReleaseAction(_: { error: string }, formData: FormData) { const parsed=schema.safeParse(Object.fromEntries(formData)); if(!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid release" }; const slug=await createRelease({ ...parsed.data, prUrl:parsed.data.prUrl||undefined, linearUrl:parsed.data.linearUrl||undefined, previewUrl:parsed.data.previewUrl||undefined, changedFiles:parsed.data.changedFiles.split(/\r?\n|,/).map((v)=>v.trim()).filter(Boolean) }); redirect(`/releases/${slug}`); }
