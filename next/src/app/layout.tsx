import type { Metadata } from "next";

import { readEnv } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "Shopizer Admin",
  description: "Shopizer administration",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { defaultLang } = readEnv();

  return (
    <html lang={defaultLang}>
      <body>{children}</body>
    </html>
  );
}
