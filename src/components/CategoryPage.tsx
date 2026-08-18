import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type CategorySlug, type Product } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

export function categoryQuery(slug: CategorySlug) {
  return {
    queryKey: ["products", slug],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", slug)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  };
}

export function CategoryPage({ slug }: { slug: CategorySlug }) {
  const meta = CATEGORIES.find((c) => c.slug === slug)!;
  const { data, isLoading } = useQuery(categoryQuery(slug));

  return (
    <div>
      <section className="relative h-56 overflow-hidden sm:h-72">
        <img
          src={meta.image}
          alt={meta.label}
          width={1024}
          height={1024}
          className="size-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6">
          <h1 className="text-display text-5xl sm:text-6xl">{meta.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.blurb}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            Nothing here yet — new {meta.label.toLowerCase()} drop soon.
          </p>
        )}
      </section>
    </div>
  );
}
