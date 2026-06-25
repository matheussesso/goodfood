"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const t = useTranslations("Navigation");
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("dashboard")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo de volta, {user?.name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Meus Pets</CardTitle>
            <CardDescription>Gerencie seus pets e suas dietas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Você possui 0 pets cadastrados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinaturas Ativas</CardTitle>
            <CardDescription>Visualize suas assinaturas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Você não possui assinaturas ativas.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
