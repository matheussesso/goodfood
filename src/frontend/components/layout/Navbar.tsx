"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { Menu, Columns, Rows } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getNavLinks, isNavLinkActive } from "@/components/layout/nav-links";

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

  const navLinks = getNavLinks(user?.role);

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
              <span className="sr-only">{t("toggle_menu")}</span>
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

          <div className="flex items-center gap-1 sm:gap-1">
            <div className="flex items-center text-sm">
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

            <FullscreenToggle />

            {toggleLayout && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLayout}
                title={
                  layoutMode === "horizontal"
                    ? t("layout_sidebar")
                    : t("layout_topbar")
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

            <div className="border-l pl-2 ms-2 sm:pl-4">
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
                const isActive = isNavLinkActive(link.href, pathname);
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
                    {t(link.labelKey)}
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
