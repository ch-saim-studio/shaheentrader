import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, formatPrice, sizeStockOf, slugify, type Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Draft = {
  name: string;
  category: string;
  description: string;
  price: string;
  image_url: string;
  sizes: string;
  stock: string;
  sizeStock: string;

  featured: boolean;
};

const emptyDraft: Draft = {
  name: "",
  category: "tshirts",
  description: "",
  price: "",
  image_url: "/images/tshirts.jpg",
  sizes: "S, M, L, XL",
  stock: "10",
  sizeStock: "S:10, M:10, L:10, XL:10",

  featured: false,
};

export function ProductsManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const sizeList = draft.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const sizeStock: Record<string, number> = {};
      for (const pair of draft.sizeStock.split(",")) {
        const [key, value] = pair.split(":");
        const name = key?.trim();
        const n = Number(value);
        if (name && sizeList.includes(name) && Number.isFinite(n)) {
          sizeStock[name] = Math.max(0, Math.trunc(n));
        }
      }
      const totalFromSizes = Object.values(sizeStock).reduce((a, b) => a + b, 0);
      const payload = {
        name: draft.name.trim(),
        category: draft.category,
        description: draft.description.trim(),
        price: Number(draft.price || 0),
        image_url: draft.image_url.trim(),
        sizes: sizeList,
        size_stock: sizeStock,
        stock:
          Object.keys(sizeStock).length > 0 ? totalFromSizes : Number(draft.stock || 0),
        featured: draft.featured,
      };

      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert({ ...payload, slug: `${slugify(payload.name)}-${Date.now().toString(36).slice(-4)}` });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setDraft({
      name: p.name,
      category: p.category,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url,
      sizes: p.sizes.join(", "),
      stock: String(p.stock),
      sizeStock: Object.entries(sizeStockOf(p))
        .map(([s, n]) => `${s}:${n}`)
        .join(", "),
      featured: p.featured,

    });
    setOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-display text-3xl">Products ({products.length})</h2>
        <Button onClick={openNew} className="font-semibold uppercase tracking-wide">
          <Plus className="mr-1 size-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading products…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card"
            >
              <img
                src={p.image_url}
                alt={p.name}
                loading="lazy"
                width={1024}
                height={1024}
                className="size-14 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {formatPrice(p.price)} · stock {p.stock}
                </p>
              </div>
              {p.featured && <Badge className="hidden sm:inline-flex">Featured</Badge>}
              <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(p)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                className="text-destructive"
                onClick={() => setDeleting(p)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>Fields update the live storefront immediately.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={draft.category}
                onValueChange={(v) =>
                  setDraft({ ...draft, category: v, image_url: `/images/${v}.jpg` })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price (Rs)</Label>
                <Input
                  id="p-price"
                  type="number"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock (no sizes)</Label>
                <Input
                  id="p-stock"
                  type="number"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sizes">Sizes (comma separated)</Label>
              <Input
                id="p-sizes"
                value={draft.sizes}
                onChange={(e) => setDraft({ ...draft, sizes: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-size-stock">Stock per size (e.g. S:5, M:0, L:12)</Label>
              <Input
                id="p-size-stock"
                value={draft.sizeStock}
                onChange={(e) => setDraft({ ...draft, sizeStock: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Sizes with 0 are shown as sold out and cannot be added to a bag. Total stock is
                calculated from these numbers.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-image">Image URL</Label>
              <Input
                id="p-image"
                value={draft.image_url}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor="p-featured">Show on homepage</Label>
              <Switch
                id="p-featured"
                checked={draft.featured}
                onCheckedChange={(v) => setDraft({ ...draft, featured: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !draft.name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product from the store. Past orders keep their record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
