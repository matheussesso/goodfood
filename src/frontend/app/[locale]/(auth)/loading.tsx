import { Loader2 } from "lucide-react";

/** Instant loading state shown while an auth route segment streams in. */
export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
