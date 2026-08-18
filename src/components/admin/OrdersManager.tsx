import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, ORDER_STATUSES, type Order, type OrderItem } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export type AdminOrder = Order & { order_items: OrderItem[] };

export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async (): Promise<AdminOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminOrder[];
    },
  });
}

export function OrdersManager() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useAdminOrders();

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div>
      <h2 className="text-display text-3xl">Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm">
                    {o.customer_name} · {o.phone}
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">{o.address}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="uppercase">
                    {o.status}
                  </Badge>
                  <Select
                    value={o.status}
                    onValueChange={(status) => setStatus.mutate({ id: o.id, status })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {o.order_items.map((it) => (
                  <li key={it.id}>
                    {it.product_name}
                    {it.size ? ` · ${it.size}` : ""} × {it.quantity} —{" "}
                    {formatPrice(Number(it.price) * it.quantity)}
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-border pt-2 text-right font-semibold text-primary">
                {formatPrice(o.total)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
