import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_PIPELINE, ORDER_STATUS_STYLE, getOrderProgressStep, getOrderStatusStyle } from "@/lib/order-status";

/**
 * Horizontal progress timeline across the order pipeline.
 *
 * @param status - Current raw order status.
 * @param labelFor - Returns the translated label for a pipeline status.
 */
export function OrderStatusTimeline({
  status,
  labelFor,
}: {
  status: string;
  labelFor: (status: (typeof ORDER_PIPELINE)[number]) => string;
}) {
  const step = getOrderProgressStep(status);
  const currentStyle = getOrderStatusStyle(status);

  return (
    <div className="flex items-start">
      {ORDER_PIPELINE.map((pipelineStatus, idx) => {
        const done = idx < step;
        const current = idx === step;
        const style = ORDER_STATUS_STYLE[pipelineStatus];

        return (
          <div key={pipelineStatus} className="flex-1 flex flex-col items-center relative">
            {idx > 0 && (
              <div
                className={cn(
                  "absolute top-3.5 right-1/2 w-1/2 h-0.5 transition-colors",
                  done || current ? currentStyle.bar : "bg-border"
                )}
              />
            )}
            {idx < ORDER_PIPELINE.length - 1 && (
              <div
                className={cn(
                  "absolute top-3.5 left-1/2 w-1/2 h-0.5 transition-colors",
                  done ? currentStyle.bar : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                done ? `${style.dot} border-transparent` : current ? "bg-background border-primary" : "bg-background border-border"
              )}
            >
              {done ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : current ? (
                <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse", style.dot)} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-border" />
              )}
            </div>
            <p
              className={cn(
                "text-[10px] text-center mt-2 font-medium leading-tight px-1",
                current ? "text-foreground font-semibold" : done ? "text-muted-foreground" : "text-muted-foreground/40"
              )}
            >
              {labelFor(pipelineStatus)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
