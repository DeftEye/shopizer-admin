"use client";

import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { getListOfStores } from "@/lib/api/catalog";

import styles from "./catalog.module.css";

export function StoreAutocomplete({
  onStore,
}: {
  onStore: (code: string) => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function search(code: string) {
    try {
      const res = await getListOfStores({ code: code || "DEFAULT" });
      setStores((res.data ?? []).map((store) => store.code));
      setOpen(true);
    } catch {
      setStores([]);
    }
  }

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={styles.storeWrap} ref={wrapRef}>
      <input
        className={styles.search}
        value={value}
        placeholder={t("STORE.MERCHANT_STORE")}
        onFocus={() => {
          void search(value);
        }}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          void search(next);
        }}
      />
      {open && stores.length > 0 ? (
        <ul className={styles.suggest}>
          {stores.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => {
                  setValue(code);
                  setOpen(false);
                  onStore(code);
                }}
              >
                {code}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
