"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { client } from "@/lib/api/client";
import type { UserProfile } from "@/lib/api/types";
import { logoutSession } from "@/lib/auth/session";

import { useI18n } from "./i18n-provider";
import styles from "./header.module.css";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const { t, lang, langs, setLang } = useI18n();
  const [name, setName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    client
      .get("/v1/private/user/profile")
      .then((user) => {
        const profile = user as UserProfile;
        setName(`${profile.firstName} ${profile.lastName}`.trim());
      })
      .catch(() => undefined);
  }, []);

  function logout() {
    logoutSession();
    router.push("/auth");
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <Link href="/pages/home" className={styles.logo}>
          <img src="/shopizer-logo.svg" alt="Shopizer" height={48} />
        </Link>
      </div>
      <div className={styles.actions}>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              setLangOpen((v) => !v);
              setMenuOpen(false);
            }}
          >
            {t("COMMON.LANGUAGES")} - ({t(`LANG.${lang}`)})
          </button>
          {langOpen ? (
            <ul className={styles.menu}>
              {langs.map((code) => (
                <li key={code}>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(code);
                      setLangOpen(false);
                    }}
                  >
                    {t(`LANG.${code}`)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              setMenuOpen((v) => !v);
              setLangOpen(false);
            }}
          >
            {name || "…"}
          </button>
          {menuOpen ? (
            <ul className={styles.menu}>
              <li>
                <Link
                  href="/pages/user-management/profile"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("HEADER.PROFILE")}
                </Link>
              </li>
              <li>
                <button type="button" onClick={logout}>
                  {t("HEADER.LOGOUT")}
                </button>
              </li>
            </ul>
          ) : null}
        </div>
      </div>
    </header>
  );
}
