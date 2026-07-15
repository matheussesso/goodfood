"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useCustomer } from "@/hooks/useCustomers";
import { getRoleMeta } from "@/lib/user-roles";
import { Pet } from "@/hooks/usePets";
import { Recipe } from "@/hooks/useRecipes";
import { Order, OrderItem } from "@/hooks/useOrders";
import { Subscription } from "@/hooks/useSubscriptions";
import { EditCustomerModal } from "@/features/admin-customers/components/EditCustomerModal";
import { PetFormModal } from "@/features/admin-customers/components/PetFormModal";
import { RecipeEditModal } from "@/features/admin-customers/components/RecipeEditModal";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, User, Phone, Mail, Calendar, Package, CalendarDays, Edit2, Loader2, Plus,
  Dog, Cat, UtensilsCrossed, MapPin, LayoutGrid, List as ListIcon, ChevronRight,
  ShoppingBag, ChevronDown, ChevronUp, CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Returns two uppercase initials from a full name. */
function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

/** Generates a deterministic HSL color from a string. */
function nameToHsl(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 60%, 42%)`;
}

const ORDER_STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  pending_payment:  { badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800", dot: "bg-orange-400" },
  pending:          { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",       dot: "bg-amber-400" },
  in_production:    { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",             dot: "bg-blue-400" },
  ready:            { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800", dot: "bg-violet-400" },
  out_for_delivery: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",                  dot: "bg-sky-400" },
  delivered:        { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  cancelled:        { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                   dot: "bg-red-400" },
};

const SUB_STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400" },
};

interface TabProps {
  t: ReturnType<typeof useTranslations>;
}

/**
 * Compact pet card matching the customer-facing `/pets` card design —
 * icon-avatar header, stat strip, health badges, footer link.
 */
function AdminPetCard({ pet, customerId, onEdit, t, tPets, tCat }: {
  pet: Pet;
  customerId: number;
  onEdit: (pet: Pet) => void;
} & TabProps & { tPets: ReturnType<typeof useTranslations>; tCat: ReturnType<typeof useTranslations> }) {
  const PetIcon = pet.type === "cat" ? Cat : Dog;
  const hasAlerts = !!(pet.allergies || pet.restrictions || pet.special_needs);

  return (
    <div className="group bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PetIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight truncate">{pet.name}</h4>
              <span className="text-[11px] text-muted-foreground truncate block">{pet.breed || t("no_breed_admin")}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => onEdit(pet)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30 rounded-lg">
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tPets("species")}</span>
            <span className="font-medium text-xs truncate block">{pet.type === "cat" ? tCat("cat") : tCat("dog")}</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tPets("weight").split(" ")[0]}</span>
            <span className="font-medium text-xs truncate block">{pet.weight ? `${pet.weight}kg` : "—"}</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tPets("age")}</span>
            <span className="font-medium text-xs truncate block">{pet.age ? `${pet.age}m` : "—"}</span>
          </div>
        </div>

        {hasAlerts && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {pet.allergies && <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">{tPets("badge_allergies")}</span>}
            {pet.restrictions && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium border border-amber-200 dark:border-amber-800">{tPets("badge_restrictions")}</span>}
            {pet.special_needs && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">{tPets("badge_special_needs")}</span>}
          </div>
        )}

        <Link
          href={`/admin/customers/${customerId}/pets/${pet.id}`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
        >
          {t("view_details")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Compact recipe card matching the customer-facing `/recipes` card design —
 * stat strip, collapsed ingredient composition accordion, footer link.
 */
function AdminRecipeCard({ recipe, onEdit, tRec, tCat, tCommon }: {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  tRec: ReturnType<typeof useTranslations>;
  tCat: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight truncate" title={recipe.name}>{recipe.name}</h4>
              <span className="text-[11px] text-muted-foreground truncate block">{recipe.description || tRec("no_description")}</span>
            </div>
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {!recipe.is_template && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(recipe)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-border/50 bg-muted/30 rounded-lg">
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("pet_type")}</span>
            <span className="font-medium text-xs truncate block">{recipe.pet_type === "cat" ? tCat("cat") : recipe.pet_type === "dog" ? tCat("dog") : tCommon("all")}</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tCat("duration")}</span>
            <span className="font-medium text-xs truncate block">{recipe.duration_days ?? "—"}d</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("portions_per_day_caps").split("/")[0]}</span>
            <span className="font-medium text-xs truncate block">{recipe.daily_portions ?? "—"}x</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("estimated_cost")}</span>
            <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate block">
              R$ {Number(recipe.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              <span>{tRec("recipe_composition")} ({recipe.ingredients.length})</span>
              {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                {recipe.ingredients.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-muted-foreground truncate flex-1">{i.name}</span>
                    <span className="font-medium shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">{i.pivot.quantity} {i.pivot.unit || i.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Link
          href={`/recipes/${recipe.id}`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
        >
          {tCommon("view")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Compact order card matching the admin `/admin/orders` card design — status
 * badge, stat strip, collapsed items accordion, footer link to order detail.
 */
function AdminOrderCard({ order, t }: { order: Order } & TabProps) {
  const [expanded, setExpanded] = useState(false);
  const style = ORDER_STATUS_STYLE[order.status] ?? ORDER_STATUS_STYLE.pending;
  const items = order.items ?? [];
  const hasItems = items.length > 0;
  const itemCount = hasItems ? items.length : order.recipe ? 1 : 0;

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight truncate">{t("order_number")}{order.id}</h4>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0", style.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
            {t(`status_${order.status}` as "status_pending")}
          </span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-border/50 bg-muted/30 rounded-lg">
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("total")}</span>
            <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate block">
              R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("items_count")}</span>
            <span className="font-medium text-xs truncate block">{itemCount}</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            <span>{t("order_items_label")} ({itemCount})</span>
            {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {hasItems ? (
                items.map((item: OrderItem) => (
                  <div key={item.id} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-muted-foreground truncate flex-1">{item.recipe?.name ?? `#${item.recipe_id}`}</span>
                    <span className="font-medium shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground italic">{order.recipe?.name ?? "—"}</span>
              )}
            </div>
          )}
        </div>

        <Link
          href={`/admin/orders/${order.id}`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
        >
          {t("view_detail")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Compact subscription card matching the customer-facing `/subscriptions`
 * card design — duration/weeks/cost stat strip, weekly recipes accordion,
 * footer link to the subscription detail page.
 */
function AdminSubscriptionCard({ subscription, t }: { subscription: Subscription } & TabProps) {
  const [expanded, setExpanded] = useState(false);
  const style = SUB_STATUS_STYLE[subscription.status] ?? SUB_STATUS_STYLE.active;
  const orderedRecipes = [...(subscription.recipes ?? [])].sort((a, b) => (a.pivot?.position ?? 0) - (b.pivot?.position ?? 0));

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight truncate">{subscription.pet?.name ?? "—"}</h4>
              <span className="text-[11px] text-muted-foreground truncate block">
                {new Date(subscription.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0", style.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
            {t(`status_${subscription.status}` as "status_active")}
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30 rounded-lg">
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("duration_days")}</span>
            <span className="font-medium text-xs truncate block">{subscription.duration_days}d</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("total_cycles_label")}</span>
            <span className="font-medium text-xs truncate block">{subscription.total_cycles ?? "—"}</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("estimated_price")}</span>
            <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate block">
              R$ {(subscription.estimated_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            <span>{t("select_recipes")} ({orderedRecipes.length})</span>
            {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
              {orderedRecipes.map((recipe, index) => (
                <li key={`${recipe.id}-${index}`} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="text-muted-foreground shrink-0">{t("rotation_order", { n: String(index + 1) })}</span>
                  <span className="text-foreground truncate flex-1 text-right">{recipe.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href={`/subscriptions/${subscription.id}`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
        >
          {t("view_detail")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Admin user detail page: profile header (with role badge), and
 * overview/pets/recipes/orders/subscriptions tabs. Modals for editing the
 * user, their pets and their recipes live in features/admin-customers/components.
 */
export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const t = useTranslations("admin");
  const tOrders = useTranslations("Orders");
  const tSubs = useTranslations("Subscriptions");
  const tCat = useTranslations("Catalog");
  const tRec = useTranslations("Recipes");
  const tPets = useTranslations("Pets");
  const tCommon = useTranslations("Common");

  const { customer, isLoading } = useCustomer(id);

  const [activeTab, setActiveTab] = useState<"overview" | "pets" | "recipes" | "orders" | "subscriptions">("overview");
  const [petsViewMode, setPetsViewMode] = useState<"grid" | "list">("grid");
  const [recipesViewMode, setRecipesViewMode] = useState<"grid" | "list">("grid");

  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [isRecEditModalOpen, setIsRecEditModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-destructive">{t("customer_not_found")}</div>;
  }

  const handleOpenPetModal = (pet?: Pet) => {
    setEditingPet(pet ?? null);
    setIsPetModalOpen(true);
  };

  const handleOpenRecEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsRecEditModalOpen(true);
  };

  const avatarBg = nameToHsl(customer.name);
  const initials = getInitials(customer.name);
  const roleMeta = getRoleMeta(customer.role);

  return (
    <div className="space-y-6">
      {/* ── Profile header ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/customers"
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0 mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border", roleMeta.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", roleMeta.dot)} />
                  {t(roleMeta.labelKey)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  ID: {customer.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {customer.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {t("since_label")} {new Date(customer.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Quick-stats chips */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                <span className="font-bold text-xl leading-none">{customer.pets?.length ?? customer.pets_count ?? 0}</span>
                <span className="text-[10px] uppercase tracking-wider mt-0.5">{t("pets")}</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                <span className="font-bold text-xl leading-none">{customer.orders?.length ?? customer.orders_count ?? 0}</span>
                <span className="text-[10px] uppercase tracking-wider mt-0.5">{t("orders")}</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2 bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 rounded-xl">
                <span className="font-bold text-xl leading-none">{customer.subscriptions?.length ?? 0}</span>
                <span className="text-[10px] uppercase tracking-wider mt-0.5">{t("subscriptions")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex space-x-1 border-b overflow-x-auto">
        {(["overview", "pets", "recipes", "orders", "subscriptions"] as const).map((tab) => {
          const counts: Record<string, number | undefined> = {
            pets: customer.pets?.length,
            recipes: customer.recipes?.length,
            orders: customer.orders?.length,
            subscriptions: customer.subscriptions?.length,
          };
          const label =
            tab === "overview" ? t("general") :
            tab === "pets" ? t("pets") :
            tab === "recipes" ? t("recipes") :
            tab === "orders" ? t("orders") : t("subscriptions");
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              }`}
            >
              {label}
              {counts[tab] !== undefined && counts[tab]! > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                  activeTab === tab ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Contact card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> {t("contact_info")}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setIsEditCustomerModalOpen(true)} className="h-8 text-xs gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> {tCommon("edit")}
                </Button>
              </div>
              <div className="divide-y divide-border/50">
                {[
                  { icon: Mail, label: t("email"), value: customer.email },
                  { icon: Phone, label: t("phone"), value: customer.phone || "—" },
                  { icon: Calendar, label: t("registered_at"), value: new Date(customer.created_at).toLocaleDateString("pt-BR") },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> {t("address_title")}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setIsEditCustomerModalOpen(true)} className="h-8 text-xs gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> {tCommon("edit")}
                </Button>
              </div>
              {customer.street || customer.city || customer.state || customer.zipcode ? (
                <div className="divide-y divide-border/50">
                  <div className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("zipcode")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.zipcode || "—"}</p>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 grid grid-cols-3 gap-4">
                    <div className="col-span-2 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("street")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.street || "—"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("addr_number")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.number || "—"}</p>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("addr_complement")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.complement || "—"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("addr_neighborhood")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.neighborhood || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border/50">
                    <div className="px-5 py-3.5 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("city_label")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.city || "—"}</p>
                    </div>
                    <div className="px-5 py-3.5 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("state_label")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.state || "—"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <MapPin className="w-8 h-8 opacity-30" />
                  <p className="text-sm">{t("no_address_registered")}</p>
                  <Button variant="outline" size="sm" onClick={() => setIsEditCustomerModalOpen(true)} className="mt-1 text-xs gap-1.5 h-8">
                    <Plus className="w-3.5 h-3.5" /> {t("add_address")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "pets" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{customer.pets?.length || 0}</span> {tPets("pets_desc")}
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex border rounded-md">
                  <button
                    onClick={() => setPetsViewMode("grid")}
                    className={`p-2 transition-colors ${petsViewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPetsViewMode("list")}
                    className={`p-2 transition-colors ${petsViewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
                <Button onClick={() => handleOpenPetModal()} className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-2" /> {t("add_pet")}
                </Button>
              </div>
            </div>

            {customer.pets && customer.pets.length > 0 ? (
              petsViewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {customer.pets.map((pet) => (
                    <AdminPetCard key={pet.id} pet={pet} customerId={customer.id} onEdit={handleOpenPetModal} t={t} tPets={tPets} tCat={tCat} />
                  ))}
                </div>
              ) : (
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b bg-muted/40 text-xs">
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">{tPets("name")}</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center">{tPets("species")}</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center">{tPets("weight_kg").split(" ")[0]}</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center">{tPets("age")}</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">{tPets("health_alerts")}</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-right">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {customer.pets.map((pet) => (
                          <tr key={pet.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                  {pet.type === "cat" ? <Cat className="w-4 h-4" /> : <Dog className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{pet.name}</p>
                                  <p className="text-xs text-muted-foreground">{pet.breed || t("no_breed_admin")}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">{pet.type === "cat" ? tCat("cat") : tCat("dog")}</td>
                            <td className="px-5 py-3.5 text-center">{pet.weight ? `${pet.weight} kg` : "—"}</td>
                            <td className="px-5 py-3.5 text-center">{pet.age ? `${pet.age}m` : "—"}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap gap-1">
                                {pet.allergies && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-sm">{tPets("badge_allergies")}</span>}
                                {pet.restrictions && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-sm">{tPets("badge_restrictions")}</span>}
                                {pet.special_needs && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm">{tPets("badge_special_needs")}</span>}
                                {!pet.allergies && !pet.restrictions && !pet.special_needs && <span className="text-muted-foreground">—</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/admin/customers/${customer.id}/pets/${pet.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenPetModal(pet)}>
                                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Dog className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">{t("no_pets_for_customer")}</p>
                <Button variant="outline" size="sm" onClick={() => handleOpenPetModal()} className="mt-1 gap-1.5 text-xs h-8">
                  <Plus className="w-3.5 h-3.5" /> {t("add_first_pet")}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "recipes" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{customer.recipes?.length || 0}</span> {tRec("title").toLowerCase()}
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex border rounded-md">
                  <button
                    onClick={() => setRecipesViewMode("grid")}
                    className={`p-2 transition-colors ${recipesViewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRecipesViewMode("list")}
                    className={`p-2 transition-colors ${recipesViewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
                <Link href={`/recipes/new?user_id=${customer.id}`} className="flex-1 sm:flex-none">
                  <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> {tRec("title")}</Button>
                </Link>
              </div>
            </div>

            {customer.recipes && customer.recipes.length > 0 ? (
              recipesViewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {customer.recipes.map((recipe) => (
                    <AdminRecipeCard key={recipe.id} recipe={recipe} onEdit={handleOpenRecEditModal} tRec={tRec} tCat={tCat} tCommon={tCommon} />
                  ))}
                </div>
              ) : (
                <div className="bg-card border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[760px]">
                      <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                        <tr>
                          <th className="px-6 py-3 font-medium">{tRec("recipe_name")}</th>
                          <th className="px-6 py-3 font-medium text-center">{tRec("pet_type")}</th>
                          <th className="px-6 py-3 font-medium text-center">{tCat("duration")}</th>
                          <th className="px-6 py-3 font-medium text-right">{tRec("estimated_cost")}</th>
                          <th className="px-6 py-3 font-medium text-right">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {customer.recipes.map((recipe) => (
                          <tr key={recipe.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="font-semibold text-foreground">{recipe.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] mt-0.5">{recipe.description}</div>
                            </td>
                            <td className="px-6 py-3.5 text-center">{recipe.pet_type === "cat" ? tCat("cat") : recipe.pet_type === "dog" ? tCat("dog") : tCommon("all")}</td>
                            <td className="px-6 py-3.5 text-center">{recipe.duration_days ?? "—"}d</td>
                            <td className="px-6 py-3.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                              R$ {Number(recipe.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <div className="flex gap-1 justify-end">
                                <Link href={`/recipes/${recipe.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4 text-muted-foreground" /></Button>
                                </Link>
                                {!recipe.is_template && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRecEditModal(recipe)}>
                                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <UtensilsCrossed className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">{t("no_recipes_for_customer")}</p>
                <Link href={`/recipes/new?user_id=${customer.id}`}>
                  <Button variant="outline" size="sm" className="mt-1 gap-1.5 text-xs h-8">
                    <Plus className="w-3.5 h-3.5" /> {tRec("title")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{customer.orders?.length || 0}</span> {tOrders("my_orders").toLowerCase()}
              </p>
            </div>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {customer.orders.map((order) => (
                  <AdminOrderCard key={order.id} order={order} t={tOrders} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Package className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">{t("no_orders_for_customer")}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{customer.subscriptions?.length || 0}</span> {tSubs("title").toLowerCase()}
              </p>
            </div>

            {customer.subscriptions && customer.subscriptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {customer.subscriptions.map((subscription) => (
                  <AdminSubscriptionCard key={subscription.id} subscription={subscription} t={tSubs} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <CalendarCheck className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">{t("no_subscriptions_for_customer")}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals are mounted on demand so each opening re-seeds its form
          state from the freshest data (no effect-based syncing). */}
      {isRecEditModalOpen && editingRecipe && (
        <RecipeEditModal
          recipe={editingRecipe}
          customerId={customer.id}
          customerPets={customer.pets ?? []}
          isOpen
          onClose={() => setIsRecEditModalOpen(false)}
        />
      )}

      {isEditCustomerModalOpen && (
        <EditCustomerModal
          customer={customer}
          isOpen
          onClose={() => setIsEditCustomerModalOpen(false)}
        />
      )}

      {isPetModalOpen && (
        <PetFormModal
          customerId={customer.id}
          pet={editingPet}
          isOpen
          onClose={() => setIsPetModalOpen(false)}
        />
      )}
    </div>
  );
}
