"use client";

import { useId, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { asStoreNames, getListOfMerchantStoreNames } from "@/lib/api/store";
import type { StoreName } from "@/lib/api/types";

import styles from "./store-autocomplete.module.css";

export function StoreAutocomplete({
  onStore,
  value,
}: {
  onStore: (code: string) => void;
  value?: string;
}) {
  const { t } = useI18n();
  const listId = useId();
  const [typed, setTyped] = useState(value ?? "");
  const query = value !== undefined ? value : typed;
  const [stores, setStores] = useState<StoreName[]>([]);
  const [open, setOpen] = useState(false);

  async function searchStore(name?: string) {
    const res = await getListOfMerchantStoreNames(name ? { name } : undefined);
    setStores(asStoreNames(res));
    setOpen(true);
  }

  function select(code: string) {
    setTyped(code);
    setOpen(false);
    onStore(code);
  }

  return (
    <div className={styles.wrap}>
      <input
        className={styles.input}
        list={listId}
        placeholder={t("STORE.MERCHANT_STORE")}
        value={query}
        onChange={(event) => {
          setTyped(event.target.value);
          void searchStore(event.target.value);
        }}
        onFocus={() => {
          void searchStore(query);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        aria-label={t("STORE.MERCHANT_STORE")}
      />
      {open && stores.length > 0 ? (
        <ul className={styles.list} role="listbox">
          {stores.map((store) => (
            <li key={store.code}>
              <button type="button" onMouseDown={() => select(store.code)}>
                {store.code}
                {store.name ? ` — ${store.name}` : ""}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
