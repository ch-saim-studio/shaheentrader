import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/tshirts")({
  head: () => ({
    meta: [
      { title: "T-Shirts — Shaheen Traders" },
      {
        name: "description",
        content: "Heavyweight cotton t-shirts with boxy street fits and bold prints.",
      },
      { property: "og:title", content: "T-Shirts — Shaheen Traders" },
      { property: "og:description", content: "Heavyweight cotton tees, boxy fits, bold prints." },
    ],
  }),
  component: () => <CategoryPage slug="tshirts" />,
});
