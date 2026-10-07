"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { usePets } from "@/hooks/usePets";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const t = useTranslations("Navigation");
  const tDash = useTranslations("Dashboard");
  const tSub = useTranslations("Subscriptions");
  const { user } = useAuth();
  const { pets } = usePets();
  const { subscriptions } = useSubscriptions();
  const activeSubscriptions = (subscriptions ?? []).filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          {t("dashboard")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tDash("welcome_back", { name: user?.name ?? "" })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("pets")}</CardTitle>
            <CardDescription>{tDash("manage_pets_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{tDash("pets_count", { count: pets?.length ?? 0 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tSub("title")}</CardTitle>
            <CardDescription>{tDash("view_subscriptions_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{tDash("active_subscriptions_count", { count: activeSubscriptions })}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
