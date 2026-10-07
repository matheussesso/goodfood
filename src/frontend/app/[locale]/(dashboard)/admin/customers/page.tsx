"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCustomers, useCreateCustomer, UserRole } from "@/hooks/useCustomers";
import { USER_ROLES, getRoleMeta } from "@/lib/user-roles";
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
  MapPin,
  X,
  FilterX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { AddressFields, EMPTY_ADDRESS, type AddressValue } from "@/components/address/AddressFields";
import { hasPhoneNumber, isValidEmail } from "@/lib/masks";
import { getApiErrorMessage } from "@/lib/api-error";
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

type FormErrors = Partial<Record<string, string>>;

/** Inline field error message. */
function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-destructive mt-0.5">{msg}</p>;
}

const emptyCreateForm = {
  name:                  "",
  email:                 "",
  phone:                 "",
  password:              "",
  password_confirmation: "",
  role:                  "customer" as UserRole,
};

type SortKey = "name" | "date" | "pets" | "orders";



/**
 * Admin customers listing page with grid/list views, search, sort, and create modal.
 *
 * @returns The admin customers management page element.
 */
export default function CustomersPage() {
  const t  = useTranslations("admin");
  const tC = useTranslations("Common");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const { customers, isLoading } = useCustomers();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  // ── Create modal state ──────────────────────────────────────────────────────
  const [createOpen,  setCreateOpen]  = useState(false);
  const [createForm,  setCreateForm]  = useState(emptyCreateForm);
  const [addr,        setAddr]        = useState<AddressValue>(EMPTY_ADDRESS);
  const [createError,  setCreateError]  = useState("");
  const [createOk,     setCreateOk]     = useState("");
  const [createErrors, setCreateErrors] = useState<FormErrors>({});

  const createCustomer = useCreateCustomer();

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
    // Only customer accounts need a delivery address — staff roles don't.
    if (createForm.role === "customer") {
      if (!addr.zipcode.replace(/\D/g, "")) errs.zipcode      = tC("validation_required");
      if (!addr.street.trim())               errs.street       = tC("validation_required");
      if (!addr.number.trim())               errs.number       = tC("validation_required");
      if (!addr.neighborhood.trim())         errs.neighborhood = tC("validation_required");
      if (!addr.city.trim())                 errs.city         = tC("validation_required");
      if (!addr.state)                       errs.state        = tC("validation_required");
    }
    return errs;
  }

  function clearCreateError(field: string) {
    if (createErrors[field])
      setCreateErrors((e) => {
        const rest = { ...e };
        delete rest[field];
        return rest;
      });
  }

  function openCreate() {
    setCreateForm(emptyCreateForm);
    setAddr(EMPTY_ADDRESS);
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
      await createCustomer.mutateAsync({
        name:                  createForm.name,
        email:                 createForm.email,
        password:              createForm.password,
        password_confirmation: createForm.password_confirmation,
        phone:                 createForm.phone         || undefined,
        role:                  createForm.role,
        street:                addr.street              || undefined,
        number:                addr.number              || undefined,
        complement:            addr.complement          || undefined,
        neighborhood:          addr.neighborhood        || undefined,
        city:                  addr.city                || undefined,
        state:                 addr.state               || undefined,
        zipcode:               addr.zipcode.replace(/\D/g, "") || undefined,
      });
      setCreateOk(t("customer_created"));
      setTimeout(() => setCreateOpen(false), 1200);
    } catch (err) {
      setCreateError(getApiErrorMessage(err, t("customer_create_error")));
    }
  }

  // ── Search + role filter + sort ─────────────────────────────────────────
  const isFiltering = searchTerm !== "" || roleFilter !== "all";

  function clearFilters() {
    setSearchTerm("");
    setRoleFilter("all");
  }

  const sorted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    const filtered = customers.filter((c) => {
      if (roleFilter !== "all" && c.role !== roleFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        (qDigits.length >= 3 && (c.phone ?? "").replace(/\D/g, "").includes(qDigits))
      );
    });

    const copy = [...filtered];
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
  }, [customers, searchTerm, roleFilter, sortKey]);

  const totalPets   = customers.reduce((s, c) => s + (c.pets_count   ?? 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.orders_count ?? 0), 0);

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3 flex items-center gap-3">
            <Users className="w-7 h-7 text-primary mb-1" />
            {t("customers")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("customers_desc")}</p>
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
              {t("total_pets")}
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
              {t("total_orders")}
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
            className="pl-9 pr-9 h-10 w-full"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            className="h-10 w-full md:w-[160px] rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("all_roles")} ({customers.length})</option>
            {USER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey)} ({customers.filter((c) => c.role === r.value).length})
              </option>
            ))}
          </select>

          <Select
            value={sortKey}
            onValueChange={(v) => v && setSortKey(v as SortKey)}
          >
            <SelectTrigger className="w-full md:w-[200px] h-10">
              <SelectValue placeholder={t("sort_by")}>
                {(value: SortKey | null) => (value ? t(`sort_${value}`) : t("sort_by"))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t("sort_name")}</SelectItem>
              <SelectItem value="date">{t("sort_date")}</SelectItem>
              <SelectItem value="pets">{t("sort_pets")}</SelectItem>
              <SelectItem value="orders">{t("sort_orders")}</SelectItem>
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
            {isFiltering ? (
              <FilterX className="w-8 h-8 text-muted-foreground/50" />
            ) : (
              <Users className="w-8 h-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">
              {isFiltering ? tC("no_results") : t("no_customers_found")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isFiltering ? tC("adjust_filters") : t("no_customers_yet")}
            </p>
          </div>
          {isFiltering && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {tC("clear_filters")}
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid view ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((customer) => {
            const initials = getInitials(customer.name);
            const avatarBg = nameToHsl(customer.name);
            const location = customer.city && customer.state ? `${customer.city}/${customer.state}` : null;
            return (
              <div
                key={customer.id}
                className="group bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/50 hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm leading-tight truncate" title={customer.name}>{customer.name}</h4>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                      getRoleMeta(customer.role).badge
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", getRoleMeta(customer.role).dot)} />
                      {t(getRoleMeta(customer.role).labelKey)}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 divide-x divide-border/50 bg-muted/30 rounded-lg">
                    <div className="px-1.5 py-2 text-center min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("pets")}</span>
                      <span className="font-medium text-xs truncate block">{customer.pets_count ?? 0}</span>
                    </div>
                    <div className="px-1.5 py-2 text-center min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("orders")}</span>
                      <span className="font-medium text-xs truncate block">{customer.orders_count ?? 0}</span>
                    </div>
                    <div className="px-1.5 py-2 text-center min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("city_label")}</span>
                      <span className="font-medium text-xs truncate block">{customer.state || "—"}</span>
                    </div>
                    <div className="px-1.5 py-2 text-center min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("since_label")}</span>
                      <span className="font-medium text-xs truncate block">
                        {new Date(customer.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="truncate">{customer.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{location ?? t("location_unknown")}</span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
                  >
                    {t("view_details")}
                    <ChevronRight className="w-3.5 h-3.5" />
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
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b bg-muted/40 text-xs">
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">{t("name")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">{t("user_type")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("contact")}</th>
                  <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t("city_label")}</th>
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
                      <td className="py-3.5 px-5">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
                          getRoleMeta(customer.role).badge
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", getRoleMeta(customer.role).dot)} />
                          {t(getRoleMeta(customer.role).labelKey)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 hidden md:table-cell">
                        <div className="text-foreground text-sm">{customer.email}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{customer.phone || "—"}</div>
                      </td>
                      <td className="py-3.5 px-5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {customer.city && customer.state ? `${customer.city}/${customer.state}` : "—"}
                        </div>
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
                placeholder={t("name_placeholder")}
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
                placeholder={t("email_placeholder")}
                className={createErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {createErrors.email && <FieldError msg={createErrors.email} />}
            </div>
          </div>

          {/* Phone + Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="c-role">{t("user_type")}</Label>
              <select
                id="c-role"
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className={selectClass}
              >
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
                ))}
              </select>
            </div>
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

            <AddressFields
              value={addr}
              errors={createErrors}
              idPrefix="create-user"
              onChange={(patch) => {
                setAddr((current) => ({ ...current, ...patch }));
                Object.keys(patch).forEach(clearCreateError);
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              {tC("cancel")}
            </Button>
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("creating")}
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
