"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  createInventory,
  getListOfStores,
  getSupportedLanguages,
  updateInventory,
  type InventoryItem,
} from "@/lib/api/product-children";
import { getMerchant } from "@/lib/auth/session";
import { ALPHANUMERIC_PATTERN, formatIsoDate } from "@/lib/validation";

import { BackButton } from "./back-button";
import { ImageUploading } from "./image-uploading";
import styles from "../product-children.module.css";

type InventoryFormState = {
  available: boolean;
  sku: string;
  dateAvailable: string;
  store: string;
  variant: string;
  weight: string;
  height: string;
  width: string;
  length: string;
  finalPrice: string;
  discountedPrice: string;
  startDate: string;
  endDate: string;
};

function today() {
  return formatIsoDate(new Date());
}

function emptyForm(): InventoryFormState {
  return {
    available: false,
    sku: "",
    dateAvailable: today(),
    store: "DEFAULT",
    variant: "",
    weight: "",
    height: "",
    width: "",
    length: "",
    finalPrice: "",
    discountedPrice: "",
    startDate: today(),
    endDate: today(),
  };
}

export function InventoryForm({
  productId,
  inventory,
  titleKey,
}: {
  productId: string;
  inventory: InventoryItem;
  titleKey: string;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<InventoryFormState>(emptyForm);
  const [stores, setStores] = useState<{ value: string; label: string }[]>([]);
  const [loader, setLoader] = useState(true);
  const [saved, setSaved] = useState<InventoryItem>(inventory);
  const [message, setMessage] = useState("");
  const prices: unknown[] = [];

  useEffect(() => {
    void getListOfStores({}).then((res) => {
      setStores(
        (res.data ?? []).map((store) => ({
          value: store.code,
          label: store.code,
        })),
      );
    });
    getSupportedLanguages(getMerchant())
      .then(() => {
        setForm(emptyForm());
      })
      .finally(() => setLoader(false));
  }, []);

  async function save() {
    const inventoryObj = {
      available: form.available,
      sku: form.sku,
      dateAvailable: form.dateAvailable ? formatIsoDate(form.dateAvailable) : "",
      store: form.store,
      variant: form.variant,
      productSpecifications: {
        weight: form.weight,
        height: form.height,
        width: form.width,
        length: form.length,
      },
      priceDetails: {
        finalPrice: form.finalPrice,
        discountedPrice: form.discountedPrice,
        startDate: form.startDate,
        endDate: form.endDate,
      },
      prices: [...prices],
      productId,
    };

    const inventoryId = inventory.id ?? saved.id;
    if (inventoryId) {
      await updateInventory(productId, inventoryId, {
        ...inventoryObj,
        id: inventoryId,
      });
      setSaved({ ...saved, ...inventory, id: inventoryId });
      setMessage(t("INVENTORY.INVENTORY_UPDATED"));
    } else {
      const created = await createInventory(inventoryObj);
      setSaved(created);
      setMessage(t("INVENTORY.INVENTORY_CREATED"));
    }
  }

  if (loader) {
    return <p className={styles.status}>…</p>;
  }

  return (
    <form
      className={styles.page}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>{t(titleKey)}</h1>
        <div className={styles.actions}>
          <BackButton />
          <button type="submit" className={styles.primary} disabled={loader}>
            {loader ? "" : t("COMMON.SAVE")}
          </button>
        </div>
      </div>
      {message ? <p className={`${styles.status} ${styles.statusOk}`}>{message}</p> : null}
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.title} style={{ padding: "1rem 1.25rem 0" }}>
            Product Instance details
          </h2>
          <div className={styles.body}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.available}
                onChange={(event) =>
                  setForm({ ...form, available: event.target.checked })
                }
              />
              {t("CONTENT.VISIBLE")}
            </label>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sku">
                {t("PRODUCT.SKU")} *
              </label>
              <input
                id="sku"
                className={styles.input}
                required
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
              />
              {form.sku && !ALPHANUMERIC_PATTERN.test(form.sku) ? (
                <span className={styles.error}>{t("COMMON.ALPHA_DECIMAL_RULE")}</span>
              ) : null}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dateAvailable">
                {t("PRODUCT.DATE_AVAILABLE")}
              </label>
              <input
                id="dateAvailable"
                type="date"
                className={styles.input}
                value={form.dateAvailable}
                onChange={(event) =>
                  setForm({ ...form, dateAvailable: event.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("INVENTORY.INVENTORY_STORE")}</label>
              <select
                className={styles.select}
                value={form.store}
                onChange={(event) => setForm({ ...form, store: event.target.value })}
              >
                {stores.map((store) => (
                  <option key={store.value} value={store.value}>
                    {store.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="variant">
                Variant
              </label>
              <input
                id="variant"
                type="number"
                className={styles.input}
                required
                value={form.variant}
                onChange={(event) =>
                  setForm({ ...form, variant: event.target.value })
                }
              />
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="weight">
                  {t("COMMON.WEIGHT")}
                </label>
                <input
                  id="weight"
                  type="number"
                  className={styles.input}
                  value={form.weight}
                  onChange={(event) =>
                    setForm({ ...form, weight: event.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="height">
                  {t("COMMON.HEIGHT")}
                </label>
                <input
                  id="height"
                  type="number"
                  className={styles.input}
                  value={form.height}
                  onChange={(event) =>
                    setForm({ ...form, height: event.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="width">
                  {t("COMMON.WIDTH")}
                </label>
                <input
                  id="width"
                  type="number"
                  className={styles.input}
                  value={form.width}
                  onChange={(event) =>
                    setForm({ ...form, width: event.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="length">
                  {t("COMMON.LENGTH")}
                </label>
                <input
                  id="length"
                  type="number"
                  className={styles.input}
                  value={form.length}
                  onChange={(event) =>
                    setForm({ ...form, length: event.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </section>
        <div>
          <section className={styles.card}>
            <h2 className={styles.title} style={{ padding: "1rem 1.25rem 0" }}>
              Product price details
            </h2>
            <div className={styles.body}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="finalPrice">
                  {t("PRICE.FINAL_PRICE")}
                </label>
                <input
                  id="finalPrice"
                  type="number"
                  className={styles.input}
                  required
                  value={form.finalPrice}
                  onChange={(event) =>
                    setForm({ ...form, finalPrice: event.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="discountedPrice">
                  {t("PRICE.DISCOUNTED_PRICE")}
                </label>
                <input
                  id="discountedPrice"
                  type="number"
                  className={styles.input}
                  value={form.discountedPrice}
                  onChange={(event) =>
                    setForm({ ...form, discountedPrice: event.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="startDate">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  className={styles.input}
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="endDate">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  className={styles.input}
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                />
              </div>
            </div>
          </section>
          <section className={styles.card}>
            <h2 className={styles.title} style={{ padding: "1rem 1.25rem 0" }}>
              Images
            </h2>
            <div className={styles.body}>
              <ImageUploading
                images={[]}
                addImageUrl=""
                onRemove={() => undefined}
                onUpdate={() => undefined}
                onError={() => undefined}
                onSuccess={() => undefined}
                onFileAdded={() => undefined}
              />
            </div>
          </section>
        </div>
      </div>
      <section className={styles.card}>
        <h2 className={styles.title} style={{ padding: "1rem 1.25rem 0" }}>
          Variation Set
        </h2>
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Variation</label>
            <select className={styles.select} value={form.store} onChange={() => undefined}>
              {stores.map((store) => (
                <option key={`var-${store.value}`} value={store.value}>
                  {store.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className={styles.primary}>
            ADD
          </button>
          <table className={styles.dummyTable}>
            <thead>
              <tr>
                <th>Option Name</th>
                <th>Option Value</th>
                <th>{t("COMMON.ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Test</td>
                <td>Test</td>
                <td>×</td>
              </tr>
              <tr>
                <td>Test 1</td>
                <td>Test 1</td>
                <td>×</td>
              </tr>
              <tr>
                <td>Test 2</td>
                <td>Test 2</td>
                <td>×</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </form>
  );
}
