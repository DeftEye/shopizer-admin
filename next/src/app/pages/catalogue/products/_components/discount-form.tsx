"use client";

import { useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { NUMBER_PATTERN } from "@/lib/validation";

import styles from "../product-children.module.css";

type DiscountState = {
  discountedPrice: string;
  percentageOff: string;
  rebatePrice: string;
  timeBound: boolean;
  startDate: string;
  endDate: string;
  discountedRadio: string;
  percentageOffRadio: string;
  rebateRadio: string;
};

const today = () => new Date().toISOString().slice(0, 10);

function emptyDiscount(): DiscountState {
  return {
    discountedPrice: "",
    percentageOff: "",
    rebatePrice: "",
    timeBound: false,
    startDate: today(),
    endDate: today(),
    discountedRadio: "",
    percentageOffRadio: "",
    rebateRadio: "",
  };
}

export function DiscountForm() {
  const { t } = useI18n();
  const [form, setForm] = useState<DiscountState>(emptyDiscount);
  const [required, setRequired] = useState({
    discountedPrice: false,
    percentageOff: false,
    rebatePrice: true,
  });

  function discountSelected(value: string) {
    setForm((current) => ({ ...current, discountedRadio: value }));
    setRequired((current) => ({
      ...current,
      discountedPrice: value === "1",
    }));
  }

  function percentageSelected(value: string) {
    setForm((current) => ({ ...current, percentageOffRadio: value }));
    setRequired((current) => ({
      ...current,
      percentageOff: value === "2",
    }));
  }

  function rebateSelected(value: string) {
    setForm((current) => ({ ...current, rebateRadio: value }));
    setRequired((current) => ({
      ...current,
      rebatePrice: value === "3",
    }));
  }

  function save() {
    // Angular ProductDiscountComponent.save is empty.
  }

  function numberOk(value: string, needed: boolean) {
    if (!needed) {
      return true;
    }
    return value !== "" && NUMBER_PATTERN.test(value);
  }

  return (
    <div className={styles.card}>
      <form
        className={styles.body}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className={styles.radioBlock}>
          <label className={styles.check}>
            <input
              type="radio"
              name="discountedRadio"
              checked={form.discountedRadio === "1"}
              onChange={() => discountSelected("1")}
            />
            {t("PRICE.DISCOUNTED_PRICE")} - TBD
          </label>
          {form.discountedRadio === "1" ? <span className={styles.required}>*</span> : null}
          <div
            className={
              form.discountedRadio === "1" ? undefined : styles.disabledField
            }
          >
            <input
              id="discountedPrice"
              type="number"
              className={styles.input}
              value={form.discountedPrice}
              onChange={(event) =>
                setForm({ ...form, discountedPrice: event.target.value })
              }
              placeholder={t("PRICE.DISCOUNTED_PRICE")}
            />
            {!numberOk(form.discountedPrice, required.discountedPrice) ? (
              <span className={styles.error}>{t("COMMON.VALUE_REQUIRED")}</span>
            ) : null}
          </div>
        </div>

        <div className={styles.radioBlock}>
          <label className={styles.check}>
            <input
              type="radio"
              name="percentageOffRadio"
              checked={form.percentageOffRadio === "2"}
              onChange={() => percentageSelected("2")}
            />
            {t("PRICE.PERCENTAGE_OFF")}
          </label>
          {form.percentageOffRadio === "2" ? (
            <span className={styles.required}>*</span>
          ) : null}
          <div
            className={
              form.percentageOffRadio === "2" ? undefined : styles.disabledField
            }
          >
            <input
              id="percentageOff"
              type="number"
              className={styles.input}
              value={form.percentageOff}
              onChange={(event) =>
                setForm({ ...form, percentageOff: event.target.value })
              }
              placeholder={t("PRICE.PERCENTAGE_OFF")}
            />
          </div>
        </div>

        <div className={styles.radioBlock}>
          <label className={styles.check}>
            <input
              type="radio"
              name="rebateRadio"
              checked={form.rebateRadio === "3"}
              onChange={() => rebateSelected("3")}
            />
            {t("PRICE.REBATE_PRICE")}
          </label>
          {form.rebateRadio === "3" ? <span className={styles.required}>*</span> : null}
          <div
            className={
              form.rebateRadio === "3" ? undefined : styles.disabledField
            }
          >
            <input
              id="rebatePrice"
              type="number"
              className={styles.input}
              value={form.rebatePrice}
              onChange={(event) =>
                setForm({ ...form, rebatePrice: event.target.value })
              }
              placeholder={t("PRICE.REBATE_PRICE")}
            />
          </div>
        </div>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.timeBound}
            onChange={(event) =>
              setForm({ ...form, timeBound: event.target.checked })
            }
          />
          Time bound promotion
        </label>

        {form.timeBound ? (
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Start Date</label>
              <input
                type="date"
                className={styles.input}
                value={form.startDate}
                readOnly
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End Date</label>
              <input
                type="date"
                className={styles.input}
                value={form.endDate}
                readOnly
              />
            </div>
          </div>
        ) : null}

        <div className={styles.header}>
          <button type="submit" className={styles.primary}>
            {t("COMMON.SAVE")}
          </button>
        </div>
      </form>
    </div>
  );
}
