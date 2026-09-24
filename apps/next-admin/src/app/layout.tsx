import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopizer Admin (Next spike)",
  description: "Incremental Next.js slice of the Shopizer Angular admin",
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
