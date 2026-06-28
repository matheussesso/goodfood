"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  MapPin,
  UtensilsCrossed,
  Loader2,
  Dog,
  Cat,
  Clock,
  Salad,
  Layers,
  DollarSign,
  Info,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useOrder, OrderItem } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_PIPELINE = [
  "pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

type OrderStatus = (typeof STATUS_PIPELINE)[number] | "cancelled";

const STATUS_STYLE: Record<string, { badge: string; dot: string; bar: string }> = {
  pending:          { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",            dot: "bg-amber-400",   bar: "bg-amber-400" },
  in_production:    { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",                  dot: "bg-blue-400",    bar: "bg-blue-400" },
  ready:            { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",      dot: "bg-violet-400",  bar: "bg-violet-400" },
  out_for_delivery: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",                       dot: "bg-sky-400",     bar: "bg-sky-400" },
  delivered:        { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  cancelled:        { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400",     bar: "bg-red-400" },
};

function progressStep(status: string): number {
  return STATUS_PIPELINE.indexOf(status as (typeof STATUS_PIPELINE)[number]);
}

/**
 * Status badge pill.
 *
 * @param status - Raw status value.
 * @param label - Translated label.
 */
function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

/**
 * Expanded recipe block for the order detail page.
 * Shows recipe name (linked to recipe detail), pet, stats chips, and ingredient tags.
 *
 * @param item - The order item to display.
 */
function RecipeDetailBlock({ item }: { item: OrderItem }) {
  const tCat = useTranslations("Catalog");
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      {/* Name + price row */}
      <Link
        href={`/recipes/${item.recipe_id}`}
        className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors group border-b"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {item.recipe?.name ?? `Receita #${item.recipe_id}`}
            </p>
            {item.pet && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <PetIcon className="w-3 h-3" /> {item.pet.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">
            R$ {Number(item.unit_price).toFixed(2)}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Stats + ingredients */}
      <div className="px-4 py-3 space-y-3">
        {item.recipe && (
          <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
            {item.recipe.duration_days && (
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {item.recipe.duration_days} {tCat("days")}
              </span>
            )}
            {item.recipe.daily_portions && (
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                <Salad className="w-3 h-3" />
                {item.recipe.daily_portions} {tCat("daily_portions").toLowerCase()}
              </span>
            )}
            {item.recipe.ingredients && item.recipe.ingredients.length > 0 && (
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                <Layers className="w-3 h-3" />
                {item.recipe.ingredients.length} {tCat("ingredients").toLowerCase()}
              </span>
            )}
          </div>
        )}

        {item.recipe?.ingredients && item.recipe.ingredients.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {tCat("composition")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.recipe.ingredients.map((ing) => (
                <span
                  key={ing.id}
                  className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                >
                  {ing.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Customer-facing order detail page.
 * Shows status timeline, recipe blocks with ingredients, delivery info and order summary.
 *
 * @returns The order detail page element.
 */
export default function OrderDetailPage() {
  const t = useTranslations("Orders");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { order, isLoading, error } = useOrder(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">{t("loading")}</span>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("order_not_found")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t("order_not_found_desc")}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {tCommon("back")}
        </Button>
      </div>
    );
  }

  const step = progressStep(order.status);
  const isCancelled = order.status === "cancelled";
  const style = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
  const hasItems = !!(order.items && order.items.length > 0);

  return (
    <div className="space-y-6 mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("order_number")}{order.id}
              </h1>
              <StatusBadge status={order.status} label={t(`status_${order.status}` as any)} />
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {t("order_date")}:{" "}
              {new Date(order.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Calendar,
            label: t("order_date"),
            value: new Date(order.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            color: "text-primary bg-primary/10",
          },
          {
            icon: DollarSign,
            label: t("total"),
            value: `R$ ${Number(order.total_price).toFixed(2)}`,
            color: "text-amber-600 bg-amber-500/10",
          },
          {
            icon: UtensilsCrossed,
            label: t("recipe"),
            value: hasItems
              ? `${order.items!.length} ${
                  order.items!.length === 1 ? t("items_count") : t("items_count_plural")
                }`
              : "—",
            color: "text-violet-600 bg-violet-500/10",
          },
          {
            icon: ShoppingBag,
            label: tCommon("status"),
            value: t(`status_${order.status}` as any),
            color: "text-blue-600 bg-blue-500/10",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="font-semibold text-sm text-foreground truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status timeline */}
          {!isCancelled ? (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("order_status_section")}</h3>
              </div>
              <div className="px-5 py-7">
                <div className="flex items-start">
                  {STATUS_PIPELINE.map((s, idx) => {
                    const done = idx < step;
                    const current = idx === step;
                    const sStyle = STATUS_STYLE[s];
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center relative">
                        {/* Connector line (left half + right half) */}
                        {idx > 0 && (
                          <div
                            className={cn(
                              "absolute top-3.5 right-1/2 w-1/2 h-0.5 transition-colors",
                              done || current ? style.bar : "bg-border"
                            )}
                          />
                        )}
                        {idx < STATUS_PIPELINE.length - 1 && (
                          <div
                            className={cn(
                              "absolute top-3.5 left-1/2 w-1/2 h-0.5 transition-colors",
                              done ? style.bar : "bg-border"
                            )}
                          />
                        )}
                        {/* Step circle */}
                        <div
                          className={cn(
                            "relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                            done
                              ? `${sStyle.dot} border-transparent`
                              : current
                              ? "bg-background border-primary"
                              : "bg-background border-border"
                          )}
                        >
                          {done ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : current ? (
                            <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse", sStyle.dot)} />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-border" />
                          )}
                        </div>
                        {/* Label */}
                        <p
                          className={cn(
                            "text-[10px] text-center mt-2 font-medium leading-tight px-1",
                            current
                              ? "text-foreground font-semibold"
                              : done
                              ? "text-muted-foreground"
                              : "text-muted-foreground/40"
                          )}
                        >
                          {t(`status_${s}` as any)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {t("status_cancelled")}
              </p>
            </div>
          )}

          {/* Recipes */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("order_items_label")}</h3>
              {hasItems && (
                <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {order.items!.length}{" "}
                  {order.items!.length === 1 ? t("items_count") : t("items_count_plural")}
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {hasItems ? (
                order.items!.map((item) => <RecipeDetailBlock key={item.id} item={item} />)
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {order.recipe?.name ?? "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Order summary */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("order_summary")}</h3>
            </div>
            <div className="divide-y divide-border/50 text-sm">
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{t("order_date")}</span>
                <span className="font-medium text-foreground text-right">
                  {new Date(order.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{tCommon("status")}</span>
                <StatusBadge status={order.status} label={t(`status_${order.status}` as any)} />
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{t("recipe")}</span>
                <span className="font-medium text-foreground">
                  {hasItems
                    ? `${order.items!.length} ${
                        order.items!.length === 1 ? t("items_count") : t("items_count_plural")
                      }`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-4">
                <span className="font-semibold text-foreground">{t("total")}</span>
                <span className="text-xl font-bold text-primary">
                  R$ {Number(order.total_price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("delivery_address_detail")}</h3>
            </div>
            <div className="px-5 py-4">
              {order.delivery_address ? (
                <p className="text-sm text-foreground leading-relaxed">{order.delivery_address}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("no_delivery_address")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
