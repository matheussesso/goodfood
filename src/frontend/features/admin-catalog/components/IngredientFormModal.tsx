"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Ingredient, useIngredients } from "@/hooks/useIngredients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";

/** ATM-style currency mask: raw digit string (cents) → "R$ X.XXX,XX" */
function formatCurrencyMask(digits: string): string {
  const num = parseInt(digits || "0", 10) || 0;
  return "R$ " + (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface IngredientFormModalProps {
  /** Ingredient being edited, or null to create a new one. */
  ingredient: Ingredient | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the translated success message after saving. */
  onSaved: (message: string) => void;
}

/**
 * Admin modal for creating/editing a catalog ingredient, with an ATM-style
 * currency mask for the base price. Owns its form state (seeded on mount —
 * the parent must remount it per opening, e.g. rendering it conditionally).
 */
export function IngredientFormModal({ ingredient, isOpen, onClose, onSaved }: IngredientFormModalProps) {
  const t = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const { createIngredient, updateIngredient, isCreating, isUpdating } = useIngredients();

  const [form, setForm] = useState(() =>
    ingredient
      ? {
          name: ingredient.name, category: ingredient.category || "Outro", description: ingredient.description || "", unit: ingredient.unit,
          cost_per_unit: Math.round((ingredient.cost_per_unit ?? 0) * 100).toString(),
          loss_rate: Number(ingredient.loss_rate).toFixed(2),
          difficulty_multiplier: Number(ingredient.difficulty_multiplier).toFixed(2),
          is_active: ingredient.is_active,
        }
      : { name: "", category: "Outro", description: "", unit: "kg", cost_per_unit: "", loss_rate: "0.00", difficulty_multiplier: "1.00", is_active: true }
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = t("validation_required");
    // cost_per_unit stored as raw digits (cents); convert back to decimal
    const costCents = parseInt(form.cost_per_unit || "0", 10) || 0;
    const cost = costCents / 100;
    if (costCents <= 0) errors.cost_per_unit = t("validation_positive_number");
    const loss = parseFloat(form.loss_rate);
    if (isNaN(loss) || loss < 0) errors.loss_rate = t("validation_non_negative");
    const diff = parseFloat(form.difficulty_multiplier);
    if (isNaN(diff) || diff <= 0) errors.difficulty_multiplier = t("validation_positive_number");

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaveError("");

    try {
      const data = {
        name: form.name.trim(), category: form.category, description: form.description,
        unit: form.unit, cost_per_unit: cost, loss_rate: loss,
        difficulty_multiplier: diff, is_active: form.is_active,
      };
      if (ingredient) await updateIngredient({ id: ingredient.id, ...data });
      else await createIngredient(data);

      onSaved(ingredient ? t("ingredient_updated_success") : t("ingredient_created_success"));
      onClose();
    } catch {
      setSaveError(tCommon("error"));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ingredient ? t("edit_ingredient") : t("new_ingredient")}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {saveError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {saveError}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("name")}</Label>
            <Input
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors(p => ({ ...p, name: "" })); }}
              className={formErrors.name ? "border-destructive" : ""}
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>{t("category")}</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="Proteína">{t("protein")}</option>
              <option value="Carboidrato">{t("carb")}</option>
              <option value="Vegetal">{t("vegetable")}</option>
              <option value="Gordura">{t("fat")}</option>
              <option value="Suplemento">{t("supplement")}</option>
              <option value="Outro">{t("other")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("unit")}</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="kg">{t("unit_kg")}</option>
              <option value="g">{t("unit_g")}</option>
              <option value="l">{t("unit_l")}</option>
              <option value="ml">{t("unit_ml")}</option>
              <option value="unit">{t("unit_un")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("base_price_label")}</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatCurrencyMask(form.cost_per_unit)}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, "");
                setForm({ ...form, cost_per_unit: digits });
                setFormErrors(p => ({ ...p, cost_per_unit: "" }));
              }}
              className={formErrors.cost_per_unit ? "border-destructive" : ""}
            />
            {formErrors.cost_per_unit && <p className="text-xs text-destructive">{formErrors.cost_per_unit}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("loss_rate_label")}</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={form.loss_rate}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d*).*/, "$1");
                setForm({ ...form, loss_rate: v });
                setFormErrors(p => ({ ...p, loss_rate: "" }));
              }}
              onBlur={() => {
                const n = parseFloat(form.loss_rate);
                if (!isNaN(n)) setForm(f => ({ ...f, loss_rate: n.toFixed(2) }));
              }}
              className={formErrors.loss_rate ? "border-destructive" : ""}
            />
            {formErrors.loss_rate && <p className="text-xs text-destructive">{formErrors.loss_rate}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>{t("difficulty_multiplier_label")}</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={form.difficulty_multiplier}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d*).*/, "$1");
                setForm({ ...form, difficulty_multiplier: v });
                setFormErrors(p => ({ ...p, difficulty_multiplier: "" }));
              }}
              onBlur={() => {
                const n = parseFloat(form.difficulty_multiplier);
                if (!isNaN(n)) setForm(f => ({ ...f, difficulty_multiplier: n.toFixed(2) }));
              }}
              className={formErrors.difficulty_multiplier ? "border-destructive" : ""}
            />
            {formErrors.difficulty_multiplier && <p className="text-xs text-destructive">{formErrors.difficulty_multiplier}</p>}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {tCommon("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
