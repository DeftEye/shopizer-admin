"use client";

import { useState } from "react";

import { listStoreCodes } from "@/lib/catalogue/options-api";

import styles from "./options-page.module.css";

export function StoreAutocomplete({
  value,
  placeholder,
  onStore,
}: {
  value: string;
  placeholder: string;
  onStore: (store: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [stores, setStores] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  async function searchStore() {
    try {
      const codes = await listStoreCodes();
      setStores(codes);
      setOpen(true);
    } catch {
      setStores([]);
    }
  }

  return (
    <div className={styles.storeWrap}>
      <input
        className={styles.input}
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          void searchStore();
        }}
        onFocus={() => {
          void searchStore();
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && stores.length > 0 ? (
        <ul className={styles.suggestions}>
          {stores.map((code) => (
            <li key={code}>
              <button
                type="button"
                className={styles.suggestion}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(code);
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
