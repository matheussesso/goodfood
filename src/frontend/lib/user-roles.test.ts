import { describe, it, expect } from "vitest";
import type { UserRole } from "@/hooks/useCustomers";
import { USER_ROLES, getRoleMeta } from "./user-roles";

describe("USER_ROLES", () => {
  it("lists every role once, with a matching label key", () => {
    const values = USER_ROLES.map((r) => r.value);

    expect(new Set(values).size).toBe(values.length);
    expect(values).toEqual(["customer", "vet", "petshop", "producer", "delivery", "admin"]);
    for (const role of USER_ROLES) {
      expect(role.labelKey).toBe(`role_${role.value}`);
    }
  });
});

describe("getRoleMeta", () => {
  it.each(USER_ROLES.map((r) => r.value))("returns the metadata for %s", (role) => {
    expect(getRoleMeta(role).value).toBe(role);
  });

  it("falls back to the customer metadata for an unrecognized role", () => {
    expect(getRoleMeta("ghost" as UserRole)).toBe(USER_ROLES[0]);
    expect(getRoleMeta("ghost" as UserRole).value).toBe("customer");
  });
});
