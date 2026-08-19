import { Check, Clock, PackageCheck, Truck, Home, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "pending", label: "Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: PackageCheck },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
] as const;

export const ORDER_STATUS_MESSAGES: Record<string, string> = {
  pending: "Order received — we'll call you to confirm.",
  confirmed: "Order confirmed and being packed.",
  shipped: "On the way — your parcel has left our warehouse.",
  delivered: "Delivered. Enjoy the fit!",
  cancelled: "This order was cancelled.",
};

export function OrderProgress({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <XCircle className="size-4" /> {ORDER_STATUS_MESSAGES["cancelled"]}
      </div>
    );
  }

  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status),
  );

  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i <= current;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {i < current ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-1 mb-4 h-0.5 flex-1",
                    i < current ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {ORDER_STATUS_MESSAGES[status] ?? "Status update pending."}
      </p>
    </div>
  );
}
