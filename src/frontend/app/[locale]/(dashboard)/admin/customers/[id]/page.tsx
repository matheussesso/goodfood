"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { usePets } from "@/hooks/usePets";
import { useIngredients } from "@/hooks/useIngredients";
import { useRecipes, calculateRecipeCost } from "@/hooks/useRecipes";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { ArrowLeft, User, Phone, Mail, Calendar, PawPrint, Package, CalendarDays, Edit2, Loader2, Plus, Dog, UtensilsCrossed, MapPin, LayoutGrid, List as ListIcon, Info, Search, CheckCircle2, Check, Trash2, ChevronDown, ChevronUp, DollarSign, FileText, CalendarClock, Layers, Eye, ShoppingBag } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

import { useParams } from "next/navigation";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const t = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const tPets = useTranslations("Pets");
  const tRec = useTranslations("Recipes");
  const queryClient = useQueryClient();

  const translateBreakdownName = (name: string) => {
    switch (name) {
      case 'Custo de Insumos Adicional':
        return tCat("additional_ingredient_cost") || name;
      case 'Repasse Produção (Cozinha)':
        return `${tCat("production_transfer")} (${tCat("kitchen") || "Cozinha"})`;
      case 'Repasse Logística':
        return tCat("logistics_transfer");
      case 'Margem Reserva':
        return tCat("reserve_margin");
      case 'Custo GFP+MKT':
        return tCat("gfp_mkt");
      case 'Fiscal/Tributário':
        return tCat("fiscal_tax");
      case 'Agenda':
        return tCat("schedule");
      case 'Cobrar':
        return tCat("charge");
      case 'Resultado (Lucro Mínimo)':
        return `${tCat("result") || "Resultado"} (${tCat("min_profit") || "Lucro Mínimo"})`;
      default:
        return name;
    }
  };
  
  const { customer, isLoading } = useCustomer(id);
  const { mutateAsync: updateCustomer, isPending: isUpdatingCustomer } = useUpdateCustomer();
  const { createPet, updatePet, deletePet, isCreating: isCreatingPet, isUpdating: isUpdatingPet, isDeleting: isDeletingPet } = usePets();

  const [activeTab, setActiveTab] = useState<"overview" | "pets" | "recipes" | "orders">("overview");
  const [petsViewMode, setPetsViewMode] = useState<"grid" | "list">("grid");
  const [recipesViewMode, setRecipesViewMode] = useState<"grid" | "list">("grid");
  
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipcode: "" });
  const [cepSearching,    setCepSearching]    = useState(false);
  const [cepError,        setCepError]        = useState("");
  const [editErrors,      setEditErrors]      = useState<Record<string, string>>({});
  const [editSaveError,   setEditSaveError]   = useState("");
  const [editSaveOk,      setEditSaveOk]      = useState("");

  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [petForm, setPetForm] = useState({ name: "", type: "dog", breed: "", weight: "", age: "", restrictions: "", allergies: "", special_needs: "" });

  // Recipe edit modal state
  const { ingredients } = useIngredients();
  const { updateRecipe, isUpdating: isUpdatingRec } = useRecipes();

  const ADMIN_BREAKDOWN_ORDER = [
    'Custo de Insumos Adicional', 'Repasse Produção (Cozinha)', 'Repasse Logística',
    'Margem Reserva', 'Custo GFP+MKT', 'Fiscal/Tributário', 'Agenda',
    'Cobrar', 'Resultado (Lucro Mínimo)',
  ];

  const [isRecEditModalOpen, setIsRecEditModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<any>(null);
  const [recForm, setRecForm] = useState({ name: "", description: "", pet_type: "dog", duration_days: "15", daily_portions: "2", is_active: true, instructions: "" });
  const [recipeIngredients, setRecipeIngredients] = useState<{id: number, quantity: string, unit: string}[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [recCategoryFilter, setRecCategoryFilter] = useState("Todos");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [recCostPerKg, setRecCostPerKg] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [costDetailOpen, setCostDetailOpen] = useState(false);

  useEffect(() => {
    const fetchCost = async () => {
      const validIngredients = recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0);
      if (validIngredients.length > 0) {
        setIsCalculatingCost(true);
        try {
          const result = await calculateRecipeCost({
            ingredients: validIngredients.map(i => ({ ingredient_id: i.id, quantity: parseFloat(i.quantity), unit: i.unit })),
            duration_days: parseInt(recForm.duration_days) || 15,
            daily_portions: parseInt(recForm.daily_portions) || 2
          });
          setEstimatedCost(result.estimatedCost);
          setRecCostPerKg(result.costPerKg || 0);
          setCostBreakdown(result.costBreakdown || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsCalculatingCost(false);
        }
      } else {
        setEstimatedCost(0);
        setRecCostPerKg(0);
        setCostBreakdown([]);
      }
    };
    const timeoutId = setTimeout(fetchCost, 500);
    return () => clearTimeout(timeoutId);
  }, [recipeIngredients, recForm.duration_days, recForm.daily_portions]);

  /** Formats raw digit string as XXXXX-XXX. */
  function formatCep(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  /** Queries ViaCEP and auto-fills address, city and state in the customer form. */
  const fetchCepForCustomer = useCallback(async (digits: string) => {
    setCepSearching(true);
    setCepError("");
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        setCustomerForm((f) => ({
          ...f,
          street:       data.logradouro ?? f.street,
          neighborhood: data.bairro     ?? f.neighborhood,
          city:         data.localidade ?? f.city,
          state:        data.uf         ?? f.state,
        }));
      }
    } catch {
      setCepError("CEP não encontrado.");
    } finally {
      setCepSearching(false);
    }
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-destructive">{t("customer_not_found")}</div>;
  }

  function handleZipcodeChange(raw: string) {
    const formatted = formatCep(raw);
    setCustomerForm((f) => ({ ...f, zipcode: formatted }));
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) fetchCepForCustomer(digits);
    else setCepError("");
  }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function hasPhoneNumber(phone: string): boolean {
    const idx = phone.indexOf(" ");
    if (idx === -1) return false;
    return phone.slice(idx + 1).replace(/\D/g, "").length >= 4;
  }

  function validateEditCustomer(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!customerForm.name.trim()) errs.name = tCommon("validation_required");
    if (!customerForm.email.trim()) errs.email = tCommon("validation_required");
    else if (!isValidEmail(customerForm.email)) errs.email = tCommon("validation_email");
    if (!hasPhoneNumber(customerForm.phone)) errs.phone = tCommon("validation_phone");
    if (!customerForm.zipcode.replace(/\D/g, "")) errs.zipcode      = tCommon("validation_required");
    if (!customerForm.street.trim())               errs.street       = tCommon("validation_required");
    if (!customerForm.number.trim())               errs.number       = tCommon("validation_required");
    if (!customerForm.neighborhood.trim())         errs.neighborhood = tCommon("validation_required");
    if (!customerForm.city.trim())                 errs.city         = tCommon("validation_required");
    if (!customerForm.state)                       errs.state        = tCommon("validation_required");
    return errs;
  }

  function clearEditError(field: string) {
    if (editErrors[field])
      setEditErrors((e) => { const { [field]: _, ...rest } = e; return rest; });
  }

  const handleOpenEditCustomer = () => {
    setCepError("");
    setEditErrors({});
    setEditSaveError("");
    setEditSaveOk("");
    setCustomerForm({
      name:         customer.name,
      email:        customer.email,
      phone:        customer.phone        || "",
      street:       customer.street       || "",
      number:       customer.number       || "",
      complement:   customer.complement   || "",
      neighborhood: customer.neighborhood || "",
      city:         customer.city         || "",
      state:        customer.state        || "",
      zipcode:      customer.zipcode      || "",
    });
    setIsEditCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateEditCustomer();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setEditErrors({});
    setEditSaveError("");
    setEditSaveOk("");
    try {
      await updateCustomer({ id: customer.id, data: customerForm });
      setEditSaveOk("Cliente atualizado com sucesso!");
      setTimeout(() => setIsEditCustomerModalOpen(false), 1000);
    } catch (err: any) {
      setEditSaveError(err?.response?.data?.message || "Erro ao atualizar cliente.");
    }
  };

  const handleOpenPetModal = (pet?: any) => {
    if (pet) {
      setEditingPet(pet);
      setPetForm({
        name: pet.name, type: pet.type || "dog", breed: pet.breed || "",
        weight: pet.weight ? pet.weight.toString() : "", age: pet.age ? pet.age.toString() : "",
        restrictions: pet.restrictions || "", allergies: pet.allergies || "", special_needs: pet.special_needs || ""
      });
    } else {
      setEditingPet(null);
      setPetForm({ name: "", type: "dog", breed: "", weight: "", age: "", restrictions: "", allergies: "", special_needs: "" });
    }
    setIsPetModalOpen(true);
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: petForm.name, type: petForm.type as "dog" | "cat", breed: petForm.breed,
      weight: petForm.weight ? parseFloat(petForm.weight) : undefined,
      age: petForm.age ? parseInt(petForm.age, 10) : undefined,
      restrictions: petForm.restrictions, allergies: petForm.allergies, special_needs: petForm.special_needs,
      user_id: Number(customer.id)
    };

    if (editingPet) {
      await updatePet({ id: editingPet.id, ...data });
    } else {
      await createPet(data);
    }
    
    queryClient.invalidateQueries({ queryKey: ["customer", String(customer.id)] });
    setIsPetModalOpen(false);
  };

  const handleDeletePet = async (id: number) => {
    if (confirm("Deseja realmente excluir este pet?")) {
      await deletePet(id);
      queryClient.invalidateQueries({ queryKey: ["customer", String(customer.id)] });
    }
  };

  const handleOpenRecEditModal = (rec: any) => {
    setIngredientSearch("");
    setRecCategoryFilter("Todos");
    setEstimatedCost(0);
    setRecCostPerKg(0);
    setCostBreakdown([]);
    setRecipeDetailOpen(false);
    setCostDetailOpen(false);
    setEditingRec(rec);
    setRecForm({
      name: rec.name, description: rec.description || "", instructions: rec.instructions || "",
      pet_type: rec.pet_type || "dog", duration_days: rec.duration_days?.toString() || "15",
      daily_portions: rec.daily_portions?.toString() || "2", is_active: rec.is_active
    });
    setRecipeIngredients(rec.ingredients?.map((i: any) => ({ id: i.id, quantity: i.pivot.quantity, unit: i.pivot.unit || i.unit })) || []);
    setSelectedPetIds(rec.pets?.map((p: any) => p.id) || []);
    setIsRecEditModalOpen(true);
  };

  const handleRecEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRec) return;
    await updateRecipe({
      id: editingRec.id,
      name: recForm.name, description: recForm.description,
      pet_type: recForm.pet_type, duration_days: parseInt(recForm.duration_days), daily_portions: parseInt(recForm.daily_portions),
      is_template: false, is_active: recForm.is_active, instructions: recForm.instructions,
      ingredients: recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).map(i => ({ id: i.id, quantity: parseFloat(i.quantity), unit: i.unit })),
      pet_ids: selectedPetIds
    });
    queryClient.invalidateQueries({ queryKey: ["customer", String(customer.id)] });
    setIsRecEditModalOpen(false);
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
                <Button variant="outline" size="sm" onClick={handleOpenEditCustomer} className="h-8 text-xs gap-1.5">
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
                <Button variant="outline" size="sm" onClick={handleOpenEditCustomer} className="h-8 text-xs gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </Button>
              </div>
              {customer.street || customer.city || customer.state || customer.zipcode ? (
                <div className="divide-y divide-border/50">
                  {/* CEP */}
                  <div className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
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
                  <Button variant="outline" size="sm" onClick={handleOpenEditCustomer} className="mt-1 text-xs gap-1.5 h-8">
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
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Pet
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
                <p className="text-sm">Nenhum pet encontrado para este cliente.</p>
                <Button variant="outline" size="sm" onClick={() => handleOpenPetModal()} className="mt-1 gap-1.5 text-xs h-8">
                  <Plus className="w-3.5 h-3.5" /> Adicionar primeiro pet
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
                            <span className="font-semibold text-amber-600 dark:text-amber-400">R$ {Number((recipe as any).base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        {recipe.pets && (recipe.pets as any[]).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Vinculado a:</span>
                            {(recipe.pets as any[]).map((pet) => (
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
                          <td className="px-6 py-4 text-right font-medium text-amber-600 dark:text-amber-400">R$ {Number((recipe as any).ingredient_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
                <p className="text-sm">Nenhuma receita encontrada para este cliente.</p>
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
                <p className="text-sm">Nenhum pedido encontrado para este cliente.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recipe Edit Modal */}
      <Modal isOpen={isRecEditModalOpen} onClose={() => setIsRecEditModalOpen(false)} title={`Editar Receita: ${editingRec?.name || ""}`} className="max-w-4xl">
        <form onSubmit={handleRecEditSubmit} className="space-y-6 px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome da Receita</Label><Input required value={recForm.name} onChange={e => setRecForm({...recForm, name: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Tipo de Pet</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={recForm.pet_type} onChange={e => setRecForm({...recForm, pet_type: e.target.value})}>
                <option value="dog">Cachorro</option>
                <option value="cat">Gato</option>
              </select>
            </div>
          </div>

          {/* Pet linking — shown at top for quick context */}
          {customer.pets && customer.pets.length > 0 && (
            <div className="space-y-2">
              <Label>Vincular ao(s) pet(s)</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
                {customer.pets.map((pet) => {
                  const selected = selectedPetIds.includes(pet.id);
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() =>
                        setSelectedPetIds(
                          selected
                            ? selectedPetIds.filter((id) => id !== pet.id)
                            : [...selectedPetIds, pet.id]
                        )
                      }
                      className={cn(
                        "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-all",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                      )}
                    >
                      <Dog className="w-3.5 h-3.5" />
                      {pet.name}
                      {selected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Duração (dias)</Label><Input type="number" required value={recForm.duration_days} onChange={e => setRecForm({...recForm, duration_days: e.target.value})} /></div>
            <div className="space-y-2"><Label>Porções/dia</Label><Input type="number" required value={recForm.daily_portions} onChange={e => setRecForm({...recForm, daily_portions: e.target.value})} /></div>
          </div>

          <div className="space-y-2"><Label>Descrição</Label><Input value={recForm.description} onChange={e => setRecForm({...recForm, description: e.target.value})} /></div>
          <div className="space-y-2">
            <Label>Instruções</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={recForm.instructions}
              onChange={e => setRecForm({...recForm, instructions: e.target.value})}
            />
          </div>

          {/* Ingredient picker */}
          <div className="space-y-3">
            <Label>Ingredientes</Label>
            <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-2.5 rounded-lg flex gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span><strong>Importante:</strong> As quantidades são por dia (quantidade diária total).</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar ingrediente..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <select
                value={recCategoryFilter}
                onChange={(e) => setRecCategoryFilter(e.target.value)}
                className="h-9 px-2 border rounded-md text-sm bg-background border-input w-36"
              >
                <option value="Todos">Todos</option>
                {Array.from(new Set(ingredients?.map(i => i.category).filter(Boolean))).map(cat => (
                  <option key={cat as string} value={cat as string}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1 border rounded-md p-2 bg-muted/20">
              {ingredients?.filter(ing => {
                const matchSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
                const matchCategory = recCategoryFilter === "Todos" || ing.category === recCategoryFilter;
                return matchSearch && matchCategory;
              }).map(ing => {
                const isSelected = recipeIngredients.some(r => r.id === ing.id);
                return (
                  <div
                    key={ing.id}
                    onClick={() => {
                      if (isSelected) {
                        setRecipeIngredients(recipeIngredients.filter(r => r.id !== ing.id));
                      } else {
                        setRecipeIngredients([...recipeIngredients, { id: ing.id, quantity: "", unit: ing.unit }]);
                      }
                    }}
                    className={cn(
                      "border p-2 rounded-lg cursor-pointer transition-all flex flex-col justify-between min-h-[56px]",
                      isSelected ? "border-primary bg-primary/10 shadow-sm" : "hover:border-primary/50 hover:bg-muted/50 bg-background"
                    )}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-semibold text-xs leading-tight line-clamp-2">{ing.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-end mt-1">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{ing.category || "Geral"}</span>
                    </div>
                  </div>
                );
              })}
              {ingredients?.filter(ing => {
                const matchSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
                const matchCategory = recCategoryFilter === "Todos" || ing.category === recCategoryFilter;
                return matchSearch && matchCategory;
              }).length === 0 && (
                <div className="col-span-4 text-center text-xs text-muted-foreground py-4">Nenhum ingrediente encontrado</div>
              )}
            </div>

            {recipeIngredients.length > 0 ? (
              <div className="space-y-2 border rounded-md p-3 bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ingredientes selecionados — qtd/dia</p>
                {(() => {
                  const ingCostMap = new Map(
                    costBreakdown.filter(i => !i.is_supplement).map(i => [i.name, i])
                  );
                  return recipeIngredients.map((item, idx) => {
                    const ing = ingredients?.find(i => i.id === item.id);
                    const breakdown = ing ? ingCostMap.get(ing.name) : null;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="flex-1 text-sm font-medium truncate min-w-0">{ing?.name || "?"}</span>
                        {breakdown && (
                          <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                            R$ {Number(breakdown.total_cost).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Qtd/dia"
                          className="w-24 h-8 px-2 text-sm shrink-0"
                          value={item.quantity}
                          onChange={e => {
                            const newArr = [...recipeIngredients];
                            newArr[idx].quantity = e.target.value;
                            setRecipeIngredients(newArr);
                          }}
                        />
                        <span className="text-xs text-muted-foreground w-8 text-center shrink-0">{item.unit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">Nenhum ingrediente selecionado</p>
            )}
          </div>

          {/* Cost section with both accordions */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                Custo Estimado
                {isCalculatingCost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">R$ {estimatedCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                {recCostPerKg > 0 && (
                  <div className="text-xs text-muted-foreground">R$ {recCostPerKg.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg</div>
                )}
                {costBreakdown.filter(i => !i.is_supplement).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-primary/20">
                    Custo base: R$ {costBreakdown.filter(i => !i.is_supplement).reduce((s: number, i: any) => s + Number(i.total_cost), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>

            {/* Recipe detail accordion */}
            <div className="border-t border-primary/20 pt-3">
              <button
                type="button"
                onClick={() => setRecipeDetailOpen(v => !v)}
                className="w-full flex justify-between items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Ver detalhamento da receita</span>
                {recipeDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {recipeDetailOpen && (
                <div className="py-3 space-y-3 border-b border-primary/10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Duração total:</span>
                    <span className="font-semibold">{recForm.duration_days} dias</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Porções diárias:</span>
                    <span className="font-semibold">{recForm.daily_portions} porção(ões)</span>
                  </div>
                  {recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).length > 0 && (
                    <div>
                      <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1.5 px-1 font-medium">
                        <span>Ingrediente</span>
                        <span className="text-right">Total/dia</span>
                        <span className="text-right">Por porção</span>
                      </div>
                      <ul className="space-y-1.5">
                        {recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).map((item, idx) => {
                          const ing = ingredients?.find(i => i.id === item.id);
                          const qty = Number(item.quantity);
                          const portions = Number(recForm.daily_portions) || 1;
                          const perPortion = qty / portions;
                          return (
                            <li key={idx} className="grid grid-cols-3 gap-1 text-sm items-center bg-muted/20 px-2 py-1.5 rounded-md">
                              <span className="text-muted-foreground truncate">{ing?.name || "?"}</span>
                              <span className="font-medium text-right text-xs">{qty.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.unit}</span>
                              <span className="text-right text-xs text-muted-foreground">{perPortion.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.unit}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cost detail accordion */}
            <div>
              <button
                type="button"
                onClick={() => setCostDetailOpen(v => !v)}
                className="w-full flex justify-between items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Ver detalhamento dos custos</span>
                {costDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {costDetailOpen && (
                costBreakdown.filter(i => i.is_supplement).length > 0 ? (
                  <ul className="space-y-1 text-xs mt-3">
                    {costBreakdown.filter(i => !i.is_supplement).length > 0 && (
                      <li className="flex justify-between pb-1.5 mb-0.5 border-b-2 border-primary/30 font-semibold text-foreground text-xs">
                        <span>{tRec("base_cost")} ({tRec("ingredients").toLowerCase()})</span>
                        <span>R$ {costBreakdown.filter(i => !i.is_supplement).reduce((s: number, i: any) => s + Number(i.total_cost), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </li>
                    )}
                    {[...costBreakdown.filter(i => i.is_supplement)]
                      .sort((a, b) => {
                        const ai = ADMIN_BREAKDOWN_ORDER.indexOf(a.name);
                        const bi = ADMIN_BREAKDOWN_ORDER.indexOf(b.name);
                        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                      })
                      .map((item, idx) => {
                        const isCobrar = item.name === 'Cobrar';
                        const isResultado = item.name === 'Resultado (Lucro Mínimo)';
                        return (
                          <li
                            key={idx}
                            className={cn(
                              "flex justify-between pb-1",
                              isCobrar
                                ? "border-t-2 border-primary/40 pt-2 mt-1 font-bold text-primary text-sm"
                                : isResultado
                                  ? "text-emerald-600 font-medium border-t border-dashed border-border pt-1 mt-1"
                                  : "text-muted-foreground border-b border-border/30"
                            )}
                          >
                            <span>{translateBreakdownName(item.name)}</span>
                            <span>R$ {Number(item.total_cost).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="text-center text-xs text-muted-foreground italic py-2">
                    Adicione ingredientes para simular o custo.
                  </p>
                )
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setIsRecEditModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isUpdatingRec || isCalculatingCost}>Salvar Receita</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditCustomerModalOpen} onClose={() => setIsEditCustomerModalOpen(false)} title="Editar Informações do Cliente">
        <form onSubmit={handleSaveCustomer} className="space-y-5" noValidate>
          {editSaveError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {editSaveError}
            </div>
          )}
          {editSaveOk && (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              {editSaveOk}
            </div>
          )}
          {/* ── Dados básicos ── */}
          <div className="space-y-3">
            <div className="flex items-center text-sm font-semibold text-primary border-b pb-2">
              <User className="w-4 h-4 mr-2" /> Dados Básicos
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Nome</Label>
                <Input
                  id="c-name"
                  value={customerForm.name}
                  onChange={(e) => { setCustomerForm({ ...customerForm, name: e.target.value }); clearEditError("name"); }}
                  className={editErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {editErrors.name && <p className="text-xs text-destructive mt-0.5">{editErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">E-mail</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => { setCustomerForm({ ...customerForm, email: e.target.value }); clearEditError("email"); }}
                  className={editErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {editErrors.email && <p className="text-xs text-destructive mt-0.5">{editErrors.email}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="c-phone">Celular</Label>
                <PhoneInput
                  id="c-phone"
                  value={customerForm.phone}
                  onChange={(v) => { setCustomerForm({ ...customerForm, phone: v }); clearEditError("phone"); }}
                  className={editErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {editErrors.phone && <p className="text-xs text-destructive mt-0.5">{editErrors.phone}</p>}
              </div>
            </div>
          </div>

          {/* ── Endereço ── */}
          <div className="space-y-3">
            <div className="flex items-center text-sm font-semibold text-primary border-b pb-2">
              <MapPin className="w-4 h-4 mr-2" /> Endereço
            </div>

            {/* CEP — primeiro, dispara ViaCEP */}
            <div className="space-y-1.5">
              <Label htmlFor="c-zipcode">CEP</Label>
              <div className="relative">
                <Input
                  id="c-zipcode"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={customerForm.zipcode}
                  onChange={(e) => { handleZipcodeChange(e.target.value); clearEditError("zipcode"); }}
                  className={cn("pr-9", (cepError || editErrors.zipcode) && "border-destructive")}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {cepSearching
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Search className="w-4 h-4 opacity-40" />
                  }
                </div>
              </div>
              {cepSearching && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
              {cepError && <p className="text-xs text-destructive">{cepError}</p>}
              {!cepError && editErrors.zipcode && <p className="text-xs text-destructive mt-0.5">{editErrors.zipcode}</p>}
            </div>

            {/* Street + Number */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="c-street">Rua / Logradouro</Label>
                <Input
                  id="c-street"
                  placeholder="Ex.: Av. Paulista"
                  value={customerForm.street}
                  onChange={(e) => { setCustomerForm({ ...customerForm, street: e.target.value }); clearEditError("street"); }}
                  className={editErrors.street ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {editErrors.street && <p className="text-xs text-destructive mt-0.5">{editErrors.street}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-number">Número</Label>
                <Input
                  id="c-number"
                  placeholder="123"
                  value={customerForm.number}
                  onChange={(e) => { setCustomerForm({ ...customerForm, number: e.target.value }); clearEditError("number"); }}
                  className={editErrors.number ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {editErrors.number && <p className="text-xs text-destructive mt-0.5">{editErrors.number}</p>}
              </div>
            </div>

            {/* Complement */}
            <div className="space-y-1.5">
              <Label htmlFor="c-complement">Complemento</Label>
              <Input
                id="c-complement"
                placeholder="Apto, bloco, referência..."
                value={customerForm.complement}
                onChange={(e) => setCustomerForm({ ...customerForm, complement: e.target.value })}
              />
            </div>

            {/* Neighborhood */}
            <div className="space-y-1.5">
              <Label htmlFor="c-neighborhood">Bairro</Label>
              <Input
                id="c-neighborhood"
                placeholder="Bela Vista"
                value={customerForm.neighborhood}
                onChange={(e) => { setCustomerForm({ ...customerForm, neighborhood: e.target.value }); clearEditError("neighborhood"); }}
                className={editErrors.neighborhood ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {editErrors.neighborhood && <p className="text-xs text-destructive mt-0.5">{editErrors.neighborhood}</p>}
            </div>

            {/* Cidade + Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-city">Cidade</Label>
                <Input
                  id="c-city"
                  value={customerForm.city}
                  onChange={(e) => { setCustomerForm({ ...customerForm, city: e.target.value }); clearEditError("city"); }}
                  className={editErrors.city ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {editErrors.city && <p className="text-xs text-destructive mt-0.5">{editErrors.city}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-state">Estado</Label>
                <select
                  id="c-state"
                  value={customerForm.state}
                  onChange={(e) => { setCustomerForm({ ...customerForm, state: e.target.value }); clearEditError("state"); }}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    editErrors.state && "border-destructive"
                  )}
                >
                  <option value="">Selecione o estado</option>
                  {BRAZIL_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>{s.uf} — {s.name}</option>
                  ))}
                </select>
                {editErrors.state && <p className="text-xs text-destructive mt-0.5">{editErrors.state}</p>}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditCustomerModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdatingCustomer}>
              {isUpdatingCustomer && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPetModalOpen} onClose={() => setIsPetModalOpen(false)} title={editingPet ? "Editar Pet" : "Novo Pet"}>
        <form onSubmit={handleSavePet} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome *</Label><Input required value={petForm.name} onChange={e => setPetForm({...petForm, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Espécie</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.type} onChange={e => setPetForm({...petForm, type: e.target.value})}><option value="dog">Cachorro</option><option value="cat">Gato</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Raça</Label><Input value={petForm.breed} onChange={e => setPetForm({...petForm, breed: e.target.value})} /></div>
            <div className="space-y-2"><Label>Idade (meses)</Label><Input type="number" min="0" value={petForm.age} onChange={e => setPetForm({...petForm, age: e.target.value})} /></div>
            <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" step="0.1" min="0" value={petForm.weight} onChange={e => setPetForm({...petForm, weight: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Restrições Alimentares</Label>
            <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.restrictions} onChange={e => setPetForm({...petForm, restrictions: e.target.value})} placeholder="Sem farinha de trigo, etc..." />
          </div>
          <div className="space-y-2">
            <Label>Alergias</Label>
            <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.allergies} onChange={e => setPetForm({...petForm, allergies: e.target.value})} placeholder="Frango, corantes..." />
          </div>
          <div className="space-y-2">
            <Label>Necessidades Especiais</Label>
            <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.special_needs} onChange={e => setPetForm({...petForm, special_needs: e.target.value})} placeholder="Diabético, cego..." />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPetModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreatingPet || isUpdatingPet}>
              {(isCreatingPet || isUpdatingPet) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar Pet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
