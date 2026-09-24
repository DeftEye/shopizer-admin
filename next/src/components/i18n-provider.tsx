"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getLang, setLang as persistLang, syncTokenCookie } from "@/lib/auth/session";
import { getMessages, t as translate, type Messages } from "@/lib/i18n";

type I18nContextValue = {
  lang: string;
  langs: string[];
  messages: Messages;
  t: (key: string) => string;
  setLang: (lang: string) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  defaultLang,
  langs,
}: {
  children: React.ReactNode;
  defaultLang: string;
  langs: string[];
}) {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    syncTokenCookie();
    const stored = getLang();
    if (stored) {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const messages = useMemo(() => getMessages(lang), [lang]);

  const setLang = useCallback((next: string) => {
    persistLang(next);
    setLangState(next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback((key: string) => translate(messages, key), [messages]);

  const value = useMemo(
    () => ({ lang, langs, messages, t, setLang }),
    [lang, langs, messages, t, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
