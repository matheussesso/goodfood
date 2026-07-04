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
import Image from "next/image";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const setAuth = useAuth((state) => state.setAuth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/login", { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user);
        
        // Redirect based on role
        if (data.data.user.role === "admin") {
          router.push("/admin");
        } else if (data.data.user.role === "producer") {
          router.push("/producer");
        } else if (data.data.user.role === "delivery") {
          router.push("/delivery");
        } else {
          router.push("/dashboard");
        }
      }
    },
    onError: (error: any) => {
      setErrorMsg(
        error.response?.data?.message || 
        error.response?.data?.errors?.email?.[0] || 
        t("login_error")
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    loginMutation.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-lg border border-border">
        <div className="text-center flex flex-col items-center">
          <Image src="/goodfood-logo.png" alt="GoodFood" width={200} height={46} className="h-10 w-auto object-contain mb-2" priority />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("login_subtitle")}
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
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("password")}</Label>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  {t("forgot_password")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("login_loading")}
              </>
            ) : (
              t("login_button")
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("no_account")}{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              {t("register_link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
