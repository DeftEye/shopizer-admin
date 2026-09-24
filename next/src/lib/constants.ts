/** Port of `src/app/pages/shared/classes/constants.ts`. */
export const PASSWORD_PATTERN =
  /^(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=[^0-9]*[0-9]).{6,12}$/;

/** User-form email pattern from `user-form.component.ts`. */
export const USER_EMAIL_PATTERN =
  /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})$/;

export const USERS_PAGE_SIZE = 15;
