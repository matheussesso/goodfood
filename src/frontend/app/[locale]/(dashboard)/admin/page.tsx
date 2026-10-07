"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatBRL } from "@/lib/format";
import { Users, ShoppingBag, DollarSign, Activity, ArrowRight, Package } from "lucide-react";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const tOrders = useTranslations("Orders");
  const { customers, isLoading: loadingCustomers } = useCustomers();
  const { orders, isLoading: loadingOrders } = useOrders();
  const { subscriptions } = useSubscriptions();

  const grossRevenue = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_price), 0);
  const activeSubscriptions = (subscriptions ?? []).filter((s) => s.status === "active").length;

  const stats = [
    {
      title: t("total_customers"),
      value: customers?.length || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: t("total_orders"),
      value: orders?.length ?? 0,
      icon: ShoppingBag,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: t("revenue"),
      value: formatBRL(grossRevenue, true),
      icon: DollarSign,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      title: t("active_subscriptions"),
      value: activeSubscriptions,
      icon: Activity,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          {t("dashboard")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard_desc")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t("recent_customers")}</h3>
            <Link href="/admin/customers" className="text-sm text-primary hover:underline flex items-center">
              {t("view_all")} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y">
            {loadingCustomers ? (
              <div className="p-6 text-center text-muted-foreground">{t("loading")}</div>
            ) : customers?.slice(0, 5).map((customer) => (
              <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <Link href={`/admin/customers/${customer.id}`} className="p-2 hover:bg-muted rounded-full">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t("recent_orders")}</h3>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center">
              {t("view_all")} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {loadingOrders ? (
            <div className="p-6 text-center text-muted-foreground">{t("loading")}</div>
          ) : orders && orders.length > 0 ? (
            <div className="divide-y">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium">{tOrders("order_number")}{order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.user?.name ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">R$ {formatBRL(order.total_price)}</span>
                    <Link href={`/admin/orders/${order.id}`} className="p-2 hover:bg-muted rounded-full">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("no_orders_yet")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
