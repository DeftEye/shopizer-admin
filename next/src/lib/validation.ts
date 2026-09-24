/** Port of `src/app/pages/shared/validation/validators.ts`. */
export const NUMBER_PATTERN = /^[0-9]+$/;
export const ALPHANUMERIC_PATTERN = /^[a-zA-Zа-яА-Я0-9]+$/;

/** Angular `formatMoney` via CurrencyPipe('en') without `$`. */
export function formatMoney(value: string | number): string {
  const temp = `${value}`.replace(/,/g, "");
  const amount = Number(temp);
  if (Number.isNaN(amount)) {
    return `${value}`;
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

/** Calendar date only — do not parse `YYYY-MM-DD` as UTC midnight. */
export function formatIsoDate(value: string | Date | undefined | null): string {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    const match = DATE_ONLY.exec(value);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function apiErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "body" in error &&
    error.body &&
    typeof error.body === "object" &&
    "message" in error.body &&
    typeof (error.body as { message: unknown }).message === "string"
  ) {
    return (error.body as { message: string }).message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "";
}
