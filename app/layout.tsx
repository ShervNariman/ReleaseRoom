import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Release Room", description: "Evidence-backed release assurance for small AI-native startup teams." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
