import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/shoes")({
  head: () => ({
    meta: [
      { title: "Shoes — Shaheen Traders" },
      {
        name: "description",
        content: "Court runners, high-top trainers and everyday slip-ons for daily wear.",
      },
      { property: "og:title", content: "Shoes — Shaheen Traders" },
      { property: "og:description", content: "Court runners, high-tops and daily slip-ons." },
    ],
  }),
  component: () => <CategoryPage slug="shoes" />,
});
