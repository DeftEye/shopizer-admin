"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  createAttribute,
  getAttributeById,
  getListOfOptionValues,
  getListOfOptions,
  updateAttribute,
  type ProductAttribute,
} from "@/lib/api/product-children";
import { formatMoney, NUMBER_PATTERN } from "@/lib/validation";

import styles from "../product-children.module.css";

type Choice = { value: string; label: string };

const emptyForm = {
  option: "",
  attributeDisplayOnly: false,
  optionValue: "",
  productAttributeUnformattedPrice: "0",
  sortOrder: "0",
  attributeDefault: false,
  requiredOption: false,
  productAttributeWeight: "0",
};

export function AttributeFormDialog({
  productId,
  attributeId,
  onClose,
}: {
  productId: string;
  attributeId?: string | number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState<Choice[]>([]);
  const [optionValues, setOptionValues] = useState<Choice[]>([]);
  const [attribute, setAttribute] = useState<ProductAttribute>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void Promise.all([
      getListOfOptions({}),
      getListOfOptionValues({}),
    ]).then(([optionRes, optionValueRes]) => {
      const nextOptions = (optionRes.options ?? []).map((option) => ({
        value: option.code,
        label: option.code,
      }));
      const nextValues = (optionValueRes.optionValues ?? []).map((value) => ({
        value: value.code,
        label: value.code,
      }));
      nextOptions.push({ value: "", label: "Please select options" });
      nextValues.push({ value: "", label: "Please select option values" });
      setOptions(nextOptions);
      setOptionValues(nextValues);
    });
  }, []);

  useEffect(() => {
    if (!attributeId) {
      return;
    }
    const id = window.setTimeout(() => {
      setLoading(true);
      getAttributeById(productId, attributeId, {})
        .then((res) => {
          setAttribute(res);
          setForm({
            option: res.option?.code ?? "",
            attributeDisplayOnly: !!res.attributeDisplayOnly,
            optionValue: res.optionValue?.code ?? "",
            productAttributeUnformattedPrice: String(
              res.productAttributeUnformattedPrice ?? 0,
            ),
            sortOrder: String(res.sortOrder ?? 0),
            attributeDefault: !!res.attributeDefault,
            requiredOption: !!res.requiredOption,
            productAttributeWeight: String(res.productAttributeWeight ?? 0),
          });
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(id);
  }, [attributeId, productId]);

  function mark(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function save() {
    setTouched({
      option: true,
      optionValue: true,
      productAttributeUnformattedPrice: true,
    });
    setLoading(true);
    const optionObj = {
      ...form,
      option: { code: form.option },
      optionValue: { code: form.optionValue },
      productAttributePrice: form.productAttributeUnformattedPrice,
    };
    try {
      if (attribute.id) {
        await updateAttribute(productId, attributeId ?? attribute.id, optionObj);
      } else {
        await createAttribute(productId, optionObj);
      }
      onClose();
    } catch {
      setError(t("ERROR.SYSTEM_ERROR_TEXT"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.dialogBackdrop} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t("PRODUCT_ATTRIBUTES.OPTIONS_ATTRIBUTES")}
          </h2>
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              {t("ORDER_FORM.CANCLE")}
            </button>
            <button type="button" className={styles.primary} onClick={() => void save()}>
              {loading ? "" : t("COMMON.SAVE")} {loading ? "" : t("COMMON.SAVE")}
            </button>
          </div>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.field}>
          <label className={styles.label}>
            {t("PRODUCT_ATTRIBUTES.ATTRIBUTE_NAME")} *
          </label>
          <select
            className={styles.select}
            value={form.option}
            onBlur={() => mark("option")}
            onChange={(event) => setForm({ ...form, option: event.target.value })}
          >
            {options.map((option) => (
              <option key={`${option.value}-${option.label}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {touched.option && !form.option ? (
            <span className={styles.error}>{t("COMMON.VALUE_REQUIRED")}</span>
          ) : null}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            {t("PRODUCT_ATTRIBUTES.PRODUCT_OPTION")} *
          </label>
          <select
            className={styles.select}
            value={form.optionValue}
            onBlur={() => mark("optionValue")}
            onChange={(event) =>
              setForm({ ...form, optionValue: event.target.value })
            }
          >
            {optionValues.map((option) => (
              <option key={`${option.value}-${option.label}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {touched.optionValue && !form.optionValue ? (
            <span className={styles.error}>{t("COMMON.VALUE_REQUIRED")}</span>
          ) : null}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="productAttributeUnformattedPrice">
            {t("PRODUCT_ATTRIBUTES.OPTION_PRICE")}
          </label>
          <input
            id="productAttributeUnformattedPrice"
            className={styles.input}
            value={form.productAttributeUnformattedPrice}
            onBlur={() => {
              mark("productAttributeUnformattedPrice");
              if (form.productAttributeUnformattedPrice !== "") {
                setForm({
                  ...form,
                  productAttributeUnformattedPrice: formatMoney(
                    form.productAttributeUnformattedPrice.replace(/,/g, ""),
                  ),
                });
              }
            }}
            onChange={(event) =>
              setForm({
                ...form,
                productAttributeUnformattedPrice: event.target.value,
              })
            }
          />
          {touched.productAttributeUnformattedPrice &&
          form.productAttributeUnformattedPrice === "" ? (
            <span className={styles.error}>{t("COMMON.VALUE_REQUIRED")}</span>
          ) : null}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="order">
            {t("COMMON.ORDER")} *
          </label>
          <input
            id="order"
            type="number"
            className={styles.input}
            value={form.sortOrder}
            onChange={(event) =>
              setForm({ ...form, sortOrder: event.target.value })
            }
          />
          {form.sortOrder !== "" && !NUMBER_PATTERN.test(form.sortOrder) ? (
            <span className={styles.error}>{t("COMMON.ALPHA_DECIMAL_RULE")}</span>
          ) : null}
        </div>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.attributeDefault}
            onChange={(event) =>
              setForm({ ...form, attributeDefault: event.target.checked })
            }
          />
          {t("PRODUCT_ATTRIBUTES.DEFAULT_OPTION")}
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.requiredOption}
            onChange={(event) =>
              setForm({ ...form, requiredOption: event.target.checked })
            }
          />
          {t("PRODUCT_ATTRIBUTES.REQUIRED_OPTION")}
        </label>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="productAttributeWeight">
            {t("PRODUCT_ATTRIBUTES.ADDITIONAL_WEIGHT")} *
          </label>
          <input
            id="productAttributeWeight"
            type="number"
            className={styles.input}
            required
            value={form.productAttributeWeight}
            onChange={(event) =>
              setForm({ ...form, productAttributeWeight: event.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}
