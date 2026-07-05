"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettings, GeneralSettings } from "@/hooks/useSettings";
import { generalSettingsSchema } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, Save, Settings2 } from "lucide-react";

/**
 * Admin tab for the global pricing/production parameters. Owns the settings
 * form (RHF + Zod); values are synced from the API via RHF's `values` option.
 */
export function SettingsTab() {
  const t = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();

  const { register, handleSubmit, formState: { errors } } = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    values: settings,
  });

  const onSubmit = async (data: GeneralSettings) => {
    try {
      await updateSettings(data);
      alert(tCommon("success"));
    } catch {
      alert(tCommon("error"));
    }
  };

  const sections = [
    {
      title: t("production_transfer"),
      fields: [
        { name: "production_fixed_value", label: t("fixed_value"), step: "0.01" },
        { name: "production_days_division", label: t("days_division"), step: "1" },
        { name: "production_weight_multiplier", label: t("weight_multiplier"), step: "0.001" },
      ],
    },
    {
      title: t("logistics_transfer"),
      fields: [
        { name: "logistics_fixed_multiplier", label: t("fixed_multiplier"), step: "0.001" },
      ],
    },
    {
      title: t("reserve_margin"),
      fields: [
        { name: "reserve_margin_fixed_value", label: t("fixed_value"), step: "0.01" },
        { name: "reserve_margin_transfer_multiplier", label: t("transfer_multiplier"), step: "0.001" },
      ],
    },
    {
      title: t("gfp_mkt"),
      fields: [
        { name: "gfp_mkt_fixed_value", label: t("fixed_value"), step: "0.01" },
        { name: "gfp_mkt_fixed_multiplier", label: t("fixed_multiplier"), step: "0.001" },
      ],
    },
    {
      title: t("fiscal_tax"),
      fields: [
        { name: "fiscal_fixed_multiplier", label: t("fixed_multiplier"), step: "0.001" },
      ],
    },
    {
      title: t("charge"),
      fields: [
        { name: "charge_fixed_value", label: t("fixed_value"), step: "0.01" },
        { name: "charge_fixed_multiplier", label: t("fixed_multiplier"), step: "0.001" },
      ],
    },
    {
      title: t("schedule"),
      fields: [
        { name: "schedule_fixed_value", label: t("fixed_value"), step: "0.01" },
        { name: "schedule_fixed_multiplier", label: t("fixed_multiplier"), step: "0.001" },
      ],
    },
    {
      title: t("difficulty_ingredients"),
      fields: [
        { name: "difficulty_fixed_value", label: t("difficulty_fixed_value"), step: "0.01" },
        { name: "ingredient_cost_days_division", label: t("ingredient_cost_days_division"), step: "1" },
      ],
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">{t("pricing_warning_title")}</p>
          <p className="text-sm mt-0.5 text-amber-600 dark:text-amber-500">{t("settings_warning")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                  </div>
                  <div className={cn("gap-4", section.fields.length > 1 ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col")}>
                    {section.fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground">
                          {field.label}
                        </label>
                        <Input
                          type="number"
                          step={field.step}
                          {...register(field.name, { valueAsNumber: true })}
                        />
                        {errors[field.name] && (
                          <span className="text-xs text-destructive">{t("invalid")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" disabled={isUpdating} className="shadow-md min-w-[180px]">
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t("save_settings")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
