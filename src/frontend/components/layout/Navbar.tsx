"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Menu,
  UserCircle,
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
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const { user, logout } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Navigation");

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
            {layoutMode === "vertical" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            )}

            {layoutMode === "horizontal" && (
              <Link
                href={user?.role === "admin" ? "/admin" : "/dashboard"}
                className="flex items-center gap-2 mr-4"
              >
                <span className="text-xl font-bold text-primary">GoodFood</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

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

            <div className="flex items-center gap-2 text-sm">
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer outline-none"
              >
                <option value="pt">PT</option>
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 border-l pl-2 sm:pl-4">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logout()}
                  title={t("logout")}
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                </Button>
              </div>
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

      {/* Mobile Menu for Horizontal Mode (Uses the same sidebar toggle essentially) */}
      {layoutMode === "horizontal" && (
        <div className="lg:hidden absolute left-4 top-3">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
      )}
    </header>
  );
}
