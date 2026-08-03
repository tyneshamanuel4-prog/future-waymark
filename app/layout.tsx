import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Success Center | Senior Year Guidance",
  description: "Trusted guidance, practical learning centers, and progress tools for every step of senior year.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "Student Success Center", description: "Your senior year, one clear step at a time.", images: [{ url: "/og.png", width: 1733, height: 909 }] },
  twitter: { card: "summary_large_image", title: "Student Success Center", description: "Your senior year, one clear step at a time.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
