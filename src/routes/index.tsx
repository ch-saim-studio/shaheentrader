import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type Product } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shaheen Traders — Streetwear T-Shirts, Hoodies, Pants & Shoes" },
      {
        name: "description",
        content:
          "Shop heavyweight t-shirts, fleece hoodies, cargo pants and sneakers at Shaheen Traders. Cash on delivery across Pakistan.",
      },
      { property: "og:title", content: "Shaheen Traders — Streetwear Store" },
      {
        property: "og:description",
        content: "Heavyweight tees, hoodies, pants and shoes built for the street.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <section className="relative min-h-[80vh] overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Model wearing a Shaheen Traders hoodie in a neon-lit alley"
          width={1600}
          height={1100}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            New season drop
          </p>
          <h1 className="text-display mt-3 text-6xl sm:text-8xl">
            Built for
            <br />
            the street
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Heavyweight tees, brushed-fleece hoodies, utility pants and sneakers — made to be worn
            hard.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-semibold uppercase tracking-wide">
              <Link to="/tshirts">
                Shop t-shirts <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold uppercase tracking-wide">
              <Link to="/shoes">Shop shoes</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-display text-4xl">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={c.path}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border shadow-card"
            >
              <img
                src={c.image}
                alt={c.label}
                loading="lazy"
                width={1024}
                height={1024}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-hero-fade" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-display text-2xl">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex items-end justify-between">
          <h2 className="text-display text-4xl">Featured picks</h2>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)
            : data?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Nationwide delivery", text: "2–4 days across Pakistan." },
            { icon: RefreshCw, title: "7-day exchange", text: "Wrong size? Swap it, no drama." },
            { icon: ShieldCheck, title: "Cash on delivery", text: "Pay when your order lands." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-1 size-5 text-primary" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
