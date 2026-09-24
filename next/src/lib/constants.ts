/** Port of `src/app/pages/shared/classes/constants.ts`. */
export const PASSWORD_PATTERN =
  /^(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=[^0-9]*[0-9]).{6,12}$/;

/** Angular `validators.alphanumeric` — store codes. */
export const ALPHANUMERIC_PATTERN = /^[a-zA-Zа-яА-Я0-9]+$/;

/** Angular `validators.emailPattern` — store form. */
export const STORE_EMAIL_PATTERN =
  /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})$/;
