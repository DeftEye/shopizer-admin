"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { client } from "@/lib/api/client";
import type { Country, Merchant, UserProfile } from "@/lib/api/types";
import { getLang, getMerchant, persistMerchantHome } from "@/lib/auth/session";
import { formatMediumDate } from "@/lib/format";

import styles from "./home.module.css";

type HomeView = {
  userName: string;
  lastAccess: string;
  merchantName: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone: string;
};

const emptyView: HomeView = {
  userName: "",
  lastAccess: "",
  merchantName: "",
  address: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
  phone: "",
};

export default function HomePage() {
  const { t } = useI18n();
  const [view, setView] = useState<HomeView>(emptyView);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = getLang();
    const store = getMerchant() ?? "";
    Promise.all([
      client.listCountriesByLanguage(lang) as Promise<Country[]>,
      client.get("/v1/private/user/profile") as Promise<UserProfile>,
      client.get(`/v1/store/${store}`) as Promise<Merchant>,
    ])
      .then(([countries, user, merchant]) => {
        const country = countries.find((c) => c.code === merchant.address?.country);
        setView({
          userName: user.userName,
          lastAccess: user.lastAccess,
          merchantName: merchant.name,
          address: merchant.address?.address ?? "",
          city: merchant.address?.city ?? "",
          stateProvince: merchant.address?.stateProvince ?? "",
          postalCode: merchant.address?.postalCode ?? "",
          country: country?.name ?? merchant.address?.country ?? "",
          phone: merchant.phone ?? "",
        });
        persistMerchantHome({
          merchantLanguage: user.defaultLanguage,
          merchantName: merchant.name,
          supportedLanguages: merchant.supportedLanguages,
          defaultCountry: merchant.address?.country ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("HOME.STORE_INFORMATION")}</h1>
      </header>
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t("COMPONENTS.STORE_DETAILS")}</h2>
          <div className={styles.info}>
            <strong>{loading ? "…" : view.merchantName}</strong>
            <span>{view.address}</span>
            <span>
              {view.city}
              {view.city || view.stateProvince || view.postalCode ? ", " : ""}
              {view.stateProvince}
              {view.stateProvince || view.postalCode ? ", " : ""}
              {view.postalCode}
            </span>
            <span>{view.country}</span>
            <span>{view.phone}</span>
          </div>
          <div className={styles.info}>
            <span>{view.userName}</span>
            <span>
              {t("HOME.LAST_ACCESS")}: {formatMediumDate(view.lastAccess)}
            </span>
          </div>
        </section>
        <section className={`${styles.card} ${styles.system}`}>
          <h2 className={styles.cardTitle}>System management</h2>
          <button type="button" className={styles.cache} disabled>
            {t("SYSTEM.DELETE_CACHE")}
          </button>
        </section>
      </div>
    </div>
  );
}
