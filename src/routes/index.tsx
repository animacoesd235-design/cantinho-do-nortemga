import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bike,
  Clock,
  ExternalLink,
  Gift,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  Settings,
  UtensilsCrossed,
} from "lucide-react";

import { ProductMedia } from "@/components/ProductMedia";
import { ModalUpsell } from "@/components/ModalUpsell";
import { ModalCheckout } from "@/components/ModalCheckout";
import { ModalRastreio } from "@/components/ModalRastreio";
import { ModalSugestaoPreparo } from "@/components/ModalSugestaoPreparo";
import { SocialProofToast } from "@/components/SocialProofToast";
import logo from "@/assets/logo-cantinho.png";
import heroBg from "@/assets/hero-bg.jpg";
import {
  WHATSAPP,
  brl,
  type Produto,
} from "@/lib/menu-data";
import {
  getCategories,
  getCustomProducts,
  onCategoriesUpdate,
  onProductsUpdate,
  type Categoria,
} from "@/lib/products-store";
import {
  checkStoreOpenStatus,
  onStoreSettingsUpdate,
  type StoreStatusResult,
} from "@/lib/store-settings";
import {
  getLastOrderId,
  getOrderById,
  onOrdersUpdate,
  type ExtraItem,
  type Order,
  type OrderItem,
} from "@/lib/orders";

