"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, User, Settings, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Avatar circle that shows the user's initials (or a fallback icon).
 *
 * @param name - User's display name.
 * @param size - Avatar diameter class ('sm' = 8, 'md' = 10).
 */
function UserAvatar({ name, size = "md" }: { name?: string; size?: "sm" | "md" }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "";

  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div className={cn(
      "rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0",
      dim
    )}>
      {initials ? initials : <UserCircle className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />}
    </div>
  );
}

/**
 * Dropdown menu shown when the user clicks on their avatar/name in the navbar.
 * Contains links to profile, settings and a logout action.
 *
 * @returns The user dropdown menu element.
 */
export function UserDropdown() {
  const { user, logout } = useAuth();
  const t = useTranslations("Navigation");
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/login" as Parameters<typeof router.push>[0]);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserAvatar name={user?.name} />
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-sm font-medium text-foreground">{user?.name}</span>
          <span className="text-[11px] text-muted-foreground capitalize">{user?.role}</span>
        </div>
        <ChevronDown className={cn(
          "hidden sm:block w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
          open && "rotate-180"
        )} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border bg-popover shadow-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* User info header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
            <UserAvatar name={user?.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              {t("my_account")}
            </Link>

            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              {t("settings_menu")}
            </Link>
            
            <button
              type="button"
              onClick={() => {
                setTheme(theme === "light" ? "dark" : "light");
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Sun className="w-4 h-4 text-muted-foreground" />
              )}
              {t("theme")}
            </button>
          </div>

          {/* Divider + logout */}
          <div className="border-t py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
