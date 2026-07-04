"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/layout/UserDropdown";
import {
  Menu,
  Columns,
  Rows,
  LayoutDashboard,
  Users,
  PackageSearch,
  ShoppingBag,
  CalendarCheck,
  Dog,
  Factory,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface NavbarProps {
  onMenuClick: () => void;
  layoutMode?: "horizontal" | "vertical";
  toggleLayout?: () => void;
}

export function Navbar({
  onMenuClick,
  layoutMode = "vertical",
  toggleLayout,
}: NavbarProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  const router = useRouter();
  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const getLinksForRole = () => {
    const role = user?.role || "customer";

    const links = [];

    if (role !== "admin") {
      links.push({
        href: "/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      });
    }

    if (role === "admin") {
      links.push({
        href: "/admin",
        label: t("dashboard_admin"),
        icon: LayoutDashboard,
      });
      links.push({
        href: "/admin/customers",
        label: t("customers"),
        icon: Users,
      });
      links.push({
        href: "/admin/catalog",
        label: t("catalog"),
        icon: PackageSearch,
      });
      links.push({
        href: "/admin/orders",
        label: t("orders"),
        icon: ShoppingBag,
      });
      links.push({
        href: "/admin/subscriptions",
        label: t("subscriptions"),
        icon: CalendarCheck,
      });
    }

    if (role === "customer") {
      links.push({ href: "/pets", label: t("pets"), icon: Dog });
      links.push({
        href: "/recipes",
        label: t("recipes"),
        icon: UtensilsCrossed,
      });
      links.push({
        href: "/orders",
        label: t("orders"),
        icon: ShoppingBag,
      });
      links.push({
        href: "/subscriptions",
        label: t("subscriptions"),
        icon: CalendarCheck,
      });
    }

    if (role === "producer" || role === "admin") {
      links.push({
        href: "/production",
        label: t("production"),
        icon: Factory,
      });
    }

    if (role === "delivery" || role === "admin") {
      links.push({ href: "/deliveries", label: t("deliveries"), icon: Truck });
    }

    return links;
  };

  const navLinks = getLinksForRole();

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b bg-background shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>

            <Link
              href={user?.role === "admin" ? "/admin" : "/dashboard"}
              className={cn(
                "flex items-center",
                layoutMode === "vertical" ? "lg:hidden" : "mr-4"
              )}
            >
              <Image src="/goodfood-logo.png" alt="GoodFood" width={140} height={32} className="h-8 w-auto object-contain" priority />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-sm">
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer outline-none font-medium"
              >
                <option value="pt">PT</option>
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </div>

            {toggleLayout && (
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLayout}
                title={
                  layoutMode === "horizontal"
                    ? "Mudar para menu lateral"
                    : "Mudar para menu superior"
                }
                className="hidden lg:flex"
              >
                {layoutMode === "horizontal" ? (
                  <Columns className="h-4 w-4" />
                ) : (
                  <Rows className="h-4 w-4" />
                )}
              </Button>
            )}

            <div className="border-l pl-2 sm:pl-4">
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Menu (Desktop) */}
      {layoutMode === "horizontal" && (
        <div className="border-t bg-muted/20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl w-full hidden lg:flex items-center space-x-1 h-12 overflow-x-auto">
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
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
