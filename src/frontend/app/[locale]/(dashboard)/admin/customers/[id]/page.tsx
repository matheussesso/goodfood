"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomer } from "@/hooks/useCustomers";
import { ArrowLeft, User, Phone, Mail, Calendar, PawPrint, Package, CalendarDays } from "lucide-react";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations("admin");
  const { customer, isLoading } = useCustomer(params.id);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{t("loading")}</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-destructive">{t("customer_not_found")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {customer.name}
            <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
              ID: {customer.id}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("customer_details")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              {t("contact_info")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("email")}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("phone")}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("registered_at")}</p>
                  <p className="text-sm text-muted-foreground">{new Date(customer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <PawPrint className="w-5 h-5 mr-2 text-primary" />
              {t("pets")} ({customer.pets?.length || 0})
            </h3>
            
            {customer.pets && customer.pets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customer.pets.map((pet) => (
                  <div key={pet.id} className="border rounded-lg p-4 bg-muted/20">
                    <div className="font-semibold text-lg text-foreground mb-1">{pet.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-between">
                      <span className="capitalize">{pet.type}</span>
                      <span>{pet.weight} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("no_pets")}</p>
            )}
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" />
              {t("recent_orders")} ({customer.orders?.length || 0})
            </h3>
            
            {customer.orders && customer.orders.length > 0 ? (
              <div className="space-y-3">
                {customer.orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">#{order.id} - {new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{order.status}</p>
                    </div>
                    <div className="font-semibold text-primary">
                      R$ {order.total_price}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("no_orders")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
