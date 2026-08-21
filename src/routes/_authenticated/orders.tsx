import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type Order, type OrderItem } from "@/lib/store";
import { OrderProgress, ORDER_STATUS_MESSAGES } from "@/components/OrderProgress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/ReviewForm";


export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Shaheen Traders" },
      { name: "description", content: "Track the status of your Shaheen Traders orders." },
      { property: "og:title", content: "My Orders — Shaheen Traders" },
      { property: "og:description", content: "Track your Shaheen Traders orders." },
    ],
  }),
  component: MyOrders,
});

type OrderWithItems = Order & { order_items: OrderItem[] };

function MyOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderWithItems[];
    },
  });

  // Notify the customer in-app whenever an order's status changes.
  const seen = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    if (!data) return;
    if (seen.current === null) {
      seen.current = new Map(data.map((o) => [o.id, o.status]));
      return;
    }
    for (const o of data) {
      const prev = seen.current.get(o.id);
      if (prev && prev !== o.status) {
        toast.info(`Order #${o.id.slice(0, 8).toUpperCase()} is now ${o.status}`, {
          description: ORDER_STATUS_MESSAGES[o.status],
        });
      }
      seen.current.set(o.id, o.status);
    }
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-display text-5xl">My orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Progress updates automatically — you'll get a notification when the status changes.
      </p>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : data && data.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {data.map((o) => (
            <li key={o.id} className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary" className="uppercase">
                  {o.status}
                </Badge>
              </div>

              <OrderProgress status={o.status} />

              <ul className="mt-4 space-y-2 border-t border-border pt-3">
                {o.order_items.map((it) => (
                  <li key={it.id} className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.image_url}
                        alt={it.product_name}
                        loading="lazy"
                        width={1024}
                        height={1024}
                        className="size-12 rounded-md object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {it.product_name}
                        {it.size ? ` · ${it.size}` : ""} × {it.quantity}
                      </span>
                      <span>{formatPrice(Number(it.price) * it.quantity)}</span>
                    </div>

                    {o.status === "delivered" &&
                      it.product_id &&
                      (reviewed.has(`${o.id}:${it.product_id}`) ? (
                        <p className="text-xs text-muted-foreground">
                          ✓ You reviewed this product — thank you!
                        </p>
                      ) : (
                        <ReviewForm
                          productId={it.product_id}
                          orderId={o.id}
                          productName={it.product_name}
                        />
                      ))}
                  </li>
                ))}
              </ul>

              <p className="mt-3 border-t border-border pt-3 text-right font-semibold text-primary">
                {formatPrice(o.total)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-lg border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Button asChild className="mt-4 font-semibold uppercase tracking-wide">
            <Link to="/tshirts">Start shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