export const Route = createFileRoute("/")({
  head: () => ({
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
  component: Cardapio,
});

function Cardapio() {
  const [categorias, setCategorias] = useState<Categoria[]>(() => getCategories());
  const [aba, setAba] = useState<string>(() => {
    const cats = getCategories();
    return cats[0]?.id || "combos";
  });
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartAberto, setCartAberto] = useState(false);

  // Estados dos novos modais
  const [itemParaUpsell, setItemParaUpsell] = useState<{
    produto: Produto;
    isCombo?: boolean;
  } | null>(null);
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [rastreioOrderId, setRastreioOrderId] = useState<string | null>(null);
  const [pedidoAtivo, setPedidoAtivo] = useState<Order | null>(null);
  const [preparoAberto, setPreparoAberto] = useState(false);

  // Sincronização dinâmica de produtos, categorias e status da loja
  const [produtosData, setProdutosData] = useState(() => getCustomProducts());
  const [storeStatus, setStoreStatus] = useState<StoreStatusResult>(() => checkStoreOpenStatus());

  useEffect(() => {
    const cleanup = onProductsUpdate(() => {
      setProdutosData(getCustomProducts());
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const cleanup = onCategoriesUpdate(() => {
      const cats = getCategories();
      setCategorias(cats);
      setAba((atual) => (cats.some((c) => c.id === atual) ? atual : cats[0]?.id || "combos"));
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const checar = () => setStoreStatus(checkStoreOpenStatus());
    const cleanup = onStoreSettingsUpdate(checar);
    const timer = setInterval(checar, 60000);
    return () => {
      cleanup();
      clearInterval(timer);
    };
  }, []);

  // Sincroniza e monitora pedido ativo do cliente
  useEffect(() => {
    const checarPedidoAtivo = () => {
      const lastId = getLastOrderId();
      if (lastId) {
        const p = getOrderById(lastId);
        setPedidoAtivo(p);
      } else {
        setPedidoAtivo(null);
      }
    };

    checarPedidoAtivo();
    const cleanup = onOrdersUpdate(checarPedidoAtivo);
    return cleanup;
  }, []);

  const add = (item: Omit<OrderItem, "uid" | "qtd">) => {
    setCart((prev) => {
      const chave = item.nome + (item.detalhes?.join("|") ?? "");
      const existente = prev.find(
        (p) => p.nome + (p.detalhes?.join("|") ?? "") === chave
      );
      if (existente) {
        return prev.map((p) =>
          p.uid === existente.uid ? { ...p, qtd: p.qtd + 1 } : p
        );
      }
      return [...prev, { ...item, uid: crypto.randomUUID(), qtd: 1 }];
    });
    toast.success("Adicionado ao pedido", { description: item.nome });
  };

  const iniciarAdicao = (produto: Produto, isCombo?: boolean) => {
    setItemParaUpsell({ produto, isCombo });
  };

  const handleConfirmUpsell = (extras: ExtraItem[]) => {
    if (!itemParaUpsell) return;
    const { produto, isCombo } = itemParaUpsell;
    const valorExtras = extras.reduce((acc, curr) => acc + curr.preco, 0);
    const precoFinal = produto.preco + valorExtras;
    const detalhes = extras.map((e) => `+ ${e.nome}`);

    add({
      nome: produto.nome,
      preco: precoFinal,
      detalhes: detalhes.length ? detalhes : undefined,
      extras: extras.map((e) => ({ nome: e.nome, preco: e.preco })),
      isCombo,
    });
    setItemParaUpsell(null);
  };

  const handleSkipUpsell = () => {
    if (!itemParaUpsell) return;
    const { produto, isCombo } = itemParaUpsell;
    add({
      nome: produto.nome,
      preco: produto.preco,
      isCombo,
    });
    setItemParaUpsell(null);
  };

  const mudarQtd = (uid: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((p) => (p.uid === uid ? { ...p, qtd: p.qtd + delta } : p))
        .filter((p) => p.qtd > 0)
    );

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.preco * i.qtd, 0),
    [cart]
  );
  const qtdTotal = cart.reduce((s, i) => s + i.qtd, 0);

  const handleOrderCompleted = (order: Order) => {
    setCart([]);
    setCartAberto(false);
    setCheckoutAberto(false);
    // Abre imediatamente o Rastreamento em Tempo Real do pedido!
    setRastreioOrderId(order.id);
  };

  return (
    <div className="min-h-screen bg-gradient-sand pb-36">
      {/* Topo Absoluto: Selo de Status em Pílula Sutil e Aviso de Lote Diário */}
      <BarraSuperiorTopo status={storeStatus} />

      {/* Cabeçalho Clean e Sofisticado */}
      <HeroSection />

      {/* Botão de Acompanhamento Flutuante caso haja pedido em andamento */}
      {pedidoAtivo && (
        <div className="sticky top-16 z-20 flex justify-center px-4 py-2 pointer-events-none">
          <button
            onClick={() => setRastreioOrderId(pedidoAtivo.id)}
            className="tap pointer-events-auto inline-flex items-center gap-2 rounded-full bg-forest/95 hover:bg-forest text-white border border-white/20 shadow-lg px-4 py-1.5 text-xs font-bold backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2"
          >
            <Bike className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>
              Acompanhar Pedido {pedidoAtivo.id}{" "}
              {pedidoAtivo.status === "pronto"
                ? "• Motoboy a caminho! 🛵"
                : "• Em preparo na cozinha ⏳"}
            </span>
          </button>
        </div>
      )}

      {/* Abas de Navegação Fluidas em Pílula Centralizada */}
      <nav className="sticky top-0 z-30 border-b border-border/70 bg-background/95 py-2.5 sm:py-3 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-2xl justify-center px-4 overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center rounded-full bg-secondary/80 p-1 border border-border shadow-inner max-w-full overflow-x-auto no-scrollbar">
            {categorias.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`tap relative whitespace-nowrap rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 shrink-0 ${
                  aba === a.id
                    ? "bg-forest text-forest-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                }`}
              >
                {a.nome}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Grid de Produtos Dinâmico por Categoria */}
      <main className="mx-auto max-w-4xl px-4 pt-4 sm:pt-6">
        {categorias.map((cat) => {
          if (aba !== cat.id) return null;

          const prods = produtosData.todos.filter((p) => {
            if (p.ativo === false) return false;
            if (cat.id === "combos") return p.categoria === "combos" || p.categoria === "combo";
            if (cat.id === "avulsos") return p.categoria === "avulsos" || p.categoria === "avulso";
            return p.categoria === cat.id;
          });

          const isComboSection = cat.id === "combos";

          return (
            <section key={cat.id} className="fade-up mb-10">
              {prods.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-secondary/30 border border-border/40 text-muted-foreground">
                  <p className="text-sm font-medium">Nenhum produto disponível nesta categoria no momento.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {prods.map((p, i) => (
                    <CardProduto
                      key={p.id}
                      produto={p}
                      priority={i === 0}
                      isCombo={isComboSection}
                      onAdd={() => iniciarAdicao(p, isComboSection)}
                      onAbrirReceitas={() => setPreparoAberto(true)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* Rodapé com Horários, Status 100% Delivery e Link do KDS */}
      <Footer onAbrirRastreio={() => pedidoAtivo && setRastreioOrderId(pedidoAtivo.id)} temPedidoAtivo={!!pedidoAtivo} />

      {/* Carrinho Flutuante com Glassmorphism */}
      <CarrinhoFlutuante
        cart={cart}
        total={total}
        qtdTotal={qtdTotal}
        aberto={cartAberto}
        setAberto={setCartAberto}
        mudarQtd={mudarQtd}
        limpar={() => setCart([])}
        onAbrirCheckout={() => setCheckoutAberto(true)}
      />

      {/* Modal de Upselling Inteligente */}
      {itemParaUpsell && (
        <ModalUpsell
          produto={itemParaUpsell.produto}
          isCombo={itemParaUpsell.isCombo}
          onConfirm={handleConfirmUpsell}
          onSkip={handleSkipUpsell}
          onClose={() => setItemParaUpsell(null)}
        />
      )}

      {/* Modal de Checkout Exclusivo 100% Delivery & Pix */}
      {checkoutAberto && (
        <ModalCheckout
          cart={cart}
          total={total}
          onClose={() => setCheckoutAberto(false)}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {/* Modal de Rastreamento em Tempo Real */}
      {rastreioOrderId && (
        <ModalRastreio
          orderId={rastreioOrderId}
          onClose={() => setRastreioOrderId(null)}
        />
      )}

      {/* Modal de Sugestão de Preparo (Monte em Casa) */}
      {preparoAberto && (
        <ModalSugestaoPreparo onClose={() => setPreparoAberto(false)} />
      )}

      {/* Prova Social em Tempo Real (Toasts de Vendas) */}
      <SocialProofToast />
    </div>
  );
}

function BarraSuperiorTopo({ status }: { status: StoreStatusResult }) {
  const isPausa = status.reason === "manual_pause";

  const textoFechado = isPausa
    ? "🔴 Fechado / Pausado"
    : status.badgeText.toLowerCase().includes("abre")
    ? `🔴 Fechado • ${status.badgeText}`
    : status.badgeText.toLowerCase().includes("fechado")
    ? `🔴 ${status.badgeText}`
    : `🔴 Fechado • ${status.badgeText}`;

  return (
    <aside
      role="region"
      aria-label="Status de funcionamento e aviso de lote diário"
      className="relative z-40 bg-[#070c09] text-white border-b border-white/10 px-4 py-2 sm:py-1.5 shadow-2xs"
    >
      <div className="mx-auto flex max-w-4xl flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3.5 text-xs text-center">
        {/* Selo de Status em Pílula Sutil, Compacta e Dinâmica */}
        <div className="shrink-0 flex items-center justify-center">
          {status.isOpen ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-3 py-0.5 text-[11px] font-extrabold text-emerald-300 shadow-2xs backdrop-blur-md transition-all tracking-wide"
              title="Cantinho do Norte está aberto e entregando em Maringá"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>🟢 Aberto agora</span>
              {status.nextSchedule && (
                <span className="hidden lg:inline text-emerald-400/70 font-normal text-[10px]">
                  • {status.nextSchedule}
                </span>
              )}
            </span>
          ) : (
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                isPausa
                  ? "Olá! Vi no cardápio que a loja está em pausa no momento e gostaria de saber sobre pedidos."
                  : "Olá! Gostaria de tirar uma dúvida ou agendar um pedido com antecedência no Cantinho do Norte."
              )}`}
              target="_blank"
              rel="noreferrer"
              title="Atendimento pausado ou fechado no momento. Clique para falar no WhatsApp."
              className="tap inline-flex items-center gap-1.5 rounded-full bg-rose-950/80 hover:bg-rose-900/80 border border-rose-500/40 px-3 py-0.5 text-[11px] font-extrabold text-rose-300 shadow-2xs backdrop-blur-md transition-all tracking-wide"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
              </span>
              <span>{textoFechado}</span>
              <span className="text-rose-300/70 font-normal text-[10px]">
                (WhatsApp 💬)
              </span>
            </a>
          )}
        </div>

        {/* Separador visual sutil no desktop */}
        <span className="hidden sm:inline-block h-3 w-px bg-white/20" aria-hidden="true" />

        {/* Lote Diário / Aviso Completo Centralizado */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-amber-200/90 text-center">
          <span className="relative flex h-1.5 w-1.5 shrink-0 hidden sm:inline-flex">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          <p className="font-medium text-white/95 leading-snug">
            <strong className="font-bold text-amber-300">
              🌿 Lote artesanal:
            </strong>{" "}
            Restam poucas garrafas para entrega hoje em Maringá!
          </p>
          <span className="hidden md:inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] uppercase font-black tracking-wider text-amber-300 shrink-0">
            Últimas Garrafas
          </span>
        </div>
      </div>
    </aside>
  );
}

function HeroSection() {
  return (
    <header className="relative w-full overflow-hidden bg-[#090e0b] text-white">
      {/* Imagem de Fundo de Alta Qualidade */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Açaí artesanal e ambiente amazônico sofisticado"
          className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
          loading="eager"
        />
        {/* Filtro Escuro e Overlay Elegante em Camadas */}
        <div className="hero-overlay absolute inset-0 backdrop-blur-[1px]" />
      </div>

      {/* Conteúdo Centralizado do Banner - Compacto, Elegante e Focado no Topo (Acima da Dobra) */}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 py-5 sm:py-7 text-center">
        {/* Logo Oficial Redonda com Dimensões Refinadas */}
        <div className="relative group">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-gold/50 via-white/20 to-gold/50 opacity-60 blur-md group-hover:opacity-85 transition duration-300" />
          <img
            src={logo}
            alt="Cantinho do Norte — A essência da Amazônia na sua mesa"
            width={88}
            height={88}
            loading="eager"
            decoding="async"
            className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full aspect-square object-contain logo-ring bg-black/40 shadow-xl transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Tag Sutil e Polida */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full hero-badge px-3 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/90 shadow-2xs">
          <span>🌿 SABORES QUE VÊM DA NOSSA TERRA</span>
        </div>

        {/* Título Principal */}
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display drop-shadow-md">
          Cantinho do Norte
        </h1>

        {/* Subtítulo Direto com Reforço de 100% Delivery */}
        <p className="mt-1 max-w-md text-xs sm:text-sm font-medium text-emerald-100/90 leading-snug drop-shadow-xs">
          O autêntico açaí batido na garrafa e kits artesanais direto do Norte • 100% Delivery em Maringá
        </p>
      </div>
    </header>
  );
}

function CardProduto({
  produto,
  onAdd,
  onAbrirReceitas,
  priority,
  isCombo,
}: {
  produto: Produto;
  onAdd: () => void;
  onAbrirReceitas?: () => void;
  priority?: boolean | undefined;
  isCombo?: boolean;
}) {
  const economia =
    produto.economia ??
    (produto.precoOriginal ? produto.precoOriginal - produto.preco : 0);

  const temReceita =
    isCombo ||
    produto.id === "acai-litro" ||
    produto.nome.toLowerCase().includes("açaí") ||
    produto.nome.toLowerCase().includes("acai");

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card border border-border/80 shadow-[var(--shadow-card)] hover:shadow-2xl hover:border-gold/50 transition-all duration-300">
      <div>
        <div className="relative">
          <ProductMedia
            id={produto.id}
            fallback={produto.imagem}
            alt={produto.nome}
            priority={priority}
          />
          {/* Container Único Flexível com os Selos Empilhados Verticalmente */}
          {(produto.destaque || economia > 0) && (
            <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-4.5rem)] pointer-events-none">
              {/* Selo 1: Destaque na Linha Superior */}
              {produto.destaque && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-amber-950 px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider shadow-md border border-amber-300/80 backdrop-blur-md shrink-0">
                  <Sparkles className="h-3 w-3 text-amber-950 shrink-0" />
                  <span className="truncate">{produto.destaque}</span>
                </span>
              )}

              {/* Selo 2: Economia Logo Abaixo (Sem Absolute Individual) */}
              {economia > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 text-white px-2.5 sm:px-3 py-1 text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider shadow-md border border-emerald-400/40 backdrop-blur-md shrink-0">
                  Economia de {brl(economia)}
                </span>
              )}
            </div>
          )}

          {temReceita && onAbrirReceitas && (
            <div className="absolute left-2.5 bottom-2.5 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAbrirReceitas();
                }}
                aria-label="Ver sugestões de preparo do açaí"
                className="tap inline-flex items-center gap-1.5 rounded-full bg-black/80 hover:bg-black/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-amber-200 hover:text-white border border-amber-400/40 hover:border-amber-400 shadow-lg transition-all active:scale-95"
              >
                <span>📸 Sugestão de preparo (Monte em casa)</span>
              </button>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="text-lg font-bold leading-snug text-forest group-hover:text-acai transition-colors font-display">
            {produto.nome}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {produto.descricao}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-0 mt-auto">
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3.5">
          <div className="flex flex-col">
            {produto.precoOriginal ? (
              <>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground line-through font-medium">
                    De {brl(produto.precoOriginal)}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                    Economia de {brl(economia)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-acai">
                  <span className="text-xs font-bold text-acai/70">Por R$</span>
                  <span className="text-2xl font-black tracking-tight font-display">
                    {produto.preco.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Valor
                </span>
                <div className="flex items-baseline gap-1 text-acai">
                  <span className="text-xs font-bold text-acai/70">R$</span>
                  <span className="text-2xl font-black tracking-tight font-display">
                    {produto.preco.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onAdd}
            className="tap inline-flex items-center gap-1.5 rounded-full bg-gradient-acai px-5 py-2.5 text-xs sm:text-sm font-extrabold text-acai-foreground shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}

function Footer({
  onAbrirRastreio,
  temPedidoAtivo,
}: {
  onAbrirRastreio: () => void;
  temPedidoAtivo: boolean;
}) {
  return (
    <footer className="mt-16 border-t border-border/70 bg-card/50 pt-12 pb-24 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-4">
        {/* Card de Informações de Atendimento */}
        <div className="rounded-3xl border border-border/80 bg-background/80 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Marca e Status */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Cantinho do Norte — A essência da Amazônia na sua mesa"
                  className="h-12 w-12 rounded-full aspect-square object-contain ring-2 ring-forest/30 shadow-sm bg-black/40 shrink-0"
                />
                <div>
                  <h3 className="text-xl font-bold font-display text-forest leading-none">
                    Cantinho do Norte
                  </h3>
                  <p className="text-[11px] font-semibold text-gold-foreground uppercase tracking-widest mt-0.5">
                    A essência da Amazônia na sua mesa
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                O autêntico açaí batido na garrafa e kits artesanais direto do Norte.
              </p>
              {/* Status Aberto Agora com Ponto Verde Pulsante */}
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span>Aberto agora • Pedidos via WhatsApp</span>
              </div>
            </div>

            {/* Horários e Modalidade 100% Delivery */}
            <div className="grid gap-3 text-xs sm:text-sm text-center md:text-right">
              <div className="inline-flex items-center justify-center md:justify-end gap-2 text-foreground/90 font-medium">
                <Clock className="h-4 w-4 text-forest shrink-0" />
                <span>Seg a Sáb · 11h às 22h | Dom · 14h às 21h</span>
              </div>
              <div className="inline-flex items-center justify-center md:justify-end gap-2 text-foreground/90 font-bold text-forest">
                <Bike className="h-4 w-4 text-forest shrink-0" />
                <span>Atendimento 100% Delivery em Maringá/PR</span>
              </div>
              <div className="inline-flex items-center justify-center md:justify-end gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>Maringá — Paraná • Entregas rápidas com lacre de segurança</span>
              </div>
            </div>
          </div>

          {/* Links e Acessos Rápidos no Rodapé */}
          <div className="mt-6 pt-5 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {temPedidoAtivo && (
                <button
                  onClick={onAbrirRastreio}
                  className="tap inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 font-bold px-3 py-1.5 border border-amber-500/30 transition-colors"
                >
                  <Bike className="h-3.5 w-3.5 text-amber-600" />
                  <span>Rastrear Meu Pedido Ativo</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Link
                to="/admin"
                className="text-muted-foreground hover:text-amber-500 transition-colors inline-flex items-center gap-1 opacity-70 hover:opacity-100"
              >
                <span>🔒 Acesso Restrito</span>
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link
                to="/cozinha"
                className="text-muted-foreground hover:text-forest transition-colors inline-flex items-center gap-1 opacity-70 hover:opacity-100"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Painel Cozinha (KDS)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Linha final sutil */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Cantinho do Norte — O autêntico sabor da Amazônia em Maringá (100% Delivery).
        </div>
      </div>
    </footer>
  );
}

function CarrinhoFlutuante({
  cart,
  total,
  qtdTotal,
  aberto,
  setAberto,
  mudarQtd,
  limpar,
  onAbrirCheckout,
}: {
  cart: OrderItem[];
  total: number;
  qtdTotal: number;
  aberto: boolean;
  setAberto: (v: boolean) => void;
  mudarQtd: (uid: string, d: number) => void;
  limpar: () => void;
  onAbrirCheckout: () => void;
}) {
  if (!cart.length) return null;

  const META_VANTAGEM = 75;
  const falta = Math.max(0, META_VANTAGEM - total);
  const progressoPct = Math.min(100, Math.round((total / META_VANTAGEM) * 100));
  const alcancouMeta = total >= META_VANTAGEM;

  return (
    <>
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] transition-opacity"
          onClick={() => setAberto(false)}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-4 pointer-events-none">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl glass-dock shadow-[var(--shadow-float)] pointer-events-auto transition-all">
          {aberto && (
            <div className="max-h-[52vh] overflow-y-auto border-b border-border/80 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-forest flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-acai" />
                  Seu Pedido ({qtdTotal} {qtdTotal === 1 ? "item" : "itens"})
                </h3>
                <button
                  onClick={() => setAberto(false)}
                  aria-label="Fechar carrinho"
                  className="tap grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Barra de Progresso de Vantagem no Carrinho */}
              <div className="mb-4 rounded-2xl bg-forest/10 border border-forest/20 p-3 shadow-inner">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Gift className="h-4 w-4 text-amber-500 shrink-0 animate-bounce" />
                    <span>
                      {alcancouMeta ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                          🎉 Parabéns! Você garantiu Entrega Grátis & Brinde Surpresa!
                        </span>
                      ) : (
                        <span className="text-foreground">
                          Faltam apenas{" "}
                          <strong className="text-acai font-black">{brl(falta)}</strong>{" "}
                          para você garantir{" "}
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            Entrega Grátis / Brinde Surpresa!
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-forest">
                    {progressoPct}%
                  </span>
                </div>

                {/* Trilha e Preenchimento da Barra */}
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      alcancouMeta
                        ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse"
                        : "bg-gradient-to-r from-amber-500 to-forest"
                    }`}
                    style={{ width: `${progressoPct}%` }}
                  />
                </div>
              </div>

              <ul className="grid gap-3">
                {cart.map((i) => (
                  <li
                    key={i.uid}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-background/50 p-2.5 border border-border/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {i.nome}
                      </p>
                      {i.detalhes?.map((d) => (
                        <p key={d} className="text-xs text-muted-foreground truncate">
                          {d}
                        </p>
                      ))}
                      <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-acai">
                        {brl(i.preco * i.qtd)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary/80 px-1.5 py-1">
                      <button
                        onClick={() => mudarQtd(i.uid, -1)}
                        aria-label="Diminuir"
                        className="tap grid h-7 w-7 place-items-center rounded-full bg-card shadow-sm"
                      >
                        {i.qtd === 1 ? (
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="w-5 text-center text-xs font-bold">
                        {i.qtd}
                      </span>
                      <button
                        onClick={() => mudarQtd(i.uid, 1)}
                        aria-label="Aumentar"
                        className="tap grid h-7 w-7 place-items-center rounded-full bg-card shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={limpar}
                  className="tap text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors underline"
                >
                  Esvaziar carrinho
                </button>
                <span className="text-xs text-muted-foreground">
                  Entrega 100% Delivery em Maringá
                </span>
              </div>
            </div>
          )}

          {/* Micro-barra de progresso quando recolhido */}
          {!aberto && (
            <div className="w-full bg-black/10 h-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  alcancouMeta
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-amber-500 to-forest"
                }`}
                style={{ width: `${progressoPct}%` }}
              />
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 sm:p-3.5">
            <button
              onClick={() => setAberto(!aberto)}
              className="tap flex min-w-0 items-center gap-3 text-left"
            >
              <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-forest text-forest-foreground shadow-md">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-extrabold text-gold-foreground shadow">
                  {qtdTotal}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  {alcancouMeta ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      ✨ Frete Grátis Liberado!
                    </span>
                  ) : (
                    `Faltam ${brl(falta)} p/ Frete Grátis`
                  )}
                </span>
                <span className="block truncate text-xl font-black text-acai">
                  {brl(total)}
                </span>
              </span>
            </button>
            <button
              onClick={onAbrirCheckout}
              className="tap shrink-0 rounded-full bg-gradient-acai px-6 py-3.5 text-xs sm:text-sm font-extrabold text-acai-foreground shadow-md hover:opacity-95 transition-all"
            >
              Finalizar Pedido (Delivery)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
