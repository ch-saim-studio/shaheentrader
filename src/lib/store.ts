import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export type CategorySlug = "tshirts" | "hoodies" | "pants" | "shoes";

export const CATEGORIES: {
  slug: CategorySlug;
  label: string;
  path: "/tshirts" | "/hoodies" | "/pants" | "/shoes";
  image: string;
  blurb: string;
}[] = [
  {
    slug: "tshirts",
    label: "T-Shirts",
    path: "/tshirts",
    image: "/images/tshirts.jpg",
    blurb: "Heavyweight cotton, boxy fits, bold prints.",
  },
  {
    slug: "hoodies",
    label: "Hoodies",
    path: "/hoodies",
    image: "/images/hoodies.jpg",
    blurb: "Brushed fleece built for cold city nights.",
  },
  {
    slug: "pants",
    label: "Pants",
    path: "/pants",
    image: "/images/pants.jpg",
    blurb: "Cargos, denim and joggers with real utility.",
  },
  {
    slug: "shoes",
    label: "Shoes",
    path: "/shoes",
    image: "/images/shoes.jpg",
    blurb: "Court runners, high-tops and daily slip-ons.",
  },
];

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export type SizeStock = Record<string, number>;

/** Per-size stock map. Falls back to the overall stock when no per-size data is set. */
export function sizeStockOf(product: Pick<Product, "size_stock" | "sizes" | "stock">): SizeStock {
  const raw = product.size_stock;
  const map: SizeStock = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n)) map[k] = Math.max(0, Math.trunc(n));
    }
  }
  if (Object.keys(map).length > 0) return map;
  const fallback: SizeStock = {};
  for (const s of product.sizes) fallback[s] = product.stock;
  return fallback;
}

/** Units available for a given size (or overall stock when the product has no sizes). */
export function availableStock(
  product: Pick<Product, "size_stock" | "sizes" | "stock">,
  size: string | null,
): number {
  if (product.sizes.length === 0 || !size) return product.stock;
  const map = sizeStockOf(product);
  return map[size] ?? 0;
}

/** Total units in stock across all sizes. */
export function totalStock(product: Pick<Product, "size_stock" | "sizes" | "stock">): number {
  if (product.sizes.length === 0) return product.stock;
  return Object.values(sizeStockOf(product)).reduce((a, b) => a + b, 0);
}


export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@shaheentraders.app`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
