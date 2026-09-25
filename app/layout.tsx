import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CatGardens Care",
  description: "Daily care, medication rounds, and medical records for sanctuary animals.",
  applicationName: "CatGardens Care",
  other: { "apple-mobile-web-app-capable": "yes" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CatGardens Care", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#234d31"};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
