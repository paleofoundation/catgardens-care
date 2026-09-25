import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CatGardens Care",
  description: "Daily care, medication rounds, and medical records for sanctuary animals.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

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
