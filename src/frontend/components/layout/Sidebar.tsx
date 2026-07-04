"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import {
  LayoutDashboard,
  Dog,
  CalendarCheck,
  ShoppingBag,
  PackageSearch,
  Factory,
  Truck,
  Menu,
  X,
  Users,
  Settings2,
  UtensilsCrossed,
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
    if (role !== "admin") {
      links.push({ href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard });
    }

    if (role === "admin") {
      links.push({ href: "/admin", label: t("dashboard_admin"), icon: LayoutDashboard });
      links.push({ href: "/admin/customers", label: t("customers"), icon: Users });
      links.push({ href: "/admin/catalog", label: t("catalog"), icon: PackageSearch });
      links.push({ href: "/admin/orders", label: t("orders"), icon: ShoppingBag });
      links.push({ href: "/admin/subscriptions", label: t("subscriptions"), icon: CalendarCheck });
    }

    if (role === "customer") {
      links.push({ href: "/pets", label: t("pets"), icon: Dog });
      links.push({ href: "/recipes", label: t("recipes"), icon: UtensilsCrossed });
      links.push({ href: "/orders", label: t("orders"), icon: ShoppingBag });
      links.push({ href: "/subscriptions", label: t("subscriptions"), icon: CalendarCheck });
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
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b bg-background shadow-sm [clip-path:inset(0_0_-10px_0)] z-10">
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <Link href="/dashboard" className="flex items-center">
              <Image src="/goodfood-logo.png" alt="GoodFood" width={140} height={32} className="h-8 w-auto object-contain" priority />
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto border-r shadow-sm">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                (link.href === "/admin" || link.href === "/dashboard")
                  ? pathname === link.href
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              
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
        </nav>
      </aside>
    </>
  );
}
