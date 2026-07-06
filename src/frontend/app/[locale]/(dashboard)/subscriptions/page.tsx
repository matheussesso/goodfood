"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSubscriptions, Subscription } from "@/hooks/useSubscriptions";
import { usePets } from "@/hooks/usePets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  CalendarCheck,
  RefreshCw,
  Dog,
  Cat,
  UtensilsCrossed,
  Loader2,
  Clock,
  PauseCircle,
  PlayCircle,
  XCircle,
  Search,
  Filter,
  FilterX,
  Repeat2,
  Package,
  DollarSign,
  CalendarDays,
  Plus,
  X,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/ui/view-mode-toggle";

type SubStatus = "active" | "paused" | "cancelled";

/** Cycle intervals offered in the creation form — multiples of 7, minimum 14. */
const INTERVAL_OPTIONS = [14, 21, 28, 35, 42];

const STATUS_STYLE: Record<SubStatus, { badge: string; dot: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400" },
};

/**
 * Customer-facing subscriptions page.
 * Lets the customer create a new subscription (pet + ordered recipe rotation + cycle
 * interval), lists all their subscriptions, and allows pausing, resuming, or cancelling.
 * Supports card and list view modes.
 *
 * @returns The subscriptions management page element.
 */
export default function SubscriptionsPage() {
  const t = useTranslations("Subscriptions");
  const tCommon = useTranslations("Common");

  const { subscriptions, isLoading, createSubscription, isCreating, updateSubscription, isUpdating } = useSubscriptions();
  const { pets } = usePets();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [rotationRecipeIds, setRotationRecipeIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [intervalDays, setIntervalDays] = useState(14);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = (subscriptions ?? []).filter((s) => {
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.pet?.name?.toLowerCase().includes(q) ||
      s.recipes?.some((r) => r.name?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const hasSubscriptions = !!(subscriptions && subscriptions.length > 0);
  const hasFilters = search !== "" || statusFilter !== "all";

  const selectedPet = pets?.find((p) => p.id === selectedPetId);
  const petRecipeOptions = (selectedPet?.recipes ?? []).filter((r) => !r.is_template);

  const firstDeliveryPreview = useMemo(() => {
    if (!startDate) return null;
    const date = new Date(`${startDate}T00:00:00`);
    date.setDate(date.getDate() + intervalDays);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }, [startDate, intervalDays]);

  /** Resets the creation form to its default state. */
  function resetForm() {
    setSelectedPetId(null);
    setRotationRecipeIds([]);
    setStartDate(new Date().toISOString().slice(0, 10));
    setIntervalDays(14);
    setFormError(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function addRecipeToRotation(recipeId: number) {
    setRotationRecipeIds((prev) => [...prev, recipeId]);
  }

  function removeRecipeFromRotation(index: number) {
    setRotationRecipeIds((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Submits the new subscription form.
   *
   * @param e - The form submit event.
   */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!selectedPetId) {
      setFormError(t("select_pet"));
      return;
    }
    if (rotationRecipeIds.length === 0) {
      setFormError(t("min_one_recipe_error"));
      return;
    }

    try {
      await createSubscription({
        pet_id: selectedPetId,
        recipe_ids: rotationRecipeIds,
        start_date: startDate,
        interval_days: intervalDays,
      });
      setIsModalOpen(false);
      setFeedback({ type: "success", message: t("subscription_created_success") });
    } catch {
      setFormError(t("invalid_interval_error"));
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  /**
   * Updates a subscription's status and shows a feedback banner.
   *
   * @param sub - The subscription to update.
   * @param status - The new status to set.
   */
  async function handleStatusChange(sub: Subscription, status: SubStatus) {
    if (status === "cancelled" && !confirm(t("cancel_confirm"))) return;
    setUpdatingId(sub.id);
    try {
      await updateSubscription({ id: sub.id, status });
      setFeedback({ type: "success", message: t("status_updated") });
    } catch {
      setFeedback({ type: "error", message: t("error_update") });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  const viewToggleLabels = { grid: tCommon("grid"), list: tCommon("list") };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          {t("create_subscription")}
        </Button>
      </div>

      {/* ── Feedback banner ────────────────────────────────────────── */}
      {feedback && (
        <div className={cn(
          "px-4 py-3 rounded-lg text-sm font-medium border",
          feedback.type === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        )}>
          {feedback.message}
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {(["all", "active", "paused", "cancelled"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setStatusFilter(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                statusFilter === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {v === "all" ? t("all_statuses") : t(`status_${v}` as `status_${SubStatus}`)}
            </button>
          ))}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="gap-1.5 text-muted-foreground h-8"
            >
              <FilterX className="w-3.5 h-3.5" />
              {tCommon("clear_filters")}
            </Button>
          )}
        </div>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} />
      </div>

      {/* ── Mobile view toggle ─────────────────────────────────────── */}
      <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} mobile />

      {/* ── Results count ──────────────────────────────────────────── */}
      {hasSubscriptions && (
        <p className="text-sm text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? t("subscriptions_found_singular") : t("subscriptions_found_plural")}
        </p>
      )}

      {/* ── Content ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground bg-card border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">{tCommon("loading")}</span>
        </div>
      ) : !hasSubscriptions ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("no_subscriptions")}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{t("no_subscriptions_desc")}</p>
          </div>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("create_subscription")}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-xl gap-3 text-center px-6">
          <p className="font-semibold text-foreground">{tCommon("no_results")}</p>
          {hasFilters && <p className="text-sm text-muted-foreground">{tCommon("adjust_filters")}</p>}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              t={t}
              isUpdating={updatingId === sub.id && isUpdating}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-border/50">
            {filtered.map((sub) => (
              <SubscriptionRow
                key={sub.id}
                sub={sub}
                t={t}
                isUpdating={updatingId === sub.id && isUpdating}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Create subscription modal ─────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("create_subscription")}
        className="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Pet selection */}
          <div className="space-y-2">
            <Label htmlFor="sub_pet">{t("select_pet")}</Label>
            <select
              id="sub_pet"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedPetId ?? ""}
              onChange={(e) => {
                setSelectedPetId(e.target.value ? Number(e.target.value) : null);
                setRotationRecipeIds([]);
              }}
            >
              <option value="">{t("select_pet")}</option>
              {(pets ?? []).map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>

          {/* Recipe rotation builder */}
          {selectedPetId && (
            <div className="space-y-2">
              <Label>{t("select_recipes")}</Label>
              <p className="text-xs text-muted-foreground">{t("rotation_hint")}</p>

              {petRecipeOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">—</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {petRecipeOptions.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => addRecipeToRotation(recipe.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
                      {recipe.name}
                    </button>
                  ))}
                </div>
              )}

              {rotationRecipeIds.length > 0 && (
                <div className="border rounded-lg divide-y divide-border/50 mt-2">
                  {rotationRecipeIds.map((recipeId, index) => {
                    const recipe = petRecipeOptions.find((r) => r.id === recipeId);
                    return (
                      <div key={`${recipeId}-${index}`} className="flex items-center gap-2 px-3 py-2">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="text-xs font-semibold text-primary shrink-0">
                          {t("rotation_order", { n: String(index + 1) })}
                        </span>
                        <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                          {recipe?.name ?? `#${recipeId}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRecipeFromRotation(index)}
                          title={t("remove_recipe")}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Start date + interval */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub_start_date">{t("start_date_label")}</Label>
              <Input
                id="sub_start_date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_interval">{t("interval_days_label")}</Label>
              <select
                id="sub_interval"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={intervalDays}
                onChange={(e) => setIntervalDays(Number(e.target.value))}
              >
                {INTERVAL_OPTIONS.map((days) => (
                  <option key={days} value={days}>{days}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">{t("interval_days_hint")}</p>
            </div>
          </div>

          {firstDeliveryPreview && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              {t("first_delivery_preview", { date: firstDeliveryPreview, days: String(intervalDays) })}
            </p>
          )}

          {formError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {tCommon("save")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface SubscriptionCardProps {
  sub: Subscription;
  t: ReturnType<typeof useTranslations>;
  isUpdating: boolean;
  onStatusChange: (sub: Subscription, status: SubStatus) => void;
}

/**
 * Renders the ordered recipe rotation as a compact chip list.
 *
 * @param recipes - The subscription's recipe rotation, ordered by pivot.position.
 * @param t - Subscriptions namespace translator.
 * @returns The rotation chip list element.
 */
function RotationChips({ recipes, t }: { recipes: Subscription["recipes"]; t: ReturnType<typeof useTranslations> }) {
  const ordered = [...(recipes ?? [])].sort((a, b) => (a.pivot?.position ?? 0) - (b.pivot?.position ?? 0));

  if (ordered.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ordered.map((recipe, index) => (
        <span
          key={`${recipe.id}-${index}`}
          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
        >
          {t("rotation_order", { n: String(index + 1) })}: {recipe.name}
        </span>
      ))}
    </div>
  );
}

/**
 * Card displaying a single subscription with full details: pet, recipe rotation, cadence,
 * estimated price, orders count, last order date, next delivery date and action buttons.
 *
 * @param sub - The subscription data.
 * @param t - Subscriptions namespace translator.
 * @param isUpdating - Whether an update is in progress for this card.
 * @param onStatusChange - Callback to update subscription status.
 * @returns A subscription card element.
 */
function SubscriptionCard({ sub, t, isUpdating, onStatusChange }: SubscriptionCardProps) {
  const status = sub.status as SubStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;

  // Lazy initial state is the documented escape hatch for reading impure
  // values (Date.now()) once per mount instead of on every render.
  const [now] = useState(() => Date.now());

  const nextDate = sub.next_delivery_date
    ? new Date(sub.next_delivery_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const daysUntilNext = sub.next_delivery_date
    ? Math.max(0, Math.ceil((new Date(sub.next_delivery_date).getTime() - now) / 86_400_000))
    : null;

  const startDate = sub.start_date
    ? new Date(sub.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const lastOrderDate = sub.orders_max_created_at
    ? new Date(sub.orders_max_created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const estimatedPrice = sub.estimated_price ?? 0;

  return (
    <div className={cn(
      "bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/30 transition-colors flex flex-col",
      status === "cancelled" && "opacity-60"
    )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PetIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm line-clamp-1">{sub.pet?.name ?? "—"}</p>
              <div className="mt-0.5">
                <RotationChips recipes={sub.recipes} t={t} />
              </div>
            </div>
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
            style.badge
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
            {t(`status_${status}` as `status_${SubStatus}`)}
          </span>
        </div>

        {/* Price + cadence */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground">{t("per_cycle")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat2 className="w-3 h-3 shrink-0" />
            <span className="font-medium">{t("cadence_label", { days: String(sub.interval_days) })}</span>
          </div>
        </div>
      </div>

      {/* ── Info grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 p-4 flex-1">
        {/* Next delivery */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3" /> {t("next_delivery")}
          </p>
          {nextDate && status !== "cancelled" ? (
            <div>
              <p className="text-xs font-medium text-foreground">{nextDate}</p>
              {daysUntilNext !== null && (
                <p className="text-[10px] text-muted-foreground">{daysUntilNext} {t("days_until_next")}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>

        {/* Orders count */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Package className="w-3 h-3" /> {t("total_orders")}
          </p>
          <p className="text-xs font-medium text-foreground">
            {sub.orders_count ?? 0} {t("orders_delivered")}
          </p>
          {lastOrderDate && (
            <p className="text-[10px] text-muted-foreground">{t("last_order")}: {lastOrderDate}</p>
          )}
        </div>

        {/* Start date */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> {t("start_date")}
          </p>
          <p className="text-xs font-medium text-foreground">{startDate ?? "—"}</p>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────── */}
      {status !== "cancelled" && (
        <div className="flex items-center gap-2 px-4 pb-4">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
          ) : status === "active" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "paused")}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                {t("pause_subscription")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "cancelled")}
              >
                <XCircle className="w-3.5 h-3.5" />
                {t("cancel_subscription")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "active")}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                {t("resume_subscription")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "cancelled")}
              >
                <XCircle className="w-3.5 h-3.5" />
                {t("cancel_subscription")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact list row for a single subscription in list view mode.
 * Shows pet, recipe rotation, price, cadence, next delivery and action icons.
 *
 * @param sub - The subscription data.
 * @param t - Subscriptions namespace translator.
 * @param isUpdating - Whether an update is in progress for this row.
 * @param onStatusChange - Callback to update subscription status.
 * @returns A subscription list row element.
 */
function SubscriptionRow({ sub, t, isUpdating, onStatusChange }: SubscriptionCardProps) {
  const status = sub.status as SubStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;
  const estimatedPrice = sub.estimated_price ?? 0;

  const nextDate = sub.next_delivery_date
    ? new Date(sub.next_delivery_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const lastOrderDate = sub.orders_max_created_at
    ? new Date(sub.orders_max_created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors",
      status === "cancelled" && "opacity-60"
    )}>
      {/* Pet avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <PetIcon className="w-4 h-4" />
      </div>

      {/* Pet + recipe rotation + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground line-clamp-1">{sub.pet?.name ?? "—"}</span>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
            style.badge
          )}>
            <span className={cn("w-1 h-1 rounded-full", style.dot)} />
            {t(`status_${status}` as `status_${SubStatus}`)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <RotationChips recipes={sub.recipes} t={t} />
          <span className="flex items-center gap-1 shrink-0 text-amber-600 dark:text-amber-400 font-semibold">
            R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Repeat2 className="w-3 h-3" />{t("cadence_label", { days: String(sub.interval_days) })}
          </span>
          {status !== "cancelled" && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />{nextDate}
            </span>
          )}
          {lastOrderDate && (
            <span className="flex items-center gap-1 shrink-0 text-muted-foreground/70">
              <Package className="w-3 h-3" />{sub.orders_count ?? 0} • {t("last_order")}: {lastOrderDate}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {status !== "cancelled" && (
        <div className="flex items-center gap-1 shrink-0">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : status === "active" ? (
            <>
              <button
                type="button"
                title={t("pause_subscription")}
                onClick={() => onStatusChange(sub, "paused")}
                className="p-1.5 rounded text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                title={t("cancel_subscription")}
                onClick={() => onStatusChange(sub, "cancelled")}
                className="p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                title={t("resume_subscription")}
                onClick={() => onStatusChange(sub, "active")}
                className="p-1.5 rounded text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                title={t("cancel_subscription")}
                onClick={() => onStatusChange(sub, "cancelled")}
                className="p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
