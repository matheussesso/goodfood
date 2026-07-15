import { UserRole } from "@/hooks/useCustomers";

/** Display metadata for a single user role — label key (admin namespace) and badge/dot colors. */
export interface UserRoleMeta {
  value: UserRole;
  labelKey: `role_${UserRole}`;
  badge: string;
  dot: string;
}

/** Every role manageable from the admin "Users" area, in display order. */
export const USER_ROLES: UserRoleMeta[] = [
  { value: "customer", labelKey: "role_customer", badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  { value: "vet", labelKey: "role_vet", badge: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800", dot: "bg-teal-500" },
  { value: "petshop", labelKey: "role_petshop", badge: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800", dot: "bg-pink-500" },
  { value: "producer", labelKey: "role_producer", badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", dot: "bg-blue-500" },
  { value: "delivery", labelKey: "role_delivery", badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", dot: "bg-amber-500" },
  { value: "admin", labelKey: "role_admin", badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800", dot: "bg-violet-500" },
];

/**
 * Look up display metadata for a role, falling back to "customer" if the
 * value is somehow unrecognized.
 *
 * @param role - The role to look up.
 * @returns The matching role metadata.
 */
export function getRoleMeta(role: UserRole): UserRoleMeta {
  return USER_ROLES.find((r) => r.value === role) ?? USER_ROLES[0];
}
