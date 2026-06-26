"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Dog, 
  CalendarCheck, 
  ShoppingBag, 
  PackageSearch,
  Factory,
  Truck,
  LogOut,
  Menu,
  X,
  Users,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getLinksForRole = () => {
    const role = user?.role || "customer";
    
    const links = [];
    
    // Common links
    links.push({ href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard });

    if (role === "admin") {
      links.push({ href: "/admin", label: t("dashboard_admin"), icon: LayoutDashboard });
      links.push({ href: "/admin/customers", label: t("customers"), icon: Users });
      links.push({ href: "/admin/catalog", label: t("catalog"), icon: PackageSearch });
      links.push({ href: "/admin/orders", label: t("orders"), icon: ShoppingBag });
      links.push({ href: "/admin/subscriptions", label: t("subscriptions"), icon: CalendarCheck });
      links.push({ href: "/admin/settings", label: t("settings"), icon: Settings2 });
    }

    if (role === "customer" || role === "admin") {
      links.push({ href: "/pets", label: t("pets"), icon: Dog });
    }

    if (role === "producer" || role === "admin") {
      links.push({ href: "/production", label: t("production"), icon: Factory });
    }

    if (role === "delivery" || role === "admin") {
      links.push({ href: "/deliveries", label: t("deliveries"), icon: Truck });
    }

    return links;
  };

  const navLinks = getLinksForRole();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">GoodFood</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col justify-between">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t">
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
