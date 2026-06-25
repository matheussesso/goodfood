"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const setAuth = useAuth((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/register", formData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        router.push("/dashboard");
      }
    },
    onError: (error: any) => {
      setErrorMsg(
        error.response?.data?.message || 
        t("register_error")
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (formData.password !== formData.password_confirmation) {
      setErrorMsg(t("password_mismatch"));
      return;
    }
    
    registerMutation.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-lg border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t("register_title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("register_subtitle")}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">{t("password_confirmation")}</Label>
              <Input
                id="password_confirmation"
                type="password"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("register_loading")}
              </>
            ) : (
              t("register_button")
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("has_account")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("login_link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
