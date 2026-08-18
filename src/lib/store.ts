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
