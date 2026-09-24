import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopizer admin (Next.js spike)",
  description:
    "Incremental Next.js port of Angular #/auth login against the existing Shopizer API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
