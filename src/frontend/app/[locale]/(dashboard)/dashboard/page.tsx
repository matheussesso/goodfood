"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";
import { getNavLinks } from "@/components/layout/nav-links";
import { ActiveSubscriptionCard } from "@/features/dashboard/components/ActiveSubscriptionCard";
import { AlertsBar } from "@/features/dashboard/components/AlertsBar";
import { ContinueSetupBanner } from "@/features/dashboard/components/ContinueSetupBanner";
import { CurrentOrderCard } from "@/features/dashboard/components/CurrentOrderCard";
import { DashboardPetCard } from "@/features/dashboard/components/DashboardPetCard";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";
import { GettingStarted } from "@/features/dashboard/components/GettingStarted";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentOrders } from "@/features/dashboard/components/RecentOrders";

/**
 * Staff roles without a customer account (producer, delivery, vet, pet shop)
 * land here: a greeting and shortcuts to the areas their role can open.
 */
function StaffDashboard({ role }: { role: string }) {
  const t = useTranslations("Navigation");
  const links = getNavLinks(role).filter((link) => link.href !== "/dashboard");

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map(({ href, labelKey, icon: Icon }) => (
        <li key={href}>
          <Link href={href} className="flex min-h-[72px] items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-medium">{t(labelKey)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Customer home. A new account sees a guided "getting started" path; an
 * active one sees alerts, the order and plan in progress, its pets and recent
 * orders. All data comes from a single `GET /dashboard` request.
 */
export default function DashboardPage() {
  const t = useTranslations("Navigation");
  const tDash = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const tOnboarding = useTranslations("Onboarding");
  const { user } = useAuth();
  const isCustomer = user?.role === "customer";
  const { data, isLoading, isError, refetch } = useDashboard(isCustomer);

  const firstName = user?.name?.split(" ")[0] ?? "";

  const header = (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("dashboard")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data && data.progress.next_step === "complete" ? tDash("greeting_active") : tDash("welcome_back", { name: user?.name ?? "" })}
      </p>
    </div>
  );

  if (user && !isCustomer) {
    return (
      <div className="space-y-6">
        {header}
        <StaffDashboard role={user.role} />
      </div>
    );
  }

  if (!user || isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        {header}
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
          <p className="font-medium text-foreground">{tDash("error_title")}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {tCommon("try_again")}
          </Button>
        </div>
      </div>
    );
  }

  const { progress, alerts } = data;
  const journeyDone = progress.next_step === "complete";
  const isFreshAccount = progress.pets_count === 0 && progress.orders_count === 0 && progress.subscriptions_count === 0;
  const showGuide = !journeyDone && !data.onboarding_dismissed;
  // A brand-new account only needs the guide; the empty sections would be noise.
  const showSections = !(isFreshAccount && showGuide);

  return (
    <div className="space-y-6">
      {header}

      {showGuide && <GettingStarted progress={progress} name={firstName} />}
      {!journeyDone && data.onboarding_dismissed && <ContinueSetupBanner progress={progress} />}

      <AlertsBar alerts={alerts} progress={progress} />

      {showSections && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <CurrentOrderCard order={data.current_order} />
            <ActiveSubscriptionCard subscription={data.active_subscription} />
          </div>

          <section aria-labelledby="dashboard-pets" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="dashboard-pets" className="text-base font-semibold">
                {tDash("section_pets")}
              </h2>
              <Link href="/pets/new">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden="true" /> {tDash("add_pet")}
                </Button>
              </Link>
            </div>
            {data.pets.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.pets.map((pet) => (
                  <DashboardPetCard key={pet.id} pet={pet} />
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed bg-card p-8 text-center">
                <p className="font-medium text-foreground">{tDash("no_pets_title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tDash("no_pets_desc")}</p>
                <Link href="/pets/new" className="mt-4 inline-block">
                  <Button>{tOnboarding("cta_pet")}</Button>
                </Link>
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentOrders orders={data.recent_orders} />
            </div>
            <QuickActions />
          </div>
        </>
      )}

      {!showSections && <QuickActions />}
    </div>
  );
}
