"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePet, usePets } from "@/hooks/usePets";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Dog,
  Cat,
  Loader2,
  UtensilsCrossed,
  Package,
  Calendar,
  Eye,
  Edit2,
  Plus,
  ShoppingBag,
  Scale,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";

/** Generates a deterministic HSL color from a string. */
function nameToHsl(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 60%, 42%)`;
}

/**
 * Admin pet profile page.
 * Shows the full pet profile for a customer's pet, with edit capability.
 *
 * @returns The admin pet profile page element.
 */
export default function AdminPetProfilePage() {
  const params = useParams();
  const customerId = params.id as string;
  const petId      = params.petId as string;

  const t       = useTranslations("Pets");
  const tCommon = useTranslations("Common");
  const tCat    = useTranslations("Catalog");
  const tRec    = useTranslations("Recipes");
  const tAdmin  = useTranslations("admin");

  const queryClient = useQueryClient();
  const { pet, isLoading } = usePet(petId);
  const { updatePet, isUpdating } = usePets();

  const [activeTab, setActiveTab] = useState<"overview" | "recipes" | "orders">("overview");

  // ── Edit modal ────────────────────────────────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [petForm, setPetForm]       = useState({
    name: "", type: "dog", breed: "", weight: "", age: "",
    restrictions: "", allergies: "", special_needs: "",
  });
  const [editError, setEditError] = useState("");

  function openEdit() {
    if (!pet) return;
    setPetForm({
      name:          pet.name,
      type:          pet.type         || "dog",
      breed:         pet.breed        || "",
      weight:        pet.weight       ? String(pet.weight) : "",
      age:           pet.age          ? String(pet.age)    : "",
      restrictions:  pet.restrictions || "",
      allergies:     pet.allergies    || "",
      special_needs: pet.special_needs || "",
    });
    setEditError("");
    setIsEditOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!pet) return;
    setEditError("");
    try {
      await updatePet({
        id:            pet.id,
        name:          petForm.name,
        type:          petForm.type as "dog" | "cat",
        breed:         petForm.breed        || undefined,
        weight:        petForm.weight       ? parseFloat(petForm.weight)    : undefined,
        age:           petForm.age          ? parseInt(petForm.age, 10)     : undefined,
        restrictions:  petForm.restrictions  || undefined,
        allergies:     petForm.allergies     || undefined,
        special_needs: petForm.special_needs || undefined,
        user_id:       Number(customerId),
      });
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      setIsEditOpen(false);
    } catch (err) {
      setEditError(getApiErrorMessage(err, "Erro ao salvar pet."));
    }
  }

  // ── Loading / not found ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">{tCommon("loading")}</span>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Dog className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <p className="text-destructive text-sm">{t("pet_not_found")}</p>
        <Link href={`/admin/customers/${customerId}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Cliente
          </Button>
        </Link>
      </div>
    );
  }

  const isDog        = pet.type === "dog";
  const PetIcon      = isDog ? Dog : Cat;
  const avatarBg     = nameToHsl(pet.name);
  const speciesLabel = isDog ? t("dog") : t("cat");

  const statusColors: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };
  const statusLabel: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado",
    delivered: "Entregue", cancelled: "Cancelado",
  };

  return (
    <div className="space-y-6">
      {/* ── Profile header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link
          href={`/admin/customers/${customerId}`}
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0 mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6">
            {/* Avatar */}
            {pet.photo_url ? (
              <Image
                src={pet.photo_url}
                alt={pet.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover border-4 border-border shrink-0 shadow-md"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white shrink-0 shadow-md"
                style={{ backgroundColor: avatarBg }}
              >
                <PetIcon className="w-8 h-8" />
              </div>
            )}

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{pet.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">
                  {speciesLabel}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                  ID: {pet.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {pet.breed && (
                  <span className="flex items-center gap-1.5">
                    <Dog className="w-3.5 h-3.5" /> {pet.breed}
                  </span>
                )}
                {pet.age && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {pet.age} {t("age_months").toLowerCase()}
                  </span>
                )}
                {pet.weight && (
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> {pet.weight} kg
                  </span>
                )}
              </div>

              {/* Breadcrumb to customer */}
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <Link
                  href={`/admin/customers/${customerId}`}
                  className="hover:text-primary transition-colors"
                >
                  Ver perfil do cliente
                </Link>
              </div>

              {/* Health alert badges */}
              {(pet.allergies || pet.restrictions || pet.special_needs) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pet.allergies && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">
                      {t("badge_allergies")}
                    </span>
                  )}
                  {pet.restrictions && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium border border-amber-200 dark:border-amber-800">
                      {t("badge_restrictions")}
                    </span>
                  )}
                  {pet.special_needs && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                      {t("badge_special_needs")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick-stats + edit */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <Button onClick={openEdit} variant="outline" size="sm" className="gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Editar Pet
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                  <span className="font-bold text-xl leading-none">{pet.recipes?.length ?? 0}</span>
                  <span className="text-[10px] uppercase tracking-wider mt-0.5">{t("recipes")}</span>
                </div>
                <div className="flex flex-col items-center px-4 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                  <span className="font-bold text-xl leading-none">{pet.orders?.length ?? 0}</span>
                  <span className="text-[10px] uppercase tracking-wider mt-0.5">{t("orders")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex space-x-1 border-b">
        {(["overview", "recipes", "orders"] as const).map((tab) => {
          const counts: Record<string, number | undefined> = {
            recipes: pet.recipes?.length,
            orders:  pet.orders?.length,
          };
          const label =
            tab === "overview" ? t("pet_details") :
            tab === "recipes"  ? t("recipes") : t("orders");
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
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
        {/* ── Overview tab ────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Breed & traits card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center px-5 py-4 border-b bg-muted/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <PetIcon className="w-4 h-4 text-primary" /> {t("breed_and_traits")}
                </h3>
              </div>
              <div className="divide-y divide-border/50">
                {[
                  { label: t("breed"),      value: pet.breed  || t("no_breed") },
                  { label: t("species"),    value: speciesLabel },
                  { label: t("age_months"), value: pet.age    ? `${pet.age} meses` : "—" },
                  { label: t("weight_kg"),  value: pet.weight ? `${pet.weight} kg` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1 flex justify-between items-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health alerts card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center px-5 py-4 border-b bg-muted/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> {t("alerts_and_needs")}
                </h3>
              </div>
              <div className="px-5 py-4 space-y-4">
                {[
                  {
                    label: t("dietary_restrictions"),
                    value: pet.restrictions,
                    empty: t("no_restrictions_registered"),
                    cls: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200",
                  },
                  {
                    label: t("allergies"),
                    value: pet.allergies,
                    empty: t("no_allergies_registered"),
                    cls: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200",
                  },
                  {
                    label: t("special_needs"),
                    value: pet.special_needs,
                    empty: t("no_special_needs_registered"),
                    cls: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200",
                  },
                ].map(({ label, value, empty, cls }) => (
                  <div key={label} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className={cn("text-sm p-3 rounded-lg border", value ? cls : "bg-muted/30 border-border text-muted-foreground")}>
                      {value || empty}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Recipes tab ─────────────────────────────────────────────── */}
        {activeTab === "recipes" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{pet.recipes?.length || 0}</span>{" "}
                receita{(pet.recipes?.length || 0) !== 1 ? "s" : ""} vinculada{(pet.recipes?.length || 0) !== 1 ? "s" : ""}
              </p>
              <Link href={`/recipes/new?user_id=${customerId}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Nova Receita
                </Button>
              </Link>
            </div>

            {pet.recipes && pet.recipes.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pet.recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/50 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="p-4 pb-3 border-b border-border/50 bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link href={`/recipes/${recipe.id}`} className="hover:text-primary transition-colors">
                            <h4 className="font-semibold text-base line-clamp-1">{recipe.name}</h4>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 min-h-[2.5rem]">
                            {recipe.description || tRec("no_description")}
                          </p>
                        </div>
                        {recipe.is_template && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-muted text-muted-foreground rounded-sm shrink-0">
                            Modelo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex divide-x divide-border/50 border-b border-border/50">
                      <div className="flex-1 py-2.5 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tCat("duration")}</span>
                        <span className="text-sm font-semibold text-foreground">{recipe.duration_days ?? "—"}d</span>
                      </div>
                      <div className="flex-1 py-2.5 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ingred.</span>
                        <span className="text-sm font-semibold text-foreground">{recipe.ingredients?.length ?? 0}</span>
                      </div>
                      <div className="flex-1 py-2.5 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Custo Est.</span>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          R$ {Number(recipe.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 p-3 mt-auto">
                      <Link href={`/recipes/${recipe.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          <Eye className="w-3.5 h-3.5" /> {tCommon("view")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <UtensilsCrossed className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">{t("no_recipes_linked")}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Orders tab ──────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{pet.orders?.length || 0}</span>{" "}
                pedido{(pet.orders?.length || 0) !== 1 ? "s" : ""} realizado{(pet.orders?.length || 0) !== 1 ? "s" : ""}
              </p>
            </div>

            {pet.orders && pet.orders.length > 0 ? (
              <div className="space-y-3">
                {pet.orders.map((order) => {
                  const colorClass = statusColors[order.status] ?? "bg-muted text-muted-foreground border-border";
                  return (
                    <div
                      key={order.id}
                      className="bg-card border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">Pedido #{order.id}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                              {statusLabel[order.status] ?? order.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Package className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">{t("no_orders")}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar Pet: ${pet.name}`}>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                required
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Espécie</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={petForm.type}
                onChange={(e) => setPetForm({ ...petForm, type: e.target.value })}
              >
                <option value="dog">Cachorro</option>
                <option value="cat">Gato</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Raça</Label>
              <Input
                value={petForm.breed}
                onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Idade (meses)</Label>
              <Input
                type="number"
                min="0"
                value={petForm.age}
                onChange={(e) => setPetForm({ ...petForm, age: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={petForm.weight}
                onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Restrições Alimentares</Label>
            <textarea
              className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={petForm.restrictions}
              onChange={(e) => setPetForm({ ...petForm, restrictions: e.target.value })}
              placeholder="Sem farinha de trigo, etc..."
            />
          </div>
          <div className="space-y-2">
            <Label>Alergias</Label>
            <textarea
              className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={petForm.allergies}
              onChange={(e) => setPetForm({ ...petForm, allergies: e.target.value })}
              placeholder="Frango, corantes..."
            />
          </div>
          <div className="space-y-2">
            <Label>Necessidades Especiais</Label>
            <textarea
              className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={petForm.special_needs}
              onChange={(e) => setPetForm({ ...petForm, special_needs: e.target.value })}
              placeholder="Diabético, cego..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {tAdmin("save_pet")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
