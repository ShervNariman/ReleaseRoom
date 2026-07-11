import { redirect } from "next/navigation";
import { hasSession } from "@/lib/auth";
import { MobileNav, Sidebar } from "@/components/sidebar";
export default async function PrivateLayout({ children }: { children: React.ReactNode }) { if (!(await hasSession())) redirect("/login"); return <div className="min-h-screen lg:flex"><Sidebar/><div className="min-w-0 flex-1"><MobileNav/><main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main></div></div>; }
