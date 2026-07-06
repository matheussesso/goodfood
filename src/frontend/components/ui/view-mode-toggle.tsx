"use client";

import { LayoutGrid, List as ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "card" | "list";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  labels: { grid: string; list: string };
  /** Renders the full-width mobile variant (icon + label) instead of the compact desktop one. */
  mobile?: boolean;
}

/**
 * Card/list view switcher used atop order and subscription list pages.
 *
 * @param viewMode - The currently active view mode.
 * @param onViewModeChange - Callback invoked with the newly selected mode.
 * @param labels - Translated labels for the mobile variant's buttons.
 * @param mobile - When true renders the full-width mobile variant.
 */
export function ViewModeToggle({ viewMode, onViewModeChange, labels, mobile }: ViewModeToggleProps) {
  return (
    <div className={cn("flex border rounded-md h-10 shrink-0", mobile ? "w-full sm:hidden" : "hidden sm:flex")}>
      <button
        type="button"
        onClick={() => onViewModeChange("card")}
        className={cn(
          "flex items-center justify-center gap-2 px-3 transition-colors rounded-l-md",
          mobile && "flex-1",
          viewMode === "card" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        {mobile && <span className="text-sm">{labels.grid}</span>}
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        className={cn(
          "flex items-center justify-center gap-2 px-3 transition-colors rounded-r-md",
          mobile && "flex-1",
          viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
        )}
      >
        <ListIcon className="w-4 h-4" />
        {mobile && <span className="text-sm">{labels.list}</span>}
      </button>
    </div>
  );
}
