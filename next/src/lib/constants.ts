/** Port of `src/app/pages/shared/classes/constants.ts`. */
export const PASSWORD_PATTERN =
  /^(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=[^0-9]*[0-9]).{6,12}$/;

/** Port of `src/app/pages/shared/validation/validators.ts`. */
export const NUMBER_PATTERN = /^[0-9]+$/;
export const ALPHANUMERIC_PATTERN = /^[a-zA-Zа-яА-Я0-9]+$/;
export const ALPHANUMERIC_WITH_HYPHEN_PATTERN = /^[a-zA-Z0-9-_]+$/;
