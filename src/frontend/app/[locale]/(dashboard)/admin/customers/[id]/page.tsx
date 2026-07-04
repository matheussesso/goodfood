"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useCustomer } from "@/hooks/useCustomers";
import { Pet } from "@/hooks/usePets";
import { Recipe } from "@/hooks/useRecipes";
import { EditCustomerModal } from "@/features/admin-customers/components/EditCustomerModal";
import { PetFormModal } from "@/features/admin-customers/components/PetFormModal";
import { RecipeEditModal } from "@/features/admin-customers/components/RecipeEditModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Mail, Calendar, Package, CalendarDays, Edit2, Loader2, Plus, Dog, UtensilsCrossed, MapPin, LayoutGrid, List as ListIcon, Eye, ShoppingBag } from "lucide-react";

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

/**
 * Admin customer detail page: profile header, overview/pets/recipes/orders
 * tabs, and modals for editing the customer, their pets and their recipes
 * (extracted to features/admin-customers/components).
 */
export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const t = useTranslations("admin");
  const tCat = useTranslations("Catalog");
  const tPets = useTranslations("Pets");

  const { customer, isLoading } = useCustomer(id);

  const [activeTab, setActiveTab] = useState<"overview" | "pets" | "recipes" | "orders">("overview");
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
                  Desde {new Date(customer.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Quick-stats chips */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                <span className="font-bold text-xl leading-none">{customer.pets?.length ?? customer.pets_count ?? 0}</span>
                <span className="text-[10px] uppercase tracking-wider mt-0.5">Pets</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                <span className="font-bold text-xl leading-none">{customer.orders?.length ?? customer.orders_count ?? 0}</span>
                <span className="text-[10px] uppercase tracking-wider mt-0.5">{t("orders")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex space-x-1 border-b">
        {(["overview", "pets", "recipes", "orders"] as const).map((tab) => {
          const counts: Record<string, number | undefined> = {
            pets: customer.pets?.length,
            recipes: customer.recipes?.length,
            orders: customer.orders?.length,
          };
          const label =
            tab === "overview" ? t("general") :
            tab === "pets" ? t("pets") :
            tab === "recipes" ? t("recipes") : t("orders");
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
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Contact card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> {t("contact_info")}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setIsEditCustomerModalOpen(true)} className="h-8 text-xs gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Editar
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
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </Button>
              </div>
              {customer.street || customer.city || customer.state || customer.zipcode ? (
                <div className="divide-y divide-border/50">
                  {/* CEP */}
                  <div className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("zipcode")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.zipcode || "—"}</p>
                    </div>
                  </div>
                  {/* Street + Number */}
                  <div className="px-5 py-3.5 grid grid-cols-3 gap-4">
                    <div className="col-span-2 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t("street")}</p>
                      <p className="text-sm font-medium text-foreground">{customer.street || "—"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Número</p>
                      <p className="text-sm font-medium text-foreground">{customer.number || "—"}</p>
                    </div>
                  </div>
                  {/* Complement + Neighborhood */}
                  <div className="px-5 py-3.5 grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Complemento</p>
                      <p className="text-sm font-medium text-foreground">{customer.complement || "—"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Bairro</p>
                      <p className="text-sm font-medium text-foreground">{customer.neighborhood || "—"}</p>
                    </div>
                  </div>
                  {/* City + State */}
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
            {/* Pets filter bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{customer.pets?.length || 0}</span> pet{(customer.pets?.length || 0) !== 1 ? "s" : ""} cadastrado{(customer.pets?.length || 0) !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex border rounded-md">
                  <button
                    onClick={() => setPetsViewMode("grid")}
                    className={`p-2 transition-colors ${petsViewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                    title="Grade"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPetsViewMode("list")}
                    className={`p-2 transition-colors ${petsViewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                    title="Lista"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.pets.map((pet) => (
                    <div key={pet.id} className="bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group flex flex-col">
                      {/* Pet card header */}
                      <div className="flex items-center gap-3 p-4 pb-0 border-b border-border/50 bg-muted/20">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Dog className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{pet.name}</p>
                          <p className="text-xs text-muted-foreground">{pet.breed || t("no_breed_admin")}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={() => handleOpenPetModal(pet)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Pet stats */}
                      <div className="flex divide-x divide-border/50 border-b border-border/50">
                        <div className="flex-1 py-3 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tPets("species")}</span>
                          <span className="text-sm font-semibold text-foreground">{pet.type === "cat" ? tCat("cat") : tCat("dog")}</span>
                        </div>
                        <div className="flex-1 py-3 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tPets("weight").split(" ")[0]}</span>
                          <span className="text-sm font-semibold text-foreground">{pet.weight ? `${pet.weight} kg` : "—"}</span>
                        </div>
                        <div className="flex-1 py-3 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tPets("age")}</span>
                          <span className="text-sm font-semibold text-foreground">{pet.age ? `${pet.age}m` : "—"}</span>
                        </div>
                      </div>

                      {/* Health badges */}
                      <div className="px-4 py-3">
                        {pet.allergies || pet.restrictions || pet.special_needs ? (
                          <div className="flex flex-wrap gap-1.5">
                            {pet.allergies && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">
                                {tPets("badge_allergies")}
                              </span>
                            )}
                            {pet.restrictions && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium border border-amber-200 dark:border-amber-800">
                                {tPets("badge_restrictions")}
                              </span>
                            )}
                            {pet.special_needs && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                                {tPets("badge_special_needs")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{tPets("no_health_alerts")}</span>
                        )}
                      </div>

                      {/* Footer actions */}
                      <div className="px-4 pb-4 pt-0 mt-auto flex gap-2">
                        <Link href={`/admin/customers/${customer.id}/pets/${pet.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                            <Eye className="w-3.5 h-3.5" /> Ver perfil
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleOpenPetModal(pet)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/40 text-xs">
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">Nome / Raça</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center">Espécie</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center">Peso</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center">Idade</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">Alertas</th>
                          <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {customer.pets.map((pet) => (
                          <tr key={pet.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                  <Dog className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{pet.name}</p>
                                  <p className="text-xs text-muted-foreground">{pet.breed || "Sem raça"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center capitalize">{pet.type === "cat" ? "Gato" : "Cachorro"}</td>
                            <td className="px-5 py-3.5 text-center">{pet.weight ? `${pet.weight} kg` : "—"}</td>
                            <td className="px-5 py-3.5 text-center">{pet.age ? `${pet.age}m` : "—"}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap gap-1">
                                {pet.allergies && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-sm">Alergia</span>}
                                {pet.restrictions && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-sm">Restrição</span>}
                                {pet.special_needs && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm">Especial</span>}
                                {!pet.allergies && !pet.restrictions && !pet.special_needs && <span className="text-muted-foreground">—</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/admin/customers/${customer.id}/pets/${pet.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
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
            {/* Recipes filter bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{customer.recipes?.length || 0}</span> receita{(customer.recipes?.length || 0) !== 1 ? "s" : ""} vinculada{(customer.recipes?.length || 0) !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex border rounded-md">
                  <button
                    onClick={() => setRecipesViewMode("grid")}
                    className={`p-2 transition-colors ${recipesViewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                    title="Grade"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRecipesViewMode("list")}
                    className={`p-2 transition-colors ${recipesViewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                    title="Lista"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
                <Link href={`/recipes/new?user_id=${customer.id}`} className="flex-1 sm:flex-none">
                  <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> Criar Receita</Button>
                </Link>
              </div>
            </div>

            {customer.recipes && customer.recipes.length > 0 ? (
              recipesViewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.recipes.map(recipe => (
                    <Card key={recipe.id} className="flex flex-col overflow-hidden hover:border-primary/50 transition-colors">
                      <div className="p-4 pb-0 border-b border-border/50 bg-muted/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base line-clamp-1" title={recipe.name}>{recipe.name}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 min-h-[2.5rem]">{recipe.description || "Sem descrição."}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap ${recipe.is_template ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                            {recipe.is_template ? "Template" : "Personalizada"}
                          </span>
                        </div>
                      </div>
                      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-2 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Espécie</span>
                            <span className="font-medium">{recipe.pet_type === 'cat' ? 'Gato' : recipe.pet_type === 'dog' ? 'Cachorro' : 'Geral'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Duração</span>
                            <span className="font-medium">{recipe.duration_days ?? '-'} dias</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Ingredientes</span>
                            <span className="font-medium">{recipe.ingredients?.length ?? 0} itens</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Custo Est.</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">R$ {Number(recipe.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        {recipe.pets && recipe.pets.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Vinculado a:</span>
                            {recipe.pets.map((pet) => (
                              <span key={pet.id} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium">{pet.name}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                          <Link href={`/recipes/${recipe.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                              <Eye className="w-3.5 h-3.5" /> Visualizar
                            </Button>
                          </Link>
                          <Button variant="secondary" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleOpenRecEditModal(recipe)}>
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                      <tr>
                        <th className="px-6 py-3 font-medium">Nome da Receita</th>
                        <th className="px-6 py-3 font-medium text-center">Espécie</th>
                        <th className="px-6 py-3 font-medium text-center">Duração</th>
                        <th className="px-6 py-3 font-medium text-right">Custo Base</th>
                        <th className="px-6 py-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {customer.recipes.map(recipe => (
                        <tr key={recipe.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground flex items-center">
                              {recipe.name}
                              {recipe.is_template && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">Template</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[250px]">{recipe.description}</div>
                          </td>
                          <td className="px-6 py-4 text-center capitalize">{recipe.pet_type === 'cat' ? 'Gato' : recipe.pet_type === 'dog' ? 'Cachorro' : 'Geral'}</td>
                          <td className="px-6 py-4 text-center">{recipe.duration_days} dias</td>
                          <td className="px-6 py-4 text-right font-medium text-amber-600 dark:text-amber-400">R$ {Number(recipe.ingredient_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <Link href={`/recipes/${recipe.id}`}>
                                <Button variant="ghost" size="sm" className="text-xs gap-1">
                                  <Eye className="w-3.5 h-3.5" /> Visualizar
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleOpenRecEditModal(recipe)}>Editar</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    <Plus className="w-3.5 h-3.5" /> Criar primeira receita
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Orders header */}
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{customer.orders?.length || 0}</span> pedido{(customer.orders?.length || 0) !== 1 ? "s" : ""} realizado{(customer.orders?.length || 0) !== 1 ? "s" : ""}
              </p>
            </div>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="space-y-3">
                {customer.orders.map((order) => {
                  const statusColors: Record<string, string> = {
                    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
                  };
                  const statusLabel: Record<string, string> = {
                    pending: "Pendente", confirmed: "Confirmado",
                    delivered: "Entregue", cancelled: "Cancelado",
                  };
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
                      <div className="text-xl font-bold text-primary pl-13 sm:pl-0">
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
                <p className="text-sm">{t("no_orders_for_customer")}</p>
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
