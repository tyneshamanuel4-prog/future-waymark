import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://future-waymark.vercel.app"),
  title: "Future Waymark | Guidance for Every Path Forward",
  description: "Trusted guidance, practical learning centers, and progress tools for senior year and every path that comes next.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "Future Waymark", description: "Create a private student account and build a path that evolves with you.", images: [{ url: "/og-future-waymark.png", width: 1733, height: 909 }] },
  twitter: { card: "summary_large_image", title: "Future Waymark", description: "Create a private student account and build a path that evolves with you.", images: ["/og-future-waymark.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
