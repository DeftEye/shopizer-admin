import type { RoleFlags, SecurityGroup, UserGroup, UserProfile } from "@/lib/api/types";
import { isEmail } from "@/lib/auth/login";
import { hasRetailAdminRole, isAnAdmin, isSuperAdmin } from "@/lib/auth/roles";
import { PASSWORD_PATTERN, USER_EMAIL_PATTERN } from "@/lib/constants";

export type GroupOption = {
  id: number;
  name: string;
  type?: string;
  checked: boolean;
  disabled: boolean;
};

/** Angular `user-form` mutual-exclusion table — applied only when loading a user. */
export const GROUP_RULES: Record<
  string,
  { key: string; checked: boolean; disabled: boolean }[]
> = {
  ADMIN_RETAIL: [
    { key: "ADMIN_STORE", checked: false, disabled: true },
    { key: "ADMIN_RETAIL", checked: false, disabled: false },
  ],
  ADMIN_STORE: [
    { key: "ADMIN_STORE", checked: false, disabled: false },
    { key: "ADMIN_RETAIL", checked: false, disabled: true },
  ],
};

export function isUserEmailValid(email: string): boolean {
  const value = email.trim();
  return isEmail(value) && USER_EMAIL_PATTERN.test(value);
}

export function passwordsMatch(password: string, repeat: string): boolean {
  return password === repeat;
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}

export function userHasGroup(user: UserProfile | null | undefined, name: string): boolean {
  return !!user?.groups?.some((group) => group.name === name);
}

export function isSelfUser(
  user: UserProfile | null | undefined,
  currentUserId: string | null,
): boolean {
  return !!user?.id && user.id === Number(currentUserId);
}

/**
 * Angular `canChangePassword`: `isSuperadmin || isAdmin || isRetailAdmin`.
 * `isRetailAdmin` is never written by `checkForAccess`, so retail-admin
 * alone cannot set another user's password.
 */
export function canChangeOtherPassword(flags: RoleFlags): boolean {
  return flags.isSuperadmin || flags.isAdmin;
}

export function showPasswordFields(
  user: UserProfile | null | undefined,
  flags: RoleFlags,
  selfEdit: boolean,
): boolean {
  return !selfEdit && (!user?.id || canChangeOtherPassword(flags));
}

export function passwordRequired(user: UserProfile | null | undefined): boolean {
  return !user?.id;
}

/**
 * Create: SUPERADMIN | ADMIN_RETAIL | ADMIN (Angular ngOnInit).
 * Edit: SUPERADMIN only — Angular `fillForm` checks `isRetailerAdmin`,
 * which `checkForAccess` never sets.
 * Self: always locked (`[attr.disabled]="selfEdit"`).
 */
export function isStoreFieldEnabled(
  flags: RoleFlags,
  mode: "create" | "edit",
  selfEdit: boolean,
): boolean {
  if (selfEdit) {
    return false;
  }
  if (mode === "create") {
    return isAnAdmin(flags);
  }
  return isSuperAdmin(flags);
}

/** Angular save(): empty store + (superadmin | isRetailerAdmin) → STORE_REQUIRED. */
export function storeRequiredOnSave(flags: RoleFlags, store: string): boolean {
  return store === "" && flags.isSuperadmin;
}

export function resolveSaveStore(opts: {
  formStore: string;
  sessionStore: string;
  user?: UserProfile | null;
}): string {
  let store = opts.formStore;
  if (!store) {
    store = opts.sessionStore;
  }
  if (!opts.formStore && opts.user) {
    store = opts.user.merchant;
  }
  return store;
}

export function initAdminGroups(
  groups: SecurityGroup[],
  flags: RoleFlags,
): GroupOption[] {
  return groups
    .filter((group) => group.type === "ADMIN")
    .map((group) => {
      const option: GroupOption = {
        id: group.id,
        name: group.name,
        type: group.type,
        checked: false,
        disabled: false,
      };
      if (group.name === "SUPERADMIN") {
        option.disabled = true;
      }
      if (group.name === "ADMIN_RETAIL" && hasRetailAdminRole(flags)) {
        option.disabled = true;
      }
      if (group.name === "ADMIN" && !isSuperAdmin(flags)) {
        option.disabled = true;
      }
      return option;
    });
}

