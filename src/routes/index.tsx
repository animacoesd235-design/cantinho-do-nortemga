import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCategories, getCustomProducts, onCategoriesUpdate, onProductsUpdate } from "@/lib/products-store";
import { checkStoreOpenStatus, onStoreSettingsUpdate, type StoreStatusResult } from "@/lib/store-settings";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cantinho do Norte — Kits e Garrafas de Açaí em Maringá (100% Delivery)" },
      {
        name: "description",
        content: "Kits de açaí, farinhas artesanais, camarão, tucupi e empório amazônico em Maringá/PR. Atendimento 100% Delivery.",
      },
      { property: "og:title", content: "Cantinho do Norte — Açaí e Empório (100% Delivery)" },
      { property: "og:description", content: "Garrafas de açaí puro e kits lacrados para montar em casa. 100% Delivery em Maringá/PR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaInicial,
});

function PaginaInicial() {
  const [storeStatus, setStoreStatus] = useState<StoreStatusResult>(() => checkStoreOpenStatus());

  useEffect(() => {
    const checar = () => setStoreStatus(checkStoreOpenStatus());
    const cleanup = onStoreSettingsUpdate(checar);
    const timer = setInterval(checar, 60000);
    return () => {
      cleanup();
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#070c09] text-white">
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cantinho do Norte</h1>
        <p className="text-sm text-emerald-400">
          {storeStatus.isOpen ? "🟢 Aberto Agora" : "🔴 Fechado / Pausado"}
        </p>
        <p className="text-xs text-white/70 mt-2">O cardápio completo está a ser carregado...</p>
      </div>
    </main>
  );
}
