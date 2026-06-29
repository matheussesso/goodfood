"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { cn } from "@/lib/utils";

type FormErrors = Partial<Record<string, string>>;

/** Formats a raw string as XXXXX-XXX (max 8 digits). */
function formatCep(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Validates email format. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Inline field error message. */
function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-destructive mt-0.5">{msg}</p>;
}

/**
 * Customer registration page.
 * Collects name, email, phone (with country code + mask), password, and optional address.
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

  const [addrZipcode,      setAddrZipcode]      = useState("");
  const [addrStreet,       setAddrStreet]        = useState("");
  const [addrNumber,       setAddrNumber]        = useState("");
  const [addrComplement,   setAddrComplement]    = useState("");
  const [addrNeighborhood, setAddrNeighborhood]  = useState("");
  const [addrCity,         setAddrCity]          = useState("");
  const [addrState,        setAddrState]         = useState("");
  const [cepSearching,     setCepSearching]      = useState(false);
  const [cepError,         setCepError]          = useState("");
  const [errorMsg,         setErrorMsg]          = useState("");

  const fetchCep = useCallback(async (digits: string) => {
    setCepSearching(true);
    setCepError("");
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) {
        setCepError(tP("cep_not_found"));
      } else {
        setAddrStreet(json.logradouro || "");
        setAddrNeighborhood(json.bairro || "");
        setAddrCity(json.localidade || "");
        setAddrState(json.uf || "");
      }
    } catch {
      setCepError(tP("cep_not_found"));
    } finally {
      setCepSearching(false);
    }
  }, [tP]);

  useEffect(() => {
    const digits = addrZipcode.replace(/\D/g, "");
    if (digits.length === 8) fetchCep(digits);
  }, [addrZipcode, fetchCep]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = tC("validation_required");
    if (!formData.email.trim()) errs.email = tC("validation_required");
    else if (!isValidEmail(formData.email)) errs.email = tC("validation_email");
    if (!formData.password) errs.password = tC("validation_required");
    else if (formData.password.length < 8) errs.password = tC("validation_password_min");
    if (formData.password !== formData.password_confirmation)
      errs.password_confirmation = tC("validation_password_match");
    return errs;
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((e) => { const { [field]: _, ...rest } = e; return rest; });
  }

  const registerMutation = useMutation({
    mutationFn: async () => {
      const addressParts = [addrStreet, addrNumber, addrComplement].filter(Boolean);
      const payload = {
        ...formData,
        phone:   formData.phone || undefined,
        address: addressParts.length ? addressParts.join(", ") : undefined,
        city:    addrCity    || undefined,
        state:   addrState   || undefined,
        zipcode: addrZipcode.replace(/\D/g, "") || undefined,
      };
      const response = await apiClient.post("/register", payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        router.push("/dashboard");
      }
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || t("register_error"));
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

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-card p-8 shadow-lg border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
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
                onChange={(e) => {
                  setFormData((p) => ({ ...p, name: e.target.value }));
                  clearError("name");
                }}
                placeholder="Seu nome completo"
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
                onChange={(e) => {
                  setFormData((p) => ({ ...p, email: e.target.value }));
                  clearError("email");
                }}
                placeholder="seu@email.com"
                className={inputCls("email")}
              />
              {errors.email && <FieldError msg={errors.email} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(v) => setFormData((p) => ({ ...p, phone: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, password: e.target.value }));
                  clearError("password");
                }}
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
                onChange={(e) => {
                  setFormData((p) => ({ ...p, password_confirmation: e.target.value }));
                  clearError("password_confirmation");
                }}
                placeholder="••••••••"
                className={inputCls("password_confirmation")}
              />
              {errors.password_confirmation && <FieldError msg={errors.password_confirmation} />}
            </div>
          </div>

          {/* Address section (optional) */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <p className="text-sm font-medium text-foreground">
              {tP("address_section")}{" "}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </p>

            {/* CEP */}
            <div className="space-y-2">
              <Label htmlFor="reg-zipcode">CEP</Label>
              <div className="relative">
                <Input
                  id="reg-zipcode"
                  value={addrZipcode}
                  onChange={(e) => setAddrZipcode(formatCep(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                  className={cn("pr-10", cepError && "border-destructive focus-visible:ring-destructive")}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {cepSearching
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Search className="h-4 w-4 opacity-40" />}
                </div>
              </div>
              {cepSearching && <p className="text-xs text-muted-foreground">{tP("cep_searching")}</p>}
              {cepError    && <FieldError msg={cepError} />}
            </div>

            {/* Street + Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="reg-street">{tP("addr_street")}</Label>
                <Input
                  id="reg-street"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="Av. Paulista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-number">{tP("addr_number")}</Label>
                <Input
                  id="reg-number"
                  value={addrNumber}
                  onChange={(e) => setAddrNumber(e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>

            {/* Complement */}
            <div className="space-y-2">
              <Label htmlFor="reg-complement">{tP("addr_complement")}</Label>
              <Input
                id="reg-complement"
                value={addrComplement}
                onChange={(e) => setAddrComplement(e.target.value)}
                placeholder="Apto, bloco, referência..."
              />
            </div>

            {/* Neighborhood */}
            <div className="space-y-2">
              <Label htmlFor="reg-neighborhood">{tP("addr_neighborhood")}</Label>
              <Input
                id="reg-neighborhood"
                value={addrNeighborhood}
                onChange={(e) => setAddrNeighborhood(e.target.value)}
                placeholder="Bela Vista"
              />
            </div>

            {/* City + State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="reg-city">{tP("addr_city")}</Label>
                <Input
                  id="reg-city"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-state">{tP("addr_state")}</Label>
                <select
                  id="reg-state"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className={selectClass}
                >
                  <option value="">{tP("select_state")}</option>
                  {BRAZIL_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>{s.uf} — {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
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
