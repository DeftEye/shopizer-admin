/** Port of `src/app/pages/shared/classes/constants.ts`. */
export const PASSWORD_PATTERN =
  /^(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=[^0-9]*[0-9]).{6,12}$/;

/** Port of `src/app/pages/shared/validation/validators.ts` `alphanumeric`. */
export const ALPHANUMERIC = /^[a-zA-Zа-яА-Я0-9]+$/;
