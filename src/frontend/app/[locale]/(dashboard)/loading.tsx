import { Loader2 } from "lucide-react";

/** Instant loading state shown while any dashboard route segment streams in. */
export default function DashboardLoading() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
