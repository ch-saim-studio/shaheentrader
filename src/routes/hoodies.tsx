import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/hoodies")({
  head: () => ({
    meta: [
      { title: "Hoodies — Shaheen Traders" },
      {
        name: "description",
        content: "Brushed fleece hoodies and zip-ups built for cold city nights.",
      },
      { property: "og:title", content: "Hoodies — Shaheen Traders" },
      { property: "og:description", content: "Brushed fleece hoodies and heavyweight zip-ups." },
    ],
  }),
  component: () => <CategoryPage slug="hoodies" />,
});
