import {
  CircleHelp,
  Dog,
  Factory,
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Translation keys of the `Navigation` namespace used as link labels. */
export type NavLabelKey =
  | "dashboard"
  | "dashboard_admin"
  | "customers"
  | "catalog"
  | "orders"
  | "pets"
  | "recipes"
  | "production"
  | "guide";

/** A single sidebar/navbar entry. */
export interface NavLink {
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
}

/**
 * Builds the navigation entries visible to a role. Roles without a dedicated
 * area (vet, petshop, delivery) only get the generic dashboard.
 *
 * @param role - The authenticated user's role (defaults to customer).
 * @returns Ordered navigation links.
 */
export function getNavLinks(role: string = "customer"): NavLink[] {
  const links: NavLink[] = [];

  if (role === "admin") {
    links.push(
      { href: "/admin", labelKey: "dashboard_admin", icon: LayoutDashboard },
      { href: "/admin/customers", labelKey: "customers", icon: Users },
      { href: "/admin/catalog", labelKey: "catalog", icon: PackageSearch },
      { href: "/admin/orders", labelKey: "orders", icon: ShoppingBag }
    );
  } else {
    links.push({ href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard });
  }

  if (role === "customer") {
    links.push(
      { href: "/pets", labelKey: "pets", icon: Dog },
      { href: "/recipes", labelKey: "recipes", icon: UtensilsCrossed },
      { href: "/orders", labelKey: "orders", icon: ShoppingBag },
      { href: "/guide", labelKey: "guide", icon: CircleHelp }
    );
  }

  if (role === "producer" || role === "admin") {
    links.push({ href: "/production", labelKey: "production", icon: Factory });
  }

  return links;
}

/**
 * Whether a link should render as active for the current path. Root-level
 * dashboards match exactly; everything else also matches nested routes.
 *
 * @param href - The link target.
 * @param pathname - The current locale-less pathname.
 */
export function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
