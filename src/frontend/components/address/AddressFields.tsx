"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { formatCep } from "@/lib/masks";
import { fetchAddressByCep } from "@/lib/viacep";
import { cn } from "@/lib/utils";

/** Structured Brazilian address, as stored on users. */
export interface AddressValue {
  zipcode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Per-field validation messages. */
export type AddressErrors = Partial<Record<keyof AddressValue, string>>;

/** An address with every field empty. */
export const EMPTY_ADDRESS: AddressValue = {
  zipcode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

interface AddressFieldsProps {
  value: AddressValue;
  /** Receives only the fields that changed; merge it into the parent state. */
  onChange: (patch: Partial<AddressValue>) => void;
  errors?: AddressErrors;
  /** Prefix for element ids so several forms can coexist on one page. */
  idPrefix?: string;
}

const errorInputClass = "border-destructive focus-visible:ring-destructive";

/**
 * Brazilian address inputs with ViaCEP auto-fill: typing a full CEP looks up
 * street, neighborhood, city and state. Controlled — the parent owns the value
 * and its validation errors.
 *
 * @param value - Current address.
 * @param onChange - Called with the changed fields.
 * @param errors - Validation messages keyed by field.
 * @param idPrefix - Prefix for input ids.
 */
export function AddressFields({ value, onChange, errors = {}, idPrefix = "addr" }: AddressFieldsProps) {
  const t = useTranslations("Address");
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // The lookup is async; read the latest value when it resolves instead of the stale closure.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const lookup = useCallback(
    async (digits: string) => {
      setSearching(true);
      setLookupError("");
      try {
        const address = await fetchAddressByCep(digits);
        if (!address) {
          setLookupError(t("cep_not_found"));
          return;
        }
        const current = valueRef.current;
        onChange({
          street: address.street || current.street,
          neighborhood: address.neighborhood || current.neighborhood,
          city: address.city || current.city,
          state: address.state || current.state,
        });
      } catch {
        setLookupError(t("cep_not_found"));
      } finally {
        setSearching(false);
      }
    },
    [onChange, t]
  );

  function handleZipcodeChange(raw: string) {
    const formatted = formatCep(raw);
    onChange({ zipcode: formatted });

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      void lookup(digits);
    } else {
      setLookupError("");
    }
  }

  const id = (field: string) => `${idPrefix}-${field}`;
  const fieldError = (field: keyof AddressValue) =>
    errors[field] ? <p className="text-xs text-destructive mt-0.5">{errors[field]}</p> : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={id("zipcode")}>{t("zipcode")}</Label>
        <div className="relative">
          <Input
            id={id("zipcode")}
            inputMode="numeric"
            placeholder="00000-000"
            maxLength={9}
            value={value.zipcode}
            onChange={(e) => handleZipcodeChange(e.target.value)}
            className={cn("pr-9", (errors.zipcode || lookupError) && errorInputClass)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 opacity-40" />}
          </div>
        </div>
        {searching && <p className="text-xs text-muted-foreground">{t("cep_searching")}</p>}
        {lookupError ? <p className="text-xs text-destructive mt-0.5">{lookupError}</p> : fieldError("zipcode")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor={id("street")}>{t("street")}</Label>
          <Input
            id={id("street")}
            placeholder={t("street_placeholder")}
            value={value.street}
            onChange={(e) => onChange({ street: e.target.value })}
            className={errors.street ? errorInputClass : ""}
          />
          {fieldError("street")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("number")}>{t("number")}</Label>
          <Input
            id={id("number")}
            placeholder={t("number_placeholder")}
            value={value.number}
            onChange={(e) => onChange({ number: e.target.value })}
            className={errors.number ? errorInputClass : ""}
          />
          {fieldError("number")}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("complement")}>{t("complement")}</Label>
        <Input
          id={id("complement")}
          placeholder={t("complement_placeholder")}
          value={value.complement}
          onChange={(e) => onChange({ complement: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("neighborhood")}>{t("neighborhood")}</Label>
        <Input
          id={id("neighborhood")}
          placeholder={t("neighborhood_placeholder")}
          value={value.neighborhood}
          onChange={(e) => onChange({ neighborhood: e.target.value })}
          className={errors.neighborhood ? errorInputClass : ""}
        />
        {fieldError("neighborhood")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor={id("city")}>{t("city")}</Label>
          <Input
            id={id("city")}
            placeholder={t("city_placeholder")}
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className={errors.city ? errorInputClass : ""}
          />
          {fieldError("city")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("state")}>{t("state")}</Label>
          <select
            id={id("state")}
            value={value.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              errors.state && "border-destructive"
            )}
          >
            <option value="">{t("select_state")}</option>
            {BRAZIL_STATES.map((state) => (
              <option key={state.uf} value={state.uf}>
                {state.uf} — {state.name}
              </option>
            ))}
          </select>
          {fieldError("state")}
        </div>
      </div>
    </div>
  );
}
