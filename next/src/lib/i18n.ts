import en from "../../messages/en.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import ru from "../../messages/ru.json";

export const LOCALES = ["en", "fr", "es", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export type Messages = Record<string, unknown>;

const catalogs: Record<Locale, Messages> = {
  en: en as Messages,
  fr: fr as Messages,
  es: es as Messages,
  ru: ru as Messages,
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getMessages(locale: string): Messages {
  return isLocale(locale) ? catalogs[locale] : catalogs.en;
}

export function t(messages: Messages, key: string): string {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  return typeof current === "string" ? current : key;
}
