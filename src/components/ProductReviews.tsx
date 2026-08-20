import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
};

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-4", n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground")}
        />
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, rating, title, comment, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="mt-10 h-32 w-full" />;

  const reviews = data ?? [];
  const average =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-display text-3xl">Customer reviews</h2>
        {reviews.length > 0 && (
          <>
            <Stars value={average} />
            <span className="text-sm text-muted-foreground">
              {average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No reviews yet — reviews can be left once an order has been delivered.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-semibold">{r.author_name || "Customer"}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Verified buyer
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
