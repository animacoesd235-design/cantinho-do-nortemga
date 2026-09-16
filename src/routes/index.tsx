import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  Leaf,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { ProductMedia } from "@/components/ProductMedia";
import logo from "@/assets/logo-cantinho.png";
import {
  WHATSAPP,
  avulsos,
  brl,
  combos,
  type Produto,
} from "@/lib/menu-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cantinho do Norte — Kits e Garrafas de Açaí em Maringá" },
      {
        name: "description",
        content:
          "Kits de açaí, farinhas artesanais, camarão, tucupi e empório amazônico em Maringá/PR. Entrega e retirada — peça pelo WhatsApp.",
      },
      {
        property: "og:title",
        content: "Cantinho do Norte — Açaí e Empório",
      },
      {
        property: "og:description",
        content:
          "Garrafas de açaí puro e kits para montar em casa, direto da Amazônia. Peça pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cardapio,
});

type CartItem = {
  uid: string;
  nome: string;
  preco: number;
  qtd: number;
  detalhes?: string[];
};

const abas = [
  { id: "combos", nome: "Combos Especiais" },
  { id: "avulsos", nome: "Pronta Entrega (Avulsos)" },
] as const;

type AbaId = (typeof abas)[number]["id"];

function Cardapio() {
  const [aba, setAba] = useState<AbaId>("combos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartAberto, setCartAberto] = useState(false);

  const add = (item: Omit<CartItem, "uid" | "qtd">) => {
    setCart((prev) => {
      const chave = item.nome + (item.detalhes?.join("|") ?? "");
      const existente = prev.find(
        (p) => p.nome + (p.detalhes?.join("|") ?? "") === chave,
      );
      if (existente) {
        return prev.map((p) =>
          p.uid === existente.uid ? { ...p, qtd: p.qtd + 1 } : p,
        );
      }
      return [...prev, { ...item, uid: crypto.randomUUID(), qtd: 1 }];
    });
    toast.success("Adicionado ao pedido", { description: item.nome });
  };

  const mudarQtd = (uid: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((p) => (p.uid === uid ? { ...p, qtd: p.qtd + delta } : p))
        .filter((p) => p.qtd > 0),
    );

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.preco * i.qtd, 0),
    [cart],
  );
  const qtdTotal = cart.reduce((s, i) => s + i.qtd, 0);

  const enviarWhatsApp = () => {
    if (!cart.length) return;
    const linhas = cart.map((i) => {
      const extras = i.detalhes?.length
        ? `\n   ${i.detalhes.join("\n   ")}`
        : "";
      return `• ${i.qtd}x ${i.nome} — ${brl(i.preco * i.qtd)}${extras}`;
    });
    const msg = [
      "*Pedido — Cantinho do Norte*",
      "",
      ...linhas,
      "",
      `*Total: ${brl(total)}*`,
      "",
      "Nome:",
      "Entrega ou retirada:",
      "Endereço:",
      "Forma de pagamento:",
    ].join("\n");
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-gradient-sand pb-36">
      <Header />

      <nav className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl justify-center gap-2 px-3 py-3">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`tap whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                aba === a.id
                  ? "bg-gradient-forest text-forest-foreground shadow-[var(--shadow-soft)]"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {a.nome}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-3 pt-6">
        {aba === "combos" && (
          <Secao
            titulo="Combos Especiais"
            subtitulo="Kits completos para montar em casa, com economia."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {combos.map((p, i) => (
                <CardProduto
                  key={p.id}
                  produto={p}
                  priority={i === 0}
                  onAdd={() => add({ nome: p.nome, preco: p.preco })}
                />
              ))}
            </div>
          </Secao>
        )}

        {aba === "avulsos" && (
          <Secao
            titulo="Produtos a Pronta Entrega (Avulsos)"
            subtitulo="Garrafas, polpas e iguarias do norte, prontos para levar."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {avulsos.map((p) => (
                <CardProduto
                  key={p.id}
                  produto={p}
                  onAdd={() => add({ nome: p.nome, preco: p.preco })}
                />
              ))}
            </div>
          </Secao>
        )}
      </main>

      <CarrinhoFlutuante
        cart={cart}
        total={total}
        qtdTotal={qtdTotal}
        aberto={cartAberto}
        setAberto={setCartAberto}
        mudarQtd={mudarQtd}
        limpar={() => setCart([])}
        enviar={enviarWhatsApp}
      />
    </div>
  );
}

