"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const t = useTranslations("Navigation");
  const tDash = useTranslations("Dashboard");
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("dashboard")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {tDash("welcome_back", { name: user?.name })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("pets")}</CardTitle>
            <CardDescription>{tDash("manage_pets_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{tDash("no_pets_registered")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("subscriptions")}</CardTitle>
            <CardDescription>{tDash("view_subscriptions_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{tDash("no_active_subscriptions")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
