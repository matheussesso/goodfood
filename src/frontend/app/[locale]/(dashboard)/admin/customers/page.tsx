"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomers } from "@/hooks/useCustomers";
import { Users, Search, ChevronRight, Activity, CalendarDays } from "lucide-react";

export default function CustomersPage() {
  const t = useTranslations("admin");
  const { customers, isLoading } = useCustomers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("customers")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("customers_desc")}
          </p>
        </div>
      </div>

      {/* Stats/Summary could go here */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{t("total_customers")}</p>
                <h3 className="text-2xl font-bold text-foreground">{customers.length}</h3>
              </div>
            </div>
          </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search_customers")}
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-sm">
                <th className="py-4 px-6 font-medium text-muted-foreground">{t("name")}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t("contact")}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t("registered_at")}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-center">{t("pets")}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-center">{t("orders")}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t("loading")}
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t("no_customers_found")}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-medium text-foreground">{customer.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-foreground">{customer.email}</div>
                      <div className="text-xs text-muted-foreground">{customer.phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-muted-foreground">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        {customer.pets_count || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        {customer.orders_count || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {t("view_details")}
                        <ChevronRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