export function applyGroupRules(groups: GroupOption[], role: string): GroupOption[] {
  const rules = GROUP_RULES[role];
  if (!rules) {
    return groups;
  }
  return groups.map((group) => {
    const rule = rules.find((item) => item.key === group.name);
    if (!rule) {
      return group;
    }
    return { ...group, checked: rule.checked, disabled: rule.disabled };
  });
}

export function applyUserGroups(
  groups: GroupOption[],
  user: UserProfile,
  flags: RoleFlags,
  selfEdit: boolean,
): GroupOption[] {
  const groupEdit = !(userHasGroup(user, "SUPERADMIN") && !isSuperAdmin(flags));
  let next = [...groups];
  if (userHasGroup(user, "ADMIN_RETAIL")) {
    next = applyGroupRules(next, "ADMIN_RETAIL");
  } else if (userHasGroup(user, "ADMIN_STORE")) {
    next = applyGroupRules(next, "ADMIN_STORE");
  }

  return next.map((group) => {
    let disabled = group.disabled;
    let checked = group.checked;
    if (group.name === "SUPERADMIN") {
      disabled = true;
    }
    if (user.groups.some((uGroup) => uGroup.name === group.name)) {
      checked = true;
      disabled = false;
    }
    if (selfEdit || !groupEdit) {
      disabled = true;
    }
    return { ...group, checked, disabled };
  });
}

export function canEditUser(user: UserProfile | null | undefined, flags: RoleFlags): boolean {
  if (userHasGroup(user, "SUPERADMIN") && !isSuperAdmin(flags)) {
    return false;
  }
  return true;
}

export function canDeleteUser(
  user: UserProfile | null | undefined,
  currentUserId: string | null,
): boolean {
  if (!user?.id) {
    return false;
  }
  if (isSelfUser(user, currentUserId)) {
    return false;
  }
  if (userHasGroup(user, "SUPERADMIN")) {
    return false;
  }
  return true;
}

export function selectedGroups(groups: GroupOption[]): UserGroup[] {
  return groups
    .filter((group) => group.checked)
    .map((group) => ({ id: group.id, name: group.name }));
}

export type UserFormErrors = {
  firstName?: "required";
  lastName?: "required";
  emailAddress?: "required" | "invalid";
  password?: "required" | "invalid";
  repeatPassword?: "required" | "notSame";
  defaultLanguage?: "required";
  groups?: "required";
};

export function validateUserForm(opts: {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  repeatPassword: string;
  defaultLanguage: string;
  groups: GroupOption[];
  requirePassword: boolean;
  showPassword: boolean;
}): UserFormErrors {
  const errors: UserFormErrors = {};
  if (!opts.firstName.trim()) {
    errors.firstName = "required";
  }
  if (!opts.lastName.trim()) {
    errors.lastName = "required";
  }
  if (!opts.emailAddress.trim()) {
    errors.emailAddress = "required";
  } else if (!isUserEmailValid(opts.emailAddress)) {
    errors.emailAddress = "invalid";
  }
  if (opts.showPassword) {
    if (opts.requirePassword && !opts.password) {
      errors.password = "required";
    } else if (opts.password && !isPasswordValid(opts.password)) {
      errors.password = "invalid";
    }
    if (opts.requirePassword && !opts.repeatPassword) {
      errors.repeatPassword = "required";
    } else if (!passwordsMatch(opts.password, opts.repeatPassword)) {
      // Angular checkPasswords: any mismatch, including edit with
      // password set and an empty repeat, is { notSame: true }.
      errors.repeatPassword = "notSame";
    }
  }
  if (!opts.defaultLanguage) {
    errors.defaultLanguage = "required";
  }
  if (selectedGroups(opts.groups).length === 0) {
    errors.groups = "required";
  }
  return errors;
}

export function userFormValid(errors: UserFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

export function visiblePages(
  currentPage: number,
  totalPages: number,
  pagesToShow = 5,
): number[] {
  const total = Math.max(totalPages, 0);
  const current = currentPage || 1;
  const pages: number[] = [current];
  const times = pagesToShow - 1;
  for (let i = 0; i < times; i += 1) {
    if (pages.length < pagesToShow && Math.min(...pages) > 1) {
      pages.push(Math.min(...pages) - 1);
    }
    if (pages.length < pagesToShow && Math.max(...pages) < total) {
      pages.push(Math.max(...pages) + 1);
    }
  }
  return pages.sort((a, b) => a - b).filter((page) => page >= 1 && (total === 0 || page <= total));
}
