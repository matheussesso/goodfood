"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Customer, UserRole, useUpdateCustomer } from "@/hooks/useCustomers";
import { USER_ROLES } from "@/lib/user-roles";
import { AddressFields, type AddressValue } from "@/components/address/AddressFields";
import { hasPhoneNumber, isValidEmail } from "@/lib/masks";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { User, MapPin, Loader2 } from "lucide-react";

interface EditCustomerModalProps {
  /** Customer whose contact/address data is being edited. */
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Admin modal for editing a customer's basic info and address, with
 * ViaCEP auto-fill and field-level validation. Owns its own form state;
 * the parent only controls visibility.
 */
export function EditCustomerModal({ customer, isOpen, onClose }: EditCustomerModalProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const { mutateAsync: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

  // Seeded on mount — the parent must remount the modal per opening
  // (rendering it conditionally) so the latest customer data is loaded.
  const [form, setForm] = useState(() => ({
    name:         customer.name,
    email:        customer.email,
    role:         customer.role         as UserRole,
    phone:        customer.phone        || "",
    street:       customer.street       || "",
    number:       customer.number       || "",
    complement:   customer.complement   || "",
    neighborhood: customer.neighborhood || "",
    city:         customer.city         || "",
    state:        customer.state        || "",
    zipcode:      customer.zipcode      || "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = tCommon("validation_required");
    if (!form.email.trim()) errs.email = tCommon("validation_required");
    else if (!isValidEmail(form.email)) errs.email = tCommon("validation_email");
    if (!hasPhoneNumber(form.phone)) errs.phone = tCommon("validation_phone");
    if (!form.zipcode.replace(/\D/g, "")) errs.zipcode      = tCommon("validation_required");
    if (!form.street.trim())              errs.street       = tCommon("validation_required");
    if (!form.number.trim())              errs.number       = tCommon("validation_required");
    if (!form.neighborhood.trim())        errs.neighborhood = tCommon("validation_required");
    if (!form.city.trim())                errs.city         = tCommon("validation_required");
    if (!form.state)                      errs.state        = tCommon("validation_required");
    return errs;
  }

  function clearError(field: string) {
    if (!errors[field]) return;
    setErrors((e) => {
      const rest = { ...e };
      delete rest[field];
      return rest;
    });
  }

  const address: AddressValue = {
    zipcode: form.zipcode,
    street: form.street,
    number: form.number,
    complement: form.complement,
    neighborhood: form.neighborhood,
    city: form.city,
    state: form.state,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaveError("");
    setSaveOk("");
    try {
      await updateCustomer({ id: customer.id, data: form });
      setSaveOk(t("customer_updated"));
      setTimeout(onClose, 1000);
    } catch (err) {
      const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(axiosMessage || t("customer_update_error"));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("edit_customer_title")}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {saveError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {saveError}
          </div>
        )}
        {saveOk && (
          <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            {saveOk}
          </div>
        )}
        {/* ── Dados básicos ── */}
        <div className="space-y-3">
          <div className="flex items-center text-sm font-semibold text-primary border-b pb-2">
            <User className="w-4 h-4 mr-2" /> {t("basic_data")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">{t("name")}</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); clearError("name"); }}
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">{t("email")}</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError("email"); }}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive mt-0.5">{errors.email}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="c-phone">{t("phone")}</Label>
              <PhoneInput
                id="c-phone"
                value={form.phone}
                onChange={(v) => { setForm({ ...form, phone: v }); clearError("phone"); }}
                className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive mt-0.5">{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="c-role">{t("user_type")}</Label>
              <select
                id="c-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Endereço ── */}
        <div className="space-y-3">
          <div className="flex items-center text-sm font-semibold text-primary border-b pb-2">
            <MapPin className="w-4 h-4 mr-2" /> {t("address_title")}
          </div>

          <AddressFields
            value={address}
            errors={errors}
            idPrefix="edit-user"
            onChange={(patch) => {
              setForm((current) => ({ ...current, ...patch }));
              Object.keys(patch).forEach(clearError);
            }}
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {tCommon("save_changes")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
