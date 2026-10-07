/**
 * Placeholder layout shown while the dashboard summary loads, matching the
 * real page so nothing jumps when data arrives.
 */
export function DashboardSkeleton() {
  const block = "animate-pulse rounded-xl bg-muted";

  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <div className={`${block} h-24`} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className={`${block} h-56`} />
        <div className={`${block} h-56`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${block} h-40`} />
        <div className={`${block} h-40`} />
        <div className={`${block} h-40`} />
      </div>
    </div>
  );
}
