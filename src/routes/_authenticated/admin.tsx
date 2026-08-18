import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Boxes, PackageCheck, ShoppingCart, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { OrdersManager, useAdminOrders } from "@/components/admin/OrdersManager";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Shaheen Traders" },
      { name: "description", content: "Manage products, orders and customers for Shaheen Traders." },
      { property: "og:title", content: "Admin Dashboard — Shaheen Traders" },
      { property: "og:description", content: "Store management for Shaheen Traders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-display text-4xl">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is restricted to the store administrator.
        </p>
        <Button asChild className="mt-5 font-semibold uppercase tracking-wide">
          <Link to="/">Back to store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-display text-5xl">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage the catalog, orders and customers of Shaheen Traders.
      </p>

      <Stats />

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <OrdersManager />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <ProductsManager />
        </TabsContent>
        <TabsContent value="customers" className="mt-6">
          <Customers />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stats() {
  const { data: orders = [] } = useAdminOrders();
  const { data: productCount = 0 } = useQuery({
    queryKey: ["admin", "product-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
  const { data: customerCount = 0 } = useQuery({
    queryKey: ["admin", "customer-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const pending = orders.filter((o) => o.status === "pending").length;

  const cards = [
    { icon: Wallet, label: "Revenue", value: formatPrice(revenue) },
    { icon: ShoppingCart, label: "Orders", value: String(orders.length) },
    { icon: PackageCheck, label: "Pending", value: String(pending) },
    { icon: Boxes, label: "Products", value: String(productCount) },
    { icon: Users, label: "Customers", value: String(customerCount) },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-4 shadow-card">
          <Icon className="size-4 text-primary" />
          <p className="mt-2 text-xl font-semibold">{value}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function Customers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div>
      <h2 className="text-display text-3xl">Customers ({data?.length ?? 0})</h2>
      <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
        {data?.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold">@{c.username}</p>
              {c.full_name && <p className="truncate text-xs text-muted-foreground">{c.full_name}</p>}
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
