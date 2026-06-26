"use client";

import { useTranslations } from "next-intl";
import { useSettings, GeneralSettings } from "@/hooks/useSettings";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Save, Settings2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("admin");
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GeneralSettings>();

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: GeneralSettings) => {
    try {
      await updateSettings(data);
      alert(t("settings_saved"));
    } catch (error) {
      alert(t("error_saving_settings"));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{t("loading")}</div>;
  }

  const sections = [
    {
      title: "Repasse Produção",
      fields: [
        { name: "production_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "production_days_division", label: "Divisão Dias", type: "number", step: "1" },
        { name: "production_weight_multiplier", label: "Multiplicador Peso", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Repasse Logística",
      fields: [
        { name: "logistics_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Margem Reserva",
      fields: [
        { name: "reserve_margin_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "reserve_margin_transfer_multiplier", label: "Multiplicador Repasse", type: "number", step: "0.001" },
      ]
    },
    {
      title: "GFP + MKT",
      fields: [
        { name: "gfp_mkt_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "gfp_mkt_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Fiscal / Tributário",
      fields: [
        { name: "fiscal_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Cobrar",
      fields: [
        { name: "charge_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "charge_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Agenda",
      fields: [
        { name: "schedule_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "schedule_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Dificuldade & Insumos",
      fields: [
        { name: "difficulty_fixed_value", label: "Dificuldade Valor Fixo", type: "number", step: "0.01" },
        { name: "ingredient_cost_days_division", label: "Custo Insumos Divisão Dias", type: "number", step: "1" },
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-primary" />
          {t("settings")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("settings_desc")}
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Aviso Importante:</strong> Alterar estes multiplicadores e valores fixos afetará diretamente o cálculo de preços das novas receitas e orçamentos de clientes. Tenha cautela ao ajustar estes valores.
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      step={field.step}
                      {...register(field.name as keyof GeneralSettings, { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors[field.name as keyof GeneralSettings] && (
                      <span className="text-xs text-destructive mt-1">
                        Campo inválido.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end sticky bottom-6 bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2"
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar Configurações
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
