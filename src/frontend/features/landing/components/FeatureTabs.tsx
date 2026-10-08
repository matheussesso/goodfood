"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FeatureTabItem {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  /** Illustrative mock screen shown while the tab is selected. */
  panel: ReactNode;
}

/**
 * Accessible tabs (arrow keys, Home/End) that pair each system feature with an
 * illustrative screen. The description is only open for the selected feature.
 *
 * @param items - Features with their title, description and mock screen.
 * @param label - Accessible name of the tab list.
 */
export function FeatureTabs({ items, label }: { items: FeatureTabItem[]; label: string }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    focusTab(keys[event.key]);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div role="tablist" aria-label={label} aria-orientation="vertical" className="flex flex-col">
        {items.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`feature-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`feature-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "flex min-h-16 flex-col border-l-4 py-4 pl-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                selected ? "border-gf-red text-white" : "border-white/15 text-white/55 hover:text-white/85"
              )}
            >
              <span className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                <span aria-hidden="true">{item.icon}</span>
                {item.title}
              </span>
              {selected && <span className="mt-2 max-w-md text-base font-normal leading-relaxed text-white/75">{item.description}</span>}
            </button>
          );
        })}
      </div>

      <div>
        {items.map((item, index) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`feature-panel-${item.id}`}
            aria-labelledby={`feature-tab-${item.id}`}
            hidden={index !== active}
            className="mx-auto max-w-md lg:max-w-none"
          >
            {item.panel}
          </div>
        ))}
      </div>
    </div>
  );
}
