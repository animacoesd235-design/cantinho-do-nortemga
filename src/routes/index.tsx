import { createFileRoute } from "@tanstack/react-router";
import { CardapioContent } from "@/components/CardapioContent";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    links: [
      {
        rel: "preload",
        as: "image",
        href: heroBg,
        fetchpriority: "high",
      },
    ],
    meta: [
      { title: "Cantinho do Norte — Kits e Garrafas de Açaí em Maringá (100% Delivery)" },
      {
        name: "description",
        content:
          "Kits de açaí, farinhas artesanais, camarão, tucupi e empório amazônico em Maringá/PR. Atendimento 100% Delivery.",
      },
      {
        property: "og:title",
        content: "Cantinho do Norte — Açaí e Empório (100% Delivery)",
      },
      {
        property: "og:description",
        content:
          "Garrafas de açaí puro e kits lacrados para montar em casa. 100% Delivery em Maringá/PR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardapioContent,
});
