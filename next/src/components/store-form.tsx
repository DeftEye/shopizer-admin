"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  asStoreList,
  checkIfStoreExist,
  createStore,
  getCountries,
  getCurrencies,
  getListOfStores,
  getMeasures,
  getStore,
  getZones,
  storeCodeTaken,
  updateStore,
} from "@/lib/api/store";
import type {
  Country,
  Currency,
  StoreDetails,
  Zone,
} from "@/lib/api/types";
import { getMerchant, getRoles } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/roles";
import { ALPHANUMERIC_PATTERN, STORE_EMAIL_PATTERN } from "@/lib/constants";
import { readEnv } from "@/lib/env";

import styles from "./store-page.module.css";

export type EstablishmentType = "STORE" | "RETAILER";

type FormState = {
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  stateProvince: string;
  supportedLanguages: string[];
  defaultLanguage: string;
  currency: string;
  currencyFormatNational: boolean;
  weight: string;
  dimension: string;
  inBusinessSince: string;
  useCache: boolean;
  retailer: boolean;
  retailerStore: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  stateProvince: "",
  supportedLanguages: [],
  defaultLanguage: "",
  currency: "",
  currencyFormatNational: true,
  weight: "",
  dimension: "",
  inBusinessSince: toDateInput(new Date()),
  useCache: false,
  retailer: false,
  retailerStore: "",
};

