"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AddressFields, EMPTY_ADDRESS, type AddressValue } from "@/components/address/AddressFields";
import { hasPhoneNumber, isValidEmail } from "@/lib/masks";
import { getApiErrorMessage } from "@/lib/api-error";

type FormErrors = Partial<Record<string, string>>;

/** Inline field error message. */
function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-destructive mt-0.5">{msg}</p>;
}

/**
 * Customer registration page.
 * Collects name, email, phone (with country code + mask), password, and address.
 *
 * @returns The registration page element.
 */
export default function RegisterPage() {
  const t  = useTranslations("Auth");
  const tP = useTranslations("Profile");
  const tC = useTranslations("Common");
  const router  = useRouter();
  const setAuth = useAuth((state) => state.setAuth);

  const [formData, setFormData] = useState({
    name:                  "",
    email:                 "",
    phone:                 "",
    password:              "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [errorMsg, setErrorMsg] = useState("");

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = tC("validation_required");
    if (!formData.email.trim()) errs.email = tC("validation_required");
    else if (!isValidEmail(formData.email)) errs.email = tC("validation_email");
    if (!hasPhoneNumber(formData.phone)) errs.phone = tC("validation_phone");
    if (!formData.password) errs.password = tC("validation_required");
    else if (formData.password.length < 8) errs.password = tC("validation_password_min");
    if (formData.password !== formData.password_confirmation)
      errs.password_confirmation = tC("validation_password_match");
    if (!address.zipcode.replace(/\D/g, "")) errs.zipcode = tC("validation_required");
    if (!address.street.trim()) errs.street = tC("validation_required");
    if (!address.number.trim()) errs.number = tC("validation_required");
    if (!address.neighborhood.trim()) errs.neighborhood = tC("validation_required");
    if (!address.city.trim()) errs.city = tC("validation_required");
    if (!address.state) errs.state = tC("validation_required");
    return errs;
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((e) => {
      const rest = { ...e };
      delete rest[field];
      return rest;
    });
  }

  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        street: address.street,
        number: address.number,
        complement: address.complement || undefined,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipcode: address.zipcode.replace(/\D/g, ""),
      };
      const response = await apiClient.post("/register", payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user);
        router.push("/dashboard");
      }
    },
    onError: (error: unknown) => {
      setErrorMsg(getApiErrorMessage(error, t("register_error")));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setErrorMsg("");
    registerMutation.mutate();
  };

  const inputCls = (field: string) =>
    errors[field] ? "border-destructive focus-visible:ring-destructive" : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-card p-8 shadow-lg border border-border">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {t("register_title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("register_subtitle")}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {errorMsg && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {errorMsg}
            </div>
          )}

          {/* Personal info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => { setFormData((p) => ({ ...p, name: e.target.value })); clearError("name"); }}
                placeholder={t("name_placeholder")}
                className={inputCls("name")}
              />
              {errors.name && <FieldError msg={errors.name} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => { setFormData((p) => ({ ...p, email: e.target.value })); clearError("email"); }}
                placeholder={t("email_placeholder")}
                className={inputCls("email")}
              />
              {errors.email && <FieldError msg={errors.email} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(v) => { setFormData((p) => ({ ...p, phone: v })); clearError("phone"); }}
                className={inputCls("phone")}
              />
              {errors.phone && <FieldError msg={errors.phone} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => { setFormData((p) => ({ ...p, password: e.target.value })); clearError("password"); }}
                placeholder="••••••••"
                className={inputCls("password")}
              />
              {errors.password && <FieldError msg={errors.password} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">{t("password_confirmation")}</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => { setFormData((p) => ({ ...p, password_confirmation: e.target.value })); clearError("password_confirmation"); }}
                placeholder="••••••••"
                className={inputCls("password_confirmation")}
              />
              {errors.password_confirmation && <FieldError msg={errors.password_confirmation} />}
            </div>
          </div>

          {/* Address section */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <p className="text-sm font-medium text-foreground">{tP("address_section")}</p>

            <AddressFields
              value={address}
              errors={errors}
              idPrefix="reg"
              onChange={(patch) => {
                setAddress((current) => ({ ...current, ...patch }));
                Object.keys(patch).forEach(clearError);
              }}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("register_loading")}
              </>
            ) : (
              t("register_button")
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("has_account")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("login_link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
