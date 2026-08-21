import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Shaheen Traders" },
      { name: "description", content: "Confirm your delivery details and place your order." },
      { property: "og:title", content: "Checkout — Shaheen Traders" },
      { property: "og:description", content: "Place your Shaheen Traders order." },
    ],
  }),
  component: Checkout,
});

type PayMethod = "cod" | "online";

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const { user, username } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PayMethod>("cod");

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || lines.length === 0) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);

    let paymentRef: string | null = null;
    if (method === "online") {
      // Demo gateway: no real money moves, we just simulate an approved charge.
      toast.loading("Processing demo payment…", { id: "demo-pay" });
      await new Promise((r) => setTimeout(r, 1500));
      paymentRef = `DEMO-${Date.now().toString(36).toUpperCase()}`;
      toast.success("Demo payment approved (no money charged)", { id: "demo-pay" });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? ""),

        address: String(form.get("address") ?? ""),
        total: subtotal,
        payment_method: method === "online" ? "online_demo" : "cod",
        payment_status: method === "online" ? "paid_demo" : "unpaid",
        payment_ref: paymentRef,
      })
      .select("id")
      .single();

    if (error || !order) {
      setBusy(false);
      toast.error("Could not place the order. Please try again.");
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.productId,
        product_name: l.name,
        image_url: l.image,
        size: l.size,
        quantity: l.quantity,
        price: l.price,
      })),
    );
    setBusy(false);

    if (itemsError) {
      toast.error("Order saved but items failed. Contact support.");
      return;
    }

    clear();
    toast.success("Order placed! We'll call you to confirm.");
    void navigate({ to: "/orders" });
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-display text-4xl">Nothing to check out</h1>
        <Button asChild className="mt-4 font-semibold uppercase tracking-wide">
          <Link to="/tshirts">Browse the store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-display text-5xl">Checkout</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <form onSubmit={placeOrder} className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={username ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (for order updates)</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" name="phone" type="tel" placeholder="03xx-xxxxxxx" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Delivery address</Label>
            <Textarea id="address" name="address" rows={4} required />
          </div>
          <p className="text-xs text-muted-foreground">Payment: cash on delivery.</p>
          <Button
            type="submit"
            size="lg"
            className="w-full font-semibold uppercase tracking-wide"
            disabled={busy}
          >
            Place order · {formatPrice(subtotal)}
          </Button>
        </form>

        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-wider">Order summary</p>
          <ul className="mt-3 space-y-3 text-sm">
            {lines.map((l) => (
              <li key={`${l.productId}-${l.size ?? ""}`} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate">{l.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {l.size ? `Size ${l.size} · ` : ""}Qty {l.quantity}
                  </span>
                </span>
                <span className="shrink-0">{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