function toDateInput(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function toIsoDate(value: string): string {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function StoreForm({
  store,
  titleKey,
  showCancel = false,
  establishmentType = "STORE",
}: {
  store?: StoreDetails | null;
  titleKey: string;
  showCancel?: boolean;
  establishmentType?: EstablishmentType;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const roles = getRoles();
  const merchant = getMerchant() ?? "";
  const globalLanguages = readEnv().langs;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Zone[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [weights, setWeights] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [retailers, setRetailers] = useState<StoreDetails[]>([]);
  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [retailerLocked, setRetailerLocked] = useState(true);
  const [retailerStoreLocked, setRetailerStoreLocked] = useState(true);
  const [isRetailerRole, setIsRetailerRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isReadonlyCode = !!(store && store.id && store.id > 0);
  const label = (suffix: string) => `STORE_FORM.${establishmentType}_${suffix}`;

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadProvinces(code: string, selected?: string) {
    setProvinces([]);
    if (!code) {
      return;
    }
    try {
      const zones = await getZones(code);
      setProvinces(zones);
      if (selected) {
        patch("stateProvince", selected);
      }
    } catch {
      setError(t("STORE_FORM.ERROR_STATE_PROVINCE"));
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [countryList, currencyList, measures, storeList] = await Promise.all([
          getCountries(),
          getCurrencies(),
          getMeasures(),
          getListOfStores({
            start: 0,
            length: 1500,
            retailers: true,
            store: merchant,
          }),
        ]);
        if (cancelled) {
          return;
        }
        setCountries(countryList);
        setCurrencies(currencyList);
        setWeights(measures.weights ?? []);
        setSizes(measures.measures ?? []);

        const listed = asStoreList(storeList).data;
        const retailerRows = listed.filter((row) => row.retailer);
        setRetailers(retailerRows);
        const parent = listed.find((row) => row.code === merchant);

        const superAdmin = isSuperAdmin(roles);
        setRetailerLocked(!superAdmin);
        setRetailerStoreLocked(!superAdmin);
        setIsRetailerRole(superAdmin || roles.isAdminRetail);

        if (store && store.id && store.id > 0) {
          const selected = (store.supportedLanguages ?? []).map((lang) => lang.code);
          setForm({
            name: store.name ?? "",
            code: store.code ?? "",
            phone: store.phone ?? "",
            email: store.email ?? "",
            address: store.address?.address ?? "",
            city: store.address?.city ?? "",
            postalCode: store.address?.postalCode ?? "",
            country: store.address?.country ?? "",
            stateProvince: store.address?.stateProvince ?? "",
            supportedLanguages: selected,
            defaultLanguage: store.defaultLanguage ?? "",
            currency: store.currency ?? "",
            currencyFormatNational: store.currencyFormatNational ?? true,
            weight: store.weight ?? "",
            dimension: store.dimension ?? "",
            inBusinessSince: toDateInput(store.inBusinessSince || new Date()),
            useCache: !!store.useCache,
            retailer: !!store.retailer,
            retailerStore: store.parent?.code ?? "",
          });
          if (store.address?.country) {
            await loadProvinces(store.address.country, store.address.stateProvince);
          }
        } else if (parent) {
          // Angular `adjustForm`: reuse languages, currency, measures, and
          // country/state. Do not copy `retailer` — create starts unchecked.
          setForm((current) => ({
            ...current,
            supportedLanguages: (parent.supportedLanguages ?? []).map((lang) => lang.code),
            defaultLanguage: parent.defaultLanguage ?? current.defaultLanguage,
            currency: parent.currency ?? current.currency,
            currencyFormatNational:
              parent.currencyFormatNational ?? current.currencyFormatNational,
            weight: parent.weight ?? current.weight,
            dimension: parent.dimension ?? current.dimension,
            country: parent.address?.country ?? current.country,
            stateProvince: parent.address?.stateProvince ?? current.stateProvince,
          }));
          if (parent.address?.country) {
            await loadProvinces(parent.address.country, parent.address.stateProvince);
          }
          if (superAdmin) {
            setRetailerStoreLocked(true);
          }
        }

        if (store && !store.id && roles.isAdminRetail) {
          setForm((current) => ({
            ...current,
            retailer: false,
            retailerStore: merchant,
          }));
          setRetailerLocked(true);
          setRetailerStoreLocked(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // Load once for the given store + merchant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant, store?.id, store?.code]);

  const errors = useMemo(() => {
    return {
      name: !form.name,
      codeRequired: !form.code,
      codePattern: !!form.code && !ALPHANUMERIC_PATTERN.test(form.code),
      phone: !form.phone,
      emailRequired: !form.email,
      emailPattern: !!form.email && !STORE_EMAIL_PATTERN.test(form.email),
      address: !form.address,
      city: !form.city,
      postalCode: !form.postalCode,
      country: !form.country,
      languages: form.supportedLanguages.length === 0,
      defaultLanguage: !form.defaultLanguage,
      weight: !form.weight,
      dimension: !form.dimension,
    };
  }, [form]);

  const formValid =
    !errors.name &&
    !errors.codeRequired &&
    !errors.codePattern &&
    isCodeUnique &&
    !errors.phone &&
    !errors.emailRequired &&
    !errors.emailPattern &&
    !errors.address &&
    !errors.city &&
    !errors.postalCode &&
    !errors.country &&
    !errors.languages &&
    !errors.defaultLanguage &&
    !errors.weight &&
    !errors.dimension;

  async function onCheckCode(code: string) {
    if (!code) {
      setIsCodeUnique(true);
      return;
    }
    try {
      const res = await checkIfStoreExist(code);
      setIsCodeUnique(!(storeCodeTaken(res) && store?.code !== code));
    } catch {
      setIsCodeUnique(true);
    }
  }

  function toggleLanguage(code: string) {
    setForm((current) => {
      const selected = current.supportedLanguages.includes(code)
        ? current.supportedLanguages.filter((item) => item !== code)
        : [...current.supportedLanguages, code];
      return { ...current, supportedLanguages: selected };
    });
  }

  function onRetailerChange(checked: boolean) {
    patch("retailer", checked);
    setRetailerStoreLocked(checked || !isSuperAdmin(roles));
  }

  function buildPayload() {
    const storeObj: Record<string, unknown> = {
      name: form.name,
      code: form.code,
      phone: form.phone,
      email: form.email,
      address: {
        searchControl: "",
        stateProvince: form.stateProvince,
        country: form.country,
        address: form.address,
        postalCode: form.postalCode,
        city: form.city,
      },
      supportedLanguages: form.supportedLanguages,
      defaultLanguage: form.defaultLanguage,
      currency: form.currency,
      currencyFormatNational: form.currencyFormatNational,
      weight: form.weight,
      dimension: form.dimension,
      inBusinessSince: toIsoDate(form.inBusinessSince),
      useCache: form.useCache,
      retailer: form.retailer,
      retailerStore: form.retailerStore,
    };

    if (store && !store.id) {
      if (!roles.isSuperadmin && form.retailer) {
        storeObj.retailer = false;
        storeObj.retailerStore = merchant;
      }
    }
    if (store && store.id && form.retailer) {
      storeObj.retailer = true;
    }
    return storeObj;
  }

  async function save() {
    if (!formValid) {
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (store && store.id) {
        await updateStore({ ...buildPayload(), code: form.code });
        setMessage(t(`STORE_FORM.${establishmentType}_UPDATED`));
        router.push("/pages/store-management/stores-list");
        return;
      }
      const unique = await checkIfStoreExist(form.code);
      if (storeCodeTaken(unique)) {
        setIsCodeUnique(false);
        setMessage(t("COMMON.CODE_EXISTS"));
        return;
      }
      await createStore(buildPayload());
      setMessage(t(`STORE_FORM.${establishmentType}_CREATED`));
      router.push("/pages/store-management/stores-list");
    } catch {
      setError(t("COMMON.INTERNAL_SERVER_ERROR"));
    } finally {
      setSaving(false);
    }
  }

  function onSidemenu(link: string) {
    if (!store?.code) {
      return;
    }
    router.push(`/pages/store-management/${link}/${store.code}`);
  }

  if (loading) {
    return <p>…</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t(titleKey)}</h1>
        <div className={styles.actions}>
          <select
            className={styles.select}
            value="store"
            onChange={(event) => onSidemenu(event.target.value)}
            aria-label={t("COMPONENTS.STORE_DETAILS")}
          >
            <option value="store-branding">{t("COMPONENTS.STORE_BRANDING")}</option>
            <option value="store">{t("COMPONENTS.STORE_DETAILS")}</option>
          </select>
          {showCancel ? (
            <button
              type="button"
              className={styles.cancel}
              onClick={() => router.push("/pages/store-management/stores-list")}
            >
              {t("ORDER_FORM.CANCLE")}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.primary}
            disabled={!formValid || saving}
            onClick={() => void save()}
          >
            {saving ? "" : t("COMMON.SAVE")}
          </button>
        </div>
      </header>

      {message ? <p className={`${styles.banner} ${styles.bannerSuccess}`}>{message}</p> : null}
      {error ? <p className={`${styles.banner} ${styles.bannerError}`}>{error}</p> : null}

      <form className={styles.card} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-name">
            {t(label("NAME"))} *
          </label>
          <input
            id="store-name"
            className={styles.input}
            value={form.name}
            onChange={(event) => patch("name", event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, name: true }))}
            required
          />
          {touched.name && errors.name ? (
            <p className={styles.error}>{t(label("NAME_REQUIRED"))}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-code">
            {t(label("CODE"))} *
          </label>
          <input
            id="store-code"
            className={styles.input}
            value={form.code}
            readOnly={isReadonlyCode}
            onChange={(event) => patch("code", event.target.value)}
            onBlur={(event) => {
              setTouched((current) => ({ ...current, code: true }));
              void onCheckCode(event.target.value);
            }}
            required
          />
          {touched.code && errors.codeRequired ? (
            <p className={styles.error}>{t("COMMON.CODE_REQUIRED")}</p>
          ) : null}
          {touched.code && errors.codePattern ? (
            <p className={styles.error}>{t("COMMON.ALPHA_DECIMAL_RULE")}</p>
          ) : null}
          {!isCodeUnique ? <p className={styles.error}>{t("COMMON.CODE_EXISTS")}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-phone">
            {t(label("PHONE"))} *
          </label>
          <input
            id="store-phone"
            className={styles.input}
            value={form.phone}
            onChange={(event) => patch("phone", event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            required
          />
          {touched.phone && errors.phone ? (
            <p className={styles.error}>{t("STORE_FORM.PHONE_REQUIRED")}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-email">
            {t(label("EMAIL"))} *
          </label>
          <input
            id="store-email"
            className={styles.input}
            value={form.email}
            onChange={(event) => patch("email", event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            required
          />
          {touched.email && errors.emailRequired ? (
            <p className={styles.error}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_REQUIRED")}</p>
          ) : null}
          {touched.email && errors.emailPattern ? (
            <p className={styles.error}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_NOT_VALID")}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-address">
            {t("STORE_FORM.ADDRESS")} *
          </label>
          <input
            id="store-address"
            className={styles.input}
            value={form.address}
            onChange={(event) => patch("address", event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, address: true }))}
            required
          />
          {touched.address && errors.address ? (
            <p className={styles.error}>{t("STORE_FORM.ADDRESS_REQUIRED")}</p>
          ) : null}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="store-city">
              {t("STORE_FORM.CITY")} *
            </label>
            <input
              id="store-city"
              className={styles.input}
              value={form.city}
              onChange={(event) => patch("city", event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, city: true }))}
              required
            />
            {touched.city && errors.city ? (
              <p className={styles.error}>{t("STORE_FORM.CITY_CODE_REQUIRED")}</p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="store-postal">
              {t("STORE_FORM.POSTAL_CODE")} *
            </label>
            <input
              id="store-postal"
              className={styles.input}
              value={form.postalCode}
              onChange={(event) => patch("postalCode", event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, postal: true }))}
              required
            />
            {touched.postal && errors.postalCode ? (
              <p className={styles.error}>{t("STORE_FORM.POSTAL_CODE_REQUIRED")}</p>
            ) : null}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-country">
            {t("STORE_FORM.COUNTRY")} *
          </label>
          <select
            id="store-country"
            className={styles.selectField}
            value={form.country}
            onChange={(event) => {
              patch("country", event.target.value);
              patch("stateProvince", "");
              void loadProvinces(event.target.value);
            }}
            required
          >
            <option value="">{t("STORE_FORM.COUNTRY")}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-state">
            {t("STORE_FORM.STATE_PROVINCE")}
          </label>
          {provinces.length > 0 ? (
            <select
              id="store-state"
              className={styles.selectField}
              value={form.stateProvince}
              onChange={(event) => patch("stateProvince", event.target.value)}
            >
              <option value="">{t("STORE_FORM.STATE_PROVINCE")}</option>
              {provinces.map((zone) => (
                <option key={zone.code} value={zone.code}>
                  {zone.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="store-state"
              className={styles.input}
              value={form.stateProvince}
              onChange={(event) => patch("stateProvince", event.target.value)}
            />
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>{t("STORE_FORM.SUPPORTED_LANGUAGES")} *</span>
          <div className={styles.checkRow}>
            {globalLanguages.map((code) => (
              <label key={code}>
                <input
                  type="checkbox"
                  checked={form.supportedLanguages.includes(code)}
                  onChange={() => toggleLanguage(code)}
                />
                {t(`LANG.${code}`)}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-default-lang">
            {t("COMMON.DEFAULT_LANGUAGE")} *
          </label>
          <select
            id="store-default-lang"
            className={styles.selectField}
            value={form.defaultLanguage}
            onChange={(event) => patch("defaultLanguage", event.target.value)}
            required
          >
            <option value="">{t("COMMON.DEFAULT_LANGUAGE")}</option>
            {globalLanguages.map((code) => (
              <option key={code} value={code}>
                {t(`LANG.${code}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-currency">
            {t("STORE_FORM.CURRENCY")}
          </label>
          <select
            id="store-currency"
            className={styles.selectField}
            value={form.currency}
            onChange={(event) => patch("currency", event.target.value)}
          >
            <option value="">{t("STORE_FORM.CURRENCY")}</option>
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={form.currencyFormatNational}
              onChange={(event) => patch("currencyFormatNational", event.target.checked)}
            />
            {t("STORE_FORM.CURRENCY_FORMAT")}
          </label>
          <p className={styles.hint}>{t("STORE_FORM.CURRENCY_FORMAT_RULE")}</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-weight">
            {t("STORE_FORM.WEIGHT_UNITS")} *
          </label>
          <select
            id="store-weight"
            className={styles.selectField}
            value={form.weight}
            onChange={(event) => patch("weight", event.target.value)}
            required
          >
            <option value="">{t("STORE_FORM.WEIGHT_UNITS")}</option>
            {weights.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-size">
            {t("STORE_FORM.SIZE_UNITS")} *
          </label>
          <select
            id="store-size"
            className={styles.selectField}
            value={form.dimension}
            onChange={(event) => patch("dimension", event.target.value)}
            required
          >
            <option value="">{t("STORE_FORM.SIZE_UNITS")}</option>
            {sizes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="store-since">
            {t("STORE_FORM.OPERATING_SINCE")}
          </label>
          <input
            id="store-since"
            type="date"
            className={styles.input}
            value={form.inBusinessSince}
            onChange={(event) => patch("inBusinessSince", event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={form.useCache}
              onChange={(event) => patch("useCache", event.target.checked)}
            />
            {t("STORE_FORM.USE_CACHE")}
          </label>
        </div>

        <div className={styles.field}>
          <label className={styles.checkRow}>
            <input
              id="store-is-retailer"
              type="checkbox"
              checked={form.retailer}
              disabled={retailerLocked}
              onChange={(event) => onRetailerChange(event.target.checked)}
            />
            {t("COMPONENTS.RETAILER")}
          </label>
        </div>

        {isRetailerRole ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="store-retailer">
              {t("STORE_FORM.SELECT_RETAILER")}
            </label>
            <select
              id="store-retailer"
              className={styles.selectField}
              value={form.retailerStore}
              disabled={retailerStoreLocked}
              onChange={(event) => patch("retailerStore", event.target.value)}
            >
              <option value="">{t("STORE_FORM.SELECT_RETAILER")}</option>
              {retailers.map((row) => (
                <option key={row.code} value={row.code}>
                  {row.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </form>
    </div>
  );
}

export function CurrentStoreForm() {
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = getMerchant() ?? "";
    getStore(code)
      .then(setStore)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !store) {
    return null;
  }
  return <StoreForm store={store} titleKey="STORE.STORE_INFORMATION" />;
}