function Header() {
  return (
    <header className="relative overflow-hidden bg-gradient-forest px-4 pb-10 pt-10 text-forest-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.98 0.012 88) 0, transparent 40%), radial-gradient(circle at 85% 80%, oklch(0.79 0.15 82) 0, transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Logo Cantinho do Norte — Açaí e Empório"
            width={96}
            height={96}
            loading="eager"
            decoding="async"
            className="logo-ring h-24 w-24 rounded-full object-cover"
          />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground">
          <Leaf className="h-3.5 w-3.5" />
          Maringá / PR
        </div>
        <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight">
          Cantinho do Norte
        </h1>
        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] opacity-90">
          Açaí e Empório
        </p>
        <p className="mx-auto mt-4 inline-flex max-w-md items-start justify-center gap-2 rounded-2xl bg-acai/40 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          Garrafas de açaí puro e kits para montar em casa — Sem misturas!
        </p>
        <div className="mt-5 grid gap-1.5 text-xs opacity-90">
          <span className="flex items-center justify-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" /> Seg a Sáb · 11h às 22h ·
            Dom 14h às 21h
          </span>
          <span className="flex items-center justify-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> Entrega em Maringá e
            retirada na loja
          </span>
        </div>
      </div>
    </header>
  );
}

function Secao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="fade-up">
      <h2 className="text-2xl font-bold text-forest">{titulo}</h2>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">{subtitulo}</p>
      {children}
    </section>
  );
}

function CardProduto({
  produto,
  onAdd,
  priority,
}: {
  produto: Produto;
  onAdd: () => void;
  priority?: boolean | undefined;
}) {
  return (
    <article className="card-hover surface-craft group overflow-hidden rounded-2xl">
      <ProductMedia
        id={produto.id}
        fallback={produto.imagem}
        alt={produto.nome}
        priority={priority}
      />
      <div className="p-4">
        {produto.destaque && (
          <span className="mb-2 inline-block rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-gold-foreground">
            {produto.destaque}
          </span>
        )}
        <h3 className="text-base font-bold leading-snug text-forest">
          {produto.nome}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {produto.descricao}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-acai">
            {brl(produto.preco)}
          </span>
          <button
            onClick={onAdd}
            className="tap inline-flex items-center gap-1.5 rounded-full bg-gradient-acai px-4 py-2 text-sm font-semibold text-acai-foreground shadow-[var(--shadow-soft)]"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
      </div>
    </article>
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
  enviar,
}: {
  cart: CartItem[];
  total: number;
  qtdTotal: number;
  aberto: boolean;
  setAberto: (v: boolean) => void;
  mudarQtd: (uid: string, d: number) => void;
  limpar: () => void;
  enviar: () => void;
}) {
  if (!cart.length) return null;

  return (
    <>
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px]"
          onClick={() => setAberto(false)}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-4">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card/85 shadow-[var(--shadow-float)] backdrop-blur-md">
          {aberto && (
            <div className="max-h-[52vh] overflow-y-auto border-b border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-forest">Seu pedido</h3>
                <button
                  onClick={() => setAberto(false)}
                  aria-label="Fechar carrinho"
                  className="tap grid h-8 w-8 place-items-center rounded-full bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="grid gap-3">
                {cart.map((i) => (
                  <li key={i.uid} className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{i.nome}</p>
                      {i.detalhes?.map((d) => (
                        <p key={d} className="text-xs text-muted-foreground">
                          {d}
                        </p>
                      ))}
                      <p className="mt-0.5 text-sm font-bold text-acai">
                        {brl(i.preco * i.qtd)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-1 py-1">
                      <button
                        onClick={() => mudarQtd(i.uid, -1)}
                        aria-label="Diminuir"
                        className="tap grid h-7 w-7 place-items-center rounded-full bg-card"
                      >
                        {i.qtd === 1 ? (
                          <Trash2 className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="w-5 text-center text-sm font-bold">
                        {i.qtd}
                      </span>
                      <button
                        onClick={() => mudarQtd(i.uid, 1)}
                        aria-label="Aumentar"
                        className="tap grid h-7 w-7 place-items-center rounded-full bg-card"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={limpar}
                className="tap mt-4 text-xs font-semibold text-muted-foreground underline"
              >
                Esvaziar carrinho
              </button>
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3">
            <button
              onClick={() => setAberto(!aberto)}
              className="tap flex min-w-0 items-center gap-3 text-left"
            >
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-forest text-forest-foreground">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-gold-foreground">
                  {qtdTotal}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                  Subtotal
                </span>
                <span className="block truncate text-lg font-bold text-acai">
                  {brl(total)}
                </span>
              </span>
            </button>
            <button
              onClick={enviar}
              className="tap shrink-0 rounded-full bg-gradient-acai px-5 py-3 text-sm font-bold text-acai-foreground shadow-[var(--shadow-soft)]"
            >
              Finalizar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
