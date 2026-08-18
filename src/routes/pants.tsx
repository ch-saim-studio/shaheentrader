import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/pants")({
  head: () => ({
    meta: [
      { title: "Pants — Shaheen Traders" },
      {
        name: "description",
        content: "Cargo pants, relaxed denim and tech joggers with everyday utility.",
      },
      { property: "og:title", content: "Pants — Shaheen Traders" },
      { property: "og:description", content: "Cargos, denim and joggers with real utility." },
    ],
  }),
  component: () => <CategoryPage slug="pants" />,
});
