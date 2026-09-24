import type { Metadata } from "next";

import { I18nProvider } from "@/components/i18n-provider";
import { readEnv } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "Shopizer Admin",
  description: "Shopizer administration",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { defaultLang, langs } = readEnv();

  return (
    <html lang={defaultLang}>
      <body>
        <I18nProvider defaultLang={defaultLang} langs={langs}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
