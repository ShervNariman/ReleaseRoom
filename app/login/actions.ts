"use server";
import { redirect } from "next/navigation";
import { createSession, verifyAccessKey } from "@/lib/auth";
export async function loginAction(_: { error: string }, formData: FormData) { const key = String(formData.get("accessKey") ?? ""); if (!verifyAccessKey(key)) return { error: "That private access key is not valid." }; await createSession(); redirect("/"); }
