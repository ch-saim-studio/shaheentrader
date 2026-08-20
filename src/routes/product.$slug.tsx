import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { availableStock, formatPrice, sizeStockOf, totalStock, type Product } from "@/lib/store";
import { useCart } from "@/lib/cart";
import { ProductReviews } from "@/components/ProductReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Shaheen Traders` },
      {
        name: "description",
        content: "Product details, sizes and pricing at Shaheen Traders streetwear store.",
      },
      { property: "og:title", content: `Shaheen Traders — ${params.slug.replace(/-/g, " ")}` },
      { property: "og:description", content: "Street-ready apparel and footwear from Shaheen Traders." },
    ],
  }),
  component: ProductDetail,
  errorComponent: () => <p className="p-10 text-center text-muted-foreground">Product unavailable.</p>,
  notFoundComponent: () => <p className="p-10 text-center text-muted-foreground">Product not found.</p>,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { add, lines } = useCart();
  const [size, setSize] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Product> => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const stockBySize = sizeStockOf(data);
  const remaining = totalStock(data);
  const soldOut = remaining <= 0;
  const selectedStock = availableStock(data, size);
  const inBag = lines
    .filter((l) => l.productId === data.id && (data.sizes.length === 0 || l.size === size))
    .reduce((s, l) => s + l.quantity, 0);

  function addToCart() {
    if (!data) return;
    if (data.sizes.length > 0 && !size) {
      toast.error("Pick a size first");
      return;
    }
    if (selectedStock <= 0) {
      toast.error("That size is out of stock");
      return;
    }
    if (inBag >= selectedStock) {
      toast.error(`Only ${selectedStock} left in stock`);
      return;
    }
    add({
      productId: data.id,
      name: data.name,
      price: Number(data.price),
      image: data.image_url,
      size,
    });
    toast.success(`${data.name} added to bag`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft className="mr-1 size-4" /> Back to store
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <img
            src={data.image_url}
            alt={data.name}
            width={1024}
            height={1024}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <Badge variant="secondary" className="uppercase tracking-wide">
            {data.category}
          </Badge>
          <h1 className="text-display mt-3 text-5xl">{data.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-primary">{formatPrice(data.price)}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{data.description}</p>

          {data.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select size
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.sizes.map((s) => {
                  const left = stockBySize[s] ?? 0;
                  const disabled = left <= 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={disabled}
                      title={disabled ? "Out of stock" : `${left} left`}
                      onClick={() => setSize(s)}
                      className={`relative min-w-12 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                        disabled
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60"
                          : size === s
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {size && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedStock > 0
                    ? `${selectedStock} left in size ${size}`
                    : `Size ${size} is out of stock`}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            {soldOut ? "Currently sold out" : `${remaining} in stock`}
          </p>

          <Button
            size="lg"
            className="mt-6 w-full font-semibold uppercase tracking-wide sm:w-auto"
            disabled={soldOut || (data.sizes.length > 0 && size !== null && selectedStock <= 0)}
            onClick={addToCart}
          >
            <ShoppingBag className="mr-2 size-4" /> Add to bag
          </Button>
        </div>
      </div>

      <ProductReviews productId={data.id} />
    </div>
  );
}
