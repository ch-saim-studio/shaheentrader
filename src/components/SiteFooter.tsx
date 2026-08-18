import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/store";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="text-display text-2xl text-primary">SHAHEEN TRADERS</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Street-ready apparel and footwear. Built heavy, priced fair, shipped across Pakistan.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={c.path} className="transition-colors hover:text-primary">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider">Support</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Cash on delivery available</li>
            <li>7-day exchange policy</li>
            <li>help@shaheentraders.pk</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Shaheen Traders. All rights reserved.
      </div>
    </footer>
  );
}
