"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import {
  Users,
  Search,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Phone,
  PawPrint,
  ShoppingBag,
  Plus,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Returns two uppercase initials from a full name. */
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Generates a deterministic HSL color from a string for avatar backgrounds.
 * @param str - Input string (typically user name).
 * @returns HSL color string.
 */
function nameToHsl(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 42%)`;
}

/** Generic debounce hook. */
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
}

type FormErrors = Partial<Record<string, string>>;

/** Validates email format. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns true if a PhoneInput value contains at least 4 digits after the country code. */
function hasPhoneNumber(phone: string): boolean {
  const idx = phone.indexOf(" ");
  if (idx === -1) return false;
  return phone.slice(idx + 1).replace(/\D/g, "").length >= 4;
}

/** Inline field error message. */
function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-destructive mt-0.5">{msg}</p>;
}

function formatCep(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const emptyCreateForm = {
  name:                  "",
  email:                 "",
  phone:                 "",
  password:              "",
  password_confirmation: "",
};

const emptyAddr = {
  zipcode:      "",
  street:       "",
  number:       "",
  complement:   "",
  neighborhood: "",
  city:         "",
  state:        "",
};

type SortKey = "date" | "name" | "pets" | "orders";

/**
 * Admin customers listing page with grid/list views, search, sort, and create modal.
 *
 * @returns The admin customers management page element.
 */
export default function CustomersPage() {
  const t  = useTranslations("admin");
  const tC = useTranslations("Common");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const { customers, isLoading } = useCustomers(debouncedSearch);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortKey, setSortKey] = useState<SortKey>("date");

  // ── Create modal state ──────────────────────────────────────────────────────
  const [createOpen,  setCreateOpen]  = useState(false);
  const [createForm,  setCreateForm]  = useState(emptyCreateForm);
  const [addr,        setAddr]        = useState(emptyAddr);
  const [cepSearching,setCepSearching]= useState(false);
  const [cepError,    setCepError]    = useState("");
  const [createError,  setCreateError]  = useState("");
  const [createOk,     setCreateOk]     = useState("");
  const [createErrors, setCreateErrors] = useState<FormErrors>({});

  const createCustomer = useCreateCustomer();

  const fetchCep = useCallback(async (digits: string) => {
    setCepSearching(true);
    setCepError("");
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) {
        setCepError(t("cep_not_found"));
      } else {
        setAddr((a) => ({
          ...a,
          street:       json.logradouro || a.street,
          neighborhood: json.bairro     || a.neighborhood,
          city:         json.localidade || a.city,
          state:        json.uf         || a.state,
        }));
      }
    } catch {
      setCepError(t("cep_not_found"));
    } finally {
      setCepSearching(false);
    }
  }, [t]);

  useEffect(() => {
    const digits = addr.zipcode.replace(/\D/g, "");
    if (digits.length === 8) fetchCep(digits);
  }, [addr.zipcode, fetchCep]);

  function validateCreate(): FormErrors {
    const errs: FormErrors = {};
    if (!createForm.name.trim()) errs.name = tC("validation_required");
    if (!createForm.email.trim()) errs.email = tC("validation_required");
    else if (!isValidEmail(createForm.email)) errs.email = tC("validation_email");
    if (!hasPhoneNumber(createForm.phone)) errs.phone = tC("validation_phone");
    if (!createForm.password) errs.password = tC("validation_required");
    else if (createForm.password.length < 8) errs.password = tC("validation_password_min");
    if (createForm.password !== createForm.password_confirmation)
      errs.password_confirmation = tC("validation_password_match");
    if (!addr.zipcode.replace(/\D/g, "")) errs.zipcode      = tC("validation_required");
    if (!addr.street.trim())               errs.street       = tC("validation_required");
    if (!addr.number.trim())               errs.number       = tC("validation_required");
    if (!addr.neighborhood.trim())         errs.neighborhood = tC("validation_required");
    if (!addr.city.trim())                 errs.city         = tC("validation_required");
    if (!addr.state)                       errs.state        = tC("validation_required");
    return errs;
  }

  function clearCreateError(field: string) {
    if (createErrors[field])
      setCreateErrors((e) => { const { [field]: _, ...rest } = e; return rest; });
  }

  function openCreate() {
    setCreateForm(emptyCreateForm);
    setAddr(emptyAddr);
    setCepError("");
    setCreateError("");
    setCreateOk("");
    setCreateErrors({});
    setCreateOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreateErrors({});
    setCreateError("");
    setCreateOk("");
    try {
      const addressParts = [addr.street, addr.number, addr.complement].filter(Boolean);
      await createCustomer.mutateAsync({
        name:                  createForm.name,
        email:                 createForm.email,
        password:              createForm.password,
        password_confirmation: createForm.password_confirmation,
        phone:                 createForm.phone   || undefined,
        address:               addressParts.length ? addressParts.join(", ") : undefined,
        city:                  addr.city          || undefined,
        state:                 addr.state         || undefined,
        zipcode:               addr.zipcode.replace(/\D/g, "") || undefined,
      });
      setCreateOk(t("customer_created"));
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Erro ao criar cliente.");
    }
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const copy = [...customers];
    if (sortKey === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "pets")
      copy.sort((a, b) => (b.pets_count ?? 0) - (a.pets_count ?? 0));
    else if (sortKey === "orders")
      copy.sort((a, b) => (b.orders_count ?? 0) - (a.orders_count ?? 0));
    else
      copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    return copy;
  }, [customers, sortKey]);

  const totalPets   = customers.reduce((s, c) => s + (c.pets_count   ?? 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.orders_count ?? 0), 0);

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            {t("customers")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("customers_desc")}</p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          {t("new_customer")}
        </Button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("total_customers")}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "—" : customers.length}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <PawPrint className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total de Pets
            </p>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "—" : totalPets}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total de Pedidos
            </p>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "—" : totalOrders}
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_customers")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <Select
            value={sortKey}
            onValueChange={(v) => v && setSortKey(v as SortKey)}
          >
            <SelectTrigger className="w-full md:w-[200px] h-10">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Mais recentes</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="pets">Mais pets</SelectItem>
              <SelectItem value="orders">Mais pedidos</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden md:flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => setViewMode("grid")}
              title={t("view_grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => setViewMode("list")}
              title={t("view_list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">{t("no_customers_found")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? t("no_customers_found") : t("no_customers_yet")}
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid view ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((customer) => {
            const initials = getInitials(customer.name);
            const avatarBg = nameToHsl(customer.name);
            return (
              <div
                key={customer.id}
                className="bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/50 hover:shadow-md transition-all group flex flex-col"
              >
                <div className="p-5 pb-4 border-b border-border/50 bg-muted/20 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate leading-tight">
                      {customer.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex divide-x divide-border/50 border-b border-border/50">
                  <div className="flex-1 py-3 flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pets</span>
                    <span className="font-bold text-lg text-foreground leading-none">{customer.pets_count ?? 0}</span>
                  </div>
                  <div className="flex-1 py-3 flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pedidos</span>
                    <span className="font-bold text-lg text-foreground leading-none">{customer.orders_count ?? 0}</span>
                  </div>
                  <div className="flex-1 py-3 flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Desde</span>
                    <span className="font-bold text-sm text-foreground leading-none">
                      {new Date(customer.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{customer.phone || "—"}</span>
                  </div>
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Ver detalhes
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List view ──────────────────────────────────────────────────── */
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-xs">
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">{t("name")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("contact")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center">{t("pets")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-center hidden sm:table-cell">{t("orders")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t("registered_at")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {sorted.map((customer) => {
                  const initials = getInitials(customer.name);
                  const avatarBg = nameToHsl(customer.name);
                  return (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ backgroundColor: avatarBg }}
                          >
                            {initials}
                          </div>
                          <span className="font-medium text-foreground">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 hidden md:table-cell">
                        <div className="text-foreground text-sm">{customer.email}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{customer.phone || "—"}</div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full text-xs font-semibold">
                          {customer.pets_count ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-full text-xs font-semibold">
                          {customer.orders_count ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                          {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          {t("view_details")}
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create customer modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("new_customer")}
        className="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {createError}
            </div>
          )}
          {createOk && (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              {createOk}
            </div>
          )}

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-name">{t("name")}</Label>
              <Input
                id="c-name"
                value={createForm.name}
                onChange={(e) => { setCreateForm((f) => ({ ...f, name: e.target.value })); clearCreateError("name"); }}
                placeholder="Nome completo"
                className={createErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {createErrors.name && <FieldError msg={createErrors.name} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">{t("email")}</Label>
              <Input
                id="c-email"
                type="email"
                value={createForm.email}
                onChange={(e) => { setCreateForm((f) => ({ ...f, email: e.target.value })); clearCreateError("email"); }}
                placeholder="email@exemplo.com"
                className={createErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {createErrors.email && <FieldError msg={createErrors.email} />}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="c-phone">{t("phone")}</Label>
            <PhoneInput
              id="c-phone"
              value={createForm.phone}
              onChange={(v) => { setCreateForm((f) => ({ ...f, phone: v })); clearCreateError("phone"); }}
              className={createErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {createErrors.phone && <FieldError msg={createErrors.phone} />}
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-password">{t("password_label")}</Label>
              <Input
                id="c-password"
                type="password"
                value={createForm.password}
                onChange={(e) => { setCreateForm((f) => ({ ...f, password: e.target.value })); clearCreateError("password"); }}
                placeholder="••••••••"
                className={createErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {createErrors.password && <FieldError msg={createErrors.password} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-password-confirm">{t("confirm_password_label")}</Label>
              <Input
                id="c-password-confirm"
                type="password"
                value={createForm.password_confirmation}
                onChange={(e) => { setCreateForm((f) => ({ ...f, password_confirmation: e.target.value })); clearCreateError("password_confirmation"); }}
                placeholder="••••••••"
                className={createErrors.password_confirmation ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {createErrors.password_confirmation && <FieldError msg={createErrors.password_confirmation} />}
            </div>
          </div>

          {/* Address divider */}
          <div className="pt-2 border-t border-border/60">
            <p className="text-sm font-medium text-foreground mb-3">{t("address_title")}</p>

            {/* CEP */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="c-zipcode">{t("addr_zipcode")}</Label>
              <div className="relative">
                <Input
                  id="c-zipcode"
                  value={addr.zipcode}
                  onChange={(e) => { setAddr((a) => ({ ...a, zipcode: formatCep(e.target.value) })); clearCreateError("zipcode"); }}
                  placeholder="00000-000"
                  inputMode="numeric"
                  maxLength={9}
                  className={cn("pr-10", (createErrors.zipcode || cepError) && "border-destructive focus-visible:ring-destructive")}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {cepSearching
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Search className="h-4 w-4 opacity-40" />}
                </div>
              </div>
              {cepSearching && <p className="text-xs text-muted-foreground">{t("cep_searching")}</p>}
              {cepError && <FieldError msg={cepError} />}
              {!cepError && createErrors.zipcode && <FieldError msg={createErrors.zipcode} />}
            </div>

            {/* Street + Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="c-street">{t("addr_street")}</Label>
                <Input
                  id="c-street"
                  value={addr.street}
                  onChange={(e) => { setAddr((a) => ({ ...a, street: e.target.value })); clearCreateError("street"); }}
                  placeholder="Av. Paulista"
                  className={createErrors.street ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {createErrors.street && <FieldError msg={createErrors.street} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-number">{t("addr_number")}</Label>
                <Input
                  id="c-number"
                  value={addr.number}
                  onChange={(e) => { setAddr((a) => ({ ...a, number: e.target.value })); clearCreateError("number"); }}
                  placeholder="123"
                  className={createErrors.number ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {createErrors.number && <FieldError msg={createErrors.number} />}
              </div>
            </div>

            {/* Complement */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="c-complement">{t("addr_complement")}</Label>
              <Input
                id="c-complement"
                value={addr.complement}
                onChange={(e) => setAddr((a) => ({ ...a, complement: e.target.value }))}
                placeholder="Apto, bloco, referência..."
              />
            </div>

            {/* Neighborhood */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="c-neighborhood">{t("addr_neighborhood")}</Label>
              <Input
                id="c-neighborhood"
                value={addr.neighborhood}
                onChange={(e) => { setAddr((a) => ({ ...a, neighborhood: e.target.value })); clearCreateError("neighborhood"); }}
                placeholder="Bela Vista"
                className={createErrors.neighborhood ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {createErrors.neighborhood && <FieldError msg={createErrors.neighborhood} />}
            </div>

            {/* City + State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="c-city">{t("addr_city")}</Label>
                <Input
                  id="c-city"
                  value={addr.city}
                  onChange={(e) => { setAddr((a) => ({ ...a, city: e.target.value })); clearCreateError("city"); }}
                  placeholder="São Paulo"
                  className={createErrors.city ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {createErrors.city && <FieldError msg={createErrors.city} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-state">{t("addr_state")}</Label>
                <select
                  id="c-state"
                  value={addr.state}
                  onChange={(e) => { setAddr((a) => ({ ...a, state: e.target.value })); clearCreateError("state"); }}
                  className={cn(selectClass, createErrors.state && "border-destructive")}
                >
                  <option value="">{t("select_state")}</option>
                  {BRAZIL_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>{s.uf} — {s.name}</option>
                  ))}
                </select>
                {createErrors.state && <FieldError msg={createErrors.state} />}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                t("create_customer")
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
