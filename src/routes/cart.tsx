import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Shaheen Traders" },
      { name: "description", content: "Review the items in your Shaheen Traders shopping bag." },
      { property: "og:title", content: "Your Bag — Shaheen Traders" },
      { property: "og:description", content: "Review your items and checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQuantity, remove } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-display text-5xl">Your bag</h1>

      {lines.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Your bag is empty.</p>
          <Button asChild className="mt-4 font-semibold uppercase tracking-wide">
            <Link to="/tshirts">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {lines.map((l) => (
              <li
                key={`${l.productId}-${l.size ?? ""}`}
                className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-card"
              >
                <img
                  src={l.image}
                  alt={l.name}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="size-20 shrink-0 rounded-md object-cover sm:size-24"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.name}</p>
                  {l.size && <p className="text-xs text-muted-foreground">Size {l.size}</p>}
                  <p className="mt-1 text-sm text-primary">{formatPrice(l.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(l.productId, l.size, l.quantity - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(l.productId, l.size, l.quantity + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto size-8 text-destructive"
                      aria-label="Remove item"
                      onClick={() => remove(l.productId, l.size)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold uppercase tracking-wide">Subtotal</span>
              <span className="font-semibold text-primary">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Shipping calculated at delivery.</p>
            <Button asChild size="lg" className="mt-4 w-full font-semibold uppercase tracking-wide">
              <Link to="/checkout">Checkout</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
