import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
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
import {
  WHATSAPP,
  bases,
  brl,
  doces,
  emporio,
  norte,
  pratos,
  tamanhos,
  type Produto,
} from "@/lib/menu-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cantinho do Norte — Açaí da Amazônia em Maringá" },
      {
        name: "description",
        content:
          "Açaí puro da Amazônia, camarão seco, farinhas artesanais e empório do norte em Maringá/PR. Peça pelo WhatsApp em segundos.",
      },
      { property: "og:title", content: "Cantinho do Norte — Açaí e Empório" },
      {
        property: "og:description",
        content:
          "O autêntico açaí da Amazônia em Maringá, sem misturas. Monte seu bowl e peça pelo WhatsApp.",
      },
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
  { id: "cardapio", nome: "Cardápio & Açaí" },
  { id: "monte", nome: "Monte seu Bowl" },
  { id: "emporio", nome: "Empório do Norte" },
] as const;

type AbaId = (typeof abas)[number]["id"];

function Cardapio() {
  const [aba, setAba] = useState<AbaId>("cardapio");
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
      "Endereço / Retirada:",
      "Forma de pagamento:",
    ].join("\n");
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-background pb-36">
      <Header />

      <nav className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-3 py-3">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`tap whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                aba === a.id
                  ? "bg-gradient-forest text-forest-foreground shadow-[var(--shadow-soft)]"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {a.nome}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-3 pt-5">
        {aba === "cardapio" && (
          <Secao
            titulo="Pratos & Combos do Norte"
            subtitulo="Feitos na hora com ingredientes que vêm direto do Pará."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {pratos.map((p, i) => (
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

        {aba === "monte" && <MonteSeuBowl onAdd={add} />}

        {aba === "emporio" && (
          <Secao
            titulo="Empório do Norte"
            subtitulo="Leve o sabor da Amazônia para a sua cozinha."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {emporio.map((p) => (
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
    <header className="bg-gradient-forest px-4 pb-8 pt-9 text-forest-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground">
          <Leaf className="h-3.5 w-3.5" />
          Maringá / PR
        </div>
        <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight">
          Cantinho do Norte
        </h1>
        <p className="mt-1 text-sm font-medium opacity-90">Açaí e Empório</p>
        <p className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-acai/60 px-3 py-2 text-sm font-semibold">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          O autêntico Açaí da Amazônia em Maringá — Sem misturas!
        </p>
        <div className="mt-4 grid gap-1.5 text-xs opacity-90">
          <span className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" /> Seg a Sáb · 11h às 22h ·
            Dom 14h às 21h
          </span>
          <span className="flex items-center gap-2">
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
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{subtitulo}</p>
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
    <article className="surface-craft overflow-hidden rounded-2xl">
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
        <p className="mt-1 text-sm text-muted-foreground">{produto.descricao}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-acai">{brl(produto.preco)}</span>
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

function Opcao({
  ativo,
  titulo,
  extra,
  onClick,
}: {
  ativo: boolean;
  titulo: string;
  extra?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`tap flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
        ativo
          ? "border-acai bg-acai/10 text-acai"
          : "border-border bg-card text-foreground"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
            ativo ? "border-acai bg-acai text-acai-foreground" : "border-border"
          }`}
        >
          {ativo && <Check className="h-3 w-3" />}
        </span>
        {titulo}
      </span>
      {extra ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          + {brl(extra)}
        </span>
      ) : null}
    </button>
  );
}

function MonteSeuBowl({
  onAdd,
}: {
  onAdd: (i: { nome: string; preco: number; detalhes?: string[] }) => void;
}) {
  const [tamanho, setTamanho] = useState(tamanhos[1]!.id);
  const [base, setBase] = useState(bases[0]!.id);
  const [selDoces, setSelDoces] = useState<string[]>([]);
  const [selNorte, setSelNorte] = useState<string[]>([]);

  const t = tamanhos.find((x) => x.id === tamanho)!;
  const b = bases.find((x) => x.id === base)!;
  const nortes = norte.filter((x) => selNorte.includes(x.id));
  const docesSel = doces.filter((x) => selDoces.includes(x.id));
  const preco =
    t.preco + b.preco + nortes.reduce((s, x) => s + x.preco, 0);

  const toggleDoce = (id: string) =>
    setSelDoces((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 3) {
        toast("Máximo de 3 adicionais doces");
        return prev;
      }
      return [...prev, id];
    });

  const toggleNorte = (id: string) =>
    setSelNorte((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  return (
    <section className="fade-up">
      <h2 className="text-2xl font-bold text-forest">Monte seu Açaí / Bowl</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Quatro passos e o seu bowl sai do jeito que você gosta.
      </p>

      <Passo n={1} titulo="Escolha o tamanho">
        <div className="grid gap-2">
          {tamanhos.map((x) => (
            <Opcao
              key={x.id}
              ativo={tamanho === x.id}
              titulo={`${x.nome} — ${brl(x.preco)}`}
              onClick={() => setTamanho(x.id)}
            />
          ))}
        </div>
      </Passo>

      <Passo n={2} titulo="Base / creme">
        <div className="grid gap-2">
          {bases.map((x) => (
            <Opcao
              key={x.id}
              ativo={base === x.id}
              titulo={x.nome}
              extra={x.preco}
              onClick={() => setBase(x.id)}
            />
          ))}
        </div>
      </Passo>

      <Passo n={3} titulo={`Adicionais doces (${selDoces.length}/3)`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {doces.map((x) => (
            <Opcao
              key={x.id}
              ativo={selDoces.includes(x.id)}
              titulo={x.nome}
              onClick={() => toggleDoce(x.id)}
            />
          ))}
        </div>
      </Passo>

      <Passo n={4} titulo="Toques do Norte (opcional)">
        <div className="grid gap-2 sm:grid-cols-2">
          {norte.map((x) => (
            <Opcao
              key={x.id}
              ativo={selNorte.includes(x.id)}
              titulo={x.nome}
              extra={x.preco}
              onClick={() => toggleNorte(x.id)}
            />
          ))}
        </div>
      </Passo>

      <div className="surface-craft sticky bottom-24 mt-5 flex items-center justify-between gap-3 rounded-2xl p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Seu bowl</p>
          <p className="truncate text-lg font-bold text-acai">{brl(preco)}</p>
        </div>
        <button
          onClick={() =>
            onAdd({
              nome: `Bowl montado (${t.nome})`,
              preco,
              detalhes: [
                `Base: ${b.nome}`,
                docesSel.length
                  ? `Doces: ${docesSel.map((d) => d.nome).join(", ")}`
                  : "Sem adicionais doces",
                nortes.length
                  ? `Toques do Norte: ${nortes.map((d) => d.nome).join(", ")}`
                  : "",
              ].filter(Boolean),
            })
          }
          className="tap inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-acai px-5 py-2.5 text-sm font-semibold text-acai-foreground"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </section>
  );
}

function Passo({
  n,
  titulo,
  children,
}: {
  n: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-craft mb-4 rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-forest text-xs font-bold text-forest-foreground">
          {n}
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-forest">
          {titulo}
        </h3>
      </div>
      {children}
    </div>
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
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card/80 shadow-[var(--shadow-float)] backdrop-blur-md">
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
