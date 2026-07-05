"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Customer, useUpdateCustomer } from "@/hooks/useCustomers";
import { fetchAddressByCep } from "@/lib/viacep";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { User, MapPin, Loader2, Search } from "lucide-react";

/** Formats raw digit string as XXXXX-XXX. */
function formatCep(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Validates email format. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns true if a PhoneInput value contains at least 4 digits after the country code. */
function hasPhoneNumber(phone: string): boolean {
  const idx = phone.indexOf(" ");
  if (idx === -1) return false;
  return phone.slice(idx + 1).replace(/\D/g, "").length >= 4;
}

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
    phone:        customer.phone        || "",
    street:       customer.street       || "",
    number:       customer.number       || "",
    complement:   customer.complement   || "",
    neighborhood: customer.neighborhood || "",
    city:         customer.city         || "",
    state:        customer.state        || "",
    zipcode:      customer.zipcode      || "",
  }));
  const [cepSearching, setCepSearching] = useState(false);
  const [cepError, setCepError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const fetchCep = useCallback(async (digits: string) => {
    setCepSearching(true);
    setCepError("");
    try {
      const address = await fetchAddressByCep(digits);
      if (!address) {
        setCepError(t("cep_not_found"));
      } else {
        setForm((f) => ({
          ...f,
          street:       address.street       || f.street,
          neighborhood: address.neighborhood || f.neighborhood,
          city:         address.city         || f.city,
          state:        address.state        || f.state,
        }));
      }
    } catch {
      setCepError(t("cep_not_found"));
    } finally {
      setCepSearching(false);
    }
  }, [t]);

  function handleZipcodeChange(raw: string) {
    const formatted = formatCep(raw);
    setForm((f) => ({ ...f, zipcode: formatted }));
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) fetchCep(digits);
    else setCepError("");
  }

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
          </div>
        </div>

        {/* ── Endereço ── */}
        <div className="space-y-3">
          <div className="flex items-center text-sm font-semibold text-primary border-b pb-2">
            <MapPin className="w-4 h-4 mr-2" /> {t("address_title")}
          </div>

          {/* CEP — primeiro, dispara ViaCEP */}
          <div className="space-y-1.5">
            <Label htmlFor="c-zipcode">{t("addr_zipcode")}</Label>
            <div className="relative">
              <Input
                id="c-zipcode"
                inputMode="numeric"
                placeholder="00000-000"
                value={form.zipcode}
                onChange={(e) => { handleZipcodeChange(e.target.value); clearError("zipcode"); }}
                className={cn("pr-9", (cepError || errors.zipcode) && "border-destructive")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                {cepSearching
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4 opacity-40" />
                }
              </div>
            </div>
            {cepSearching && <p className="text-xs text-muted-foreground">{t("cep_searching")}</p>}
            {cepError && <p className="text-xs text-destructive">{cepError}</p>}
            {!cepError && errors.zipcode && <p className="text-xs text-destructive mt-0.5">{errors.zipcode}</p>}
          </div>

          {/* Street + Number */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-street">{t("addr_street")}</Label>
              <Input
                id="c-street"
                placeholder={t("addr_street_placeholder")}
                value={form.street}
                onChange={(e) => { setForm({ ...form, street: e.target.value }); clearError("street"); }}
                className={errors.street ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.street && <p className="text-xs text-destructive mt-0.5">{errors.street}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-number">{t("addr_number")}</Label>
              <Input
                id="c-number"
                placeholder={t("addr_number_placeholder")}
                value={form.number}
                onChange={(e) => { setForm({ ...form, number: e.target.value }); clearError("number"); }}
                className={errors.number ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.number && <p className="text-xs text-destructive mt-0.5">{errors.number}</p>}
            </div>
          </div>

          {/* Complement */}
          <div className="space-y-1.5">
            <Label htmlFor="c-complement">{t("addr_complement")}</Label>
            <Input
              id="c-complement"
              placeholder={t("addr_complement_placeholder")}
              value={form.complement}
              onChange={(e) => setForm({ ...form, complement: e.target.value })}
            />
          </div>

          {/* Neighborhood */}
          <div className="space-y-1.5">
            <Label htmlFor="c-neighborhood">{t("addr_neighborhood")}</Label>
            <Input
              id="c-neighborhood"
              placeholder={t("addr_neighborhood_placeholder")}
              value={form.neighborhood}
              onChange={(e) => { setForm({ ...form, neighborhood: e.target.value }); clearError("neighborhood"); }}
              className={errors.neighborhood ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.neighborhood && <p className="text-xs text-destructive mt-0.5">{errors.neighborhood}</p>}
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-city">{t("addr_city")}</Label>
              <Input
                id="c-city"
                value={form.city}
                onChange={(e) => { setForm({ ...form, city: e.target.value }); clearError("city"); }}
                className={errors.city ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.city && <p className="text-xs text-destructive mt-0.5">{errors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-state">{t("addr_state")}</Label>
              <select
                id="c-state"
                value={form.state}
                onChange={(e) => { setForm({ ...form, state: e.target.value }); clearError("state"); }}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  errors.state && "border-destructive"
                )}
              >
                <option value="">{t("select_state")}</option>
                {BRAZIL_STATES.map((s) => (
                  <option key={s.uf} value={s.uf}>{s.uf} — {s.name}</option>
                ))}
              </select>
              {errors.state && <p className="text-xs text-destructive mt-0.5">{errors.state}</p>}
            </div>
          </div>
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
