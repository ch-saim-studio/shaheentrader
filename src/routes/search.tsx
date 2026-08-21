import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, formatPrice, type Product } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>) => ({
    q: typeof raw["q"] === "string" ? raw["q"] : "",
    category: typeof raw["category"] === "string" ? raw["category"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Search Products — Shaheen Traders" },
      {
        name: "description",
        content:
          "Search Shaheen Traders streetwear and filter tees, hoodies, pants and shoes by size, category and price.",
      },
      { property: "og:title", content: "Search Products — Shaheen Traders" },
      {
        property: "og:description",
        content: "Find your fit fast — filter by size, category and price.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const initial = Route.useSearch();
  const [q, setQ] = useState(initial.q.slice(0, 100));
  const [categories, setCategories] = useState<string[]>(
    initial.category ? [initial.category] : [],
  );
  const [sizes, setSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);


  const { data, isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const products = useMemo(() => data ?? [], [data]);

  const priceCap = useMemo(
    () => Math.max(1000, ...products.map((p) => Math.ceil(Number(p.price) / 500) * 500)),
    [products],
  );
  const allSizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.sizes))).sort(),
    [products],
  );
  const price = maxPrice ?? priceCap;

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (term && !`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term))
        return false;
      if (categories.length > 0 && !categories.includes(p.category)) return false;
      if (sizes.length > 0 && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (Number(p.price) > price) return false;
      return true;
    });
  }, [products, q, categories, sizes, price]);

  const sorted = useMemo(() => {
    const list = [...results];
    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => Number(a.price) - Number(b.price));
      case "price-desc":
        return list.sort((a, b) => Number(b.price) - Number(a.price));
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "oldest":
        return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
      default:
        return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }, [results, sort]);

  const PER_PAGE = 9;
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paged = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const toggle = (value: string, list: string[], set: (v: string[]) => void) => {
    setPage(1);
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const activeFilters = categories.length + sizes.length + (maxPrice !== null ? 1 : 0);


  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-display text-5xl">Search</h1>

      <div className="relative mt-5">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value.slice(0, 100));
          }}

          placeholder="Search tees, hoodies, pants, shoes…"
          aria-label="Search products"
          className="h-12 pl-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="h-fit space-y-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider">Filters</p>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 cursor-pointer px-2 text-xs"
                onClick={() => {
                  setCategories([]);
                  setSizes([]);
                  setMaxPrice(null);
                }}
              >
                Reset
              </Button>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Badge
                  key={c.slug}
                  variant={categories.includes(c.slug) ? "default" : "outline"}
                  onClick={() => toggle(c.slug, categories, setCategories)}
                  className="cursor-pointer uppercase"
                >
                  {c.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Size
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {allSizes.length === 0 ? (
                <span className="text-xs text-muted-foreground">Loading…</span>
              ) : (
                allSizes.map((s) => (
                  <Badge
                    key={s}
                    variant={sizes.includes(s) ? "default" : "outline"}
                    onClick={() => toggle(s, sizes, setSizes)}
                    className="cursor-pointer"
                  >
                    {s}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Max price
            </p>
            <Slider
              value={[price]}
              min={500}
              max={priceCap}
              step={100}
              onValueChange={([v]) => {
                setPage(1);
                setMaxPrice(v ?? priceCap);
              }}
              className="mt-4 cursor-pointer"
            />
            <p className="mt-2 text-sm font-semibold text-primary">{formatPrice(price)}</p>
          </div>
        </aside>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Searching…"
                : `${sorted.length} product${sorted.length === 1 ? "" : "s"}${
                    sorted.length > 0 ? ` · page ${safePage} of ${totalPages}` : ""
                  }`}
            </p>
            <Select
              value={sort}
              onValueChange={(v) => {
                setPage(1);
                setSort(v);
              }}
            >
              <SelectTrigger className="w-[180px]" aria-label="Sort results">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="name">Name: A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full" />
              ))}
            </div>
          ) : paged.length > 0 ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
                {paged.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={safePage === i + 1 ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(safePage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              No products match those filters.
            </p>
          )}

        </section>
      </div>
    </div>
  );
}
