import { Link } from "@tanstack/react-router";
import { formatPrice, type Product } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-lg border border-border bg-card shadow-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.stock <= 0 && (
          <Badge variant="destructive" className="absolute left-3 top-3 uppercase">
            Sold out
          </Badge>
        )}
        {product.featured && product.stock > 0 && (
          <Badge className="absolute left-3 top-3 uppercase">Featured</Badge>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-lg leading-tight">{product.name}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
        <p className="pt-1 font-semibold text-primary">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
