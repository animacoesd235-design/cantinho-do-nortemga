import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bike,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-cantinho.png";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { brl } from "@/lib/menu-data";
import {
  isKitchenAuthenticated,
  loginKitchen,
  logoutKitchen,
  onAuthChange,
} from "@/lib/auth";
import {
  buildWhatsAppStatusUrl,
  clearOrders,
  deleteOrder,
  generateOrderId,
  getOrders,
  isOrderConfirmed,
  onOrdersUpdate,
  saveOrder,
  updateOrderStatus,
  type Order,
} from "@/lib/orders";

export const Route = createFileRoute("/cozinha")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Painel da Cozinha (KDS) — Cantinho do Norte" }],
  }),
  component: PainelCozinha,
});

function PainelCozinha() {
  const [autenticado, setAutenticado] = useState(() => isKitchenAuthenticated());
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [pedidoImprimir, setPedidoImprimir] = useState<Order | null>(null);

  useEffect(() => {
    return onAuthChange(() => {
      setAutenticado(isKitchenAuthenticated());
    });
  }, []);

  const handleLogout = () => {
    logoutKitchen();
    toast.info("Painel da Cozinha trancado com sucesso.");
  };

  useEffect(() => {
    if (!autenticado) return;
    setPedidos(getOrders());
    const cleanup = onOrdersUpdate(() => {
      setPedidos(getOrders());
    });
    return cleanup;
  }, [autenticado]);

  // FILTRO OBRIGATÓRIO: Apenas pedidos confirmados entram na esteira de produção da cozinha
  // Pedidos pagos via Pix aguardando QR Code/transferência NÃO são enviados para produção
  const pedidosProducao = pedidos.filter(isOrderConfirmed);
  const pixPendentes = pedidos.filter(
    (p) => p.pagamento.metodo === "pix" && p.pagamento.status !== "pago"
  );

  const novos = pedidosProducao.filter((p) => p.status === "novo");
  const emPreparo = pedidosProducao.filter((p) => p.status === "preparo");
  const prontos = pedidosProducao.filter((p) => p.status === "pronto");

  const handleImprimir = (pedido: Order) => {
    setPedidoImprimir(pedido);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const moverStatus = (orderId: string, novoStatus: Order["status"]) => {
    updateOrderStatus(orderId, novoStatus);
    toast.success(`Pedido ${orderId} atualizado para "${novoStatus.toUpperCase()}"!`);
  };

  const excluir = (orderId: string) => {
    deleteOrder(orderId);
    toast("Pedido removido");
  };

  const enviarZap = (
    pedido: Order,
    tipo: "etapa1_confirmacao" | "etapa2_preparo" | "etapa3_saiu_entrega"
  ) => {
    const url = buildWhatsAppStatusUrl(pedido, tipo);
    window.open(url, "_blank");
    toast.success("Mensagem do WhatsApp gerada com sucesso!");
  };

  const criarPedidoTeste = () => {
    const bairros = [
      "Zona 01",
      "Zona 03",
      "Jardim Alvorada",
      "Vila Operária",
      "Parque do Ingá",
      "Zona 07",
    ];
    const nomes = [
      "Carlos Mendes",
      "Juliana Ribeiro",
      "Felipe Rocha",
      "Mariana Costa",
      "Rodrigo Lima",
    ];
    const sorteioBairro = bairros[Math.floor(Math.random() * bairros.length)];
    const sorteioNome = nomes[Math.floor(Math.random() * nomes.length)];

    const teste: Order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      cliente: {
        nome: sorteioNome,
        telefone: "(44) 99887-1234",
      },
      endereco: {
        rua: "Av. Tiradentes",
        numero: String(Math.floor(100 + Math.random() * 900)),
        bairro: sorteioBairro,
        referencia: "Edifício Acácia, Apto 402 (Portaria)",
        cidade: "Maringá/PR",
      },
      itens: [
        {
          uid: crypto.randomUUID(),
          nome: "Kit Completo (1L Açaí + 500ml Farinha + 500ml Tapioca)",
          preco: 48,
          qtd: 1,
          isCombo: true,
          extras: [
            {
              nome: "250g Camarão Seco Salgado Selecionado",
              preco: 25,
            },
          ],
        },
      ],
      subtotal: 73,
      taxaEntrega: 7,
      total: 80,
      pagamento: {
        metodo: "pix",
        status: "pago",
      },
      status: "novo",
    };

    saveOrder(teste);
    toast.success("Pedido de teste criado no KDS!");
  };

  if (!autenticado) {
    return <TelaLoginCozinha onSucesso={() => setAutenticado(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0e1611] text-[#f4f7f4] pb-16 font-sans">
      {/* Barra de Topo do KDS */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a100c]/95 px-4 py-3.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Cantinho do Norte — A essência da Amazônia na sua mesa"
              className="h-11 w-11 rounded-full aspect-square object-contain ring-2 ring-forest shadow-md bg-black/40 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-display text-white leading-tight">
                  Painel da Cozinha • KDS & Expedição
                </h1>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Tempo Real
                </span>
                {pixPendentes.length > 0 && (
                  <span
                    title={`${pixPendentes.length} pedido(s) Pix aguardando pagamento do cliente. Só entrarão na produção após confirmação bancária.`}
                    className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1"
                  >
                    <Clock className="h-2.5 w-2.5" />
                    <span>{pixPendentes.length} Pix Aguardando</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60">
                Cantinho do Norte — A essência da Amazônia na sua mesa • Central 100% Delivery (Maringá/PR)
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Link
              to="/admin"
              className="tap inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-300 transition-colors shadow-xs"
            >
              <Settings className="h-3.5 w-3.5 text-amber-400" />
              <span>Painel Admin</span>
            </Link>

            <button
              onClick={criarPedidoTeste}
              className="tap inline-flex items-center gap-1.5 rounded-xl bg-forest/30 border border-forest/40 hover:bg-forest/50 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Simular Novo Pedido</span>
            </button>

            {pedidosProducao.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Deseja limpar todos os pedidos confirmados da tela?")) {
                    clearOrders();
                  }
                }}
                className="tap inline-flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-2 text-xs font-medium text-white/70 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpar Tela</span>
              </button>
            )}

            <Link
              to="/"
              className="tap inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Cardápio</span>
            </Link>

            <button
              onClick={handleLogout}
              className="tap inline-flex items-center gap-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3.5 py-2 text-xs font-bold text-red-300 transition-colors shadow-xs"
              title="Trancar Painel da Cozinha"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair / Trancar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Kanban de Comandas */}
      <main className="mx-auto max-w-7xl px-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna 1: Novos Pedidos */}
          <ColunaKanban
            titulo="Novos Pedidos"
            badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
            count={novos.length}
            descricao="Aguardando confirmação e separação"
          >
            {novos.map((pedido) => (
              <CardComanda
                key={pedido.id}
                pedido={pedido}
                onAvancar={() => {
                  moverStatus(pedido.id, "preparo");
                }}
                onEnviarZap={(tipo) => enviarZap(pedido, tipo)}
                btnTexto="Iniciar Preparo ⏳"
                onExcluir={() => excluir(pedido.id)}
                onImprimir={() => handleImprimir(pedido)}
              />
            ))}
            {novos.length === 0 && <EmptyColumn texto="Nenhum novo pedido na fila." />}
          </ColunaKanban>

          {/* Coluna 2: Em Preparo */}
          <ColunaKanban
            titulo="Em Preparo"
            badgeColor="bg-sky-500/20 text-sky-300 border-sky-500/30"
            count={emPreparo.length}
            descricao="Separando garrafas e potes lacrados"
          >
            {emPreparo.map((pedido) => (
              <CardComanda
                key={pedido.id}
                pedido={pedido}
                onAvancar={() => {
                  moverStatus(pedido.id, "pronto");
                }}
                onEnviarZap={(tipo) => enviarZap(pedido, tipo)}
                btnTexto="Marcar como Saiu para Entrega 🛵"
                onExcluir={() => excluir(pedido.id)}
                onImprimir={() => handleImprimir(pedido)}
              />
            ))}
            {emPreparo.length === 0 && (
              <EmptyColumn texto="Nenhum pedido sendo montado agora." />
            )}
          </ColunaKanban>

          {/* Coluna 3: Saiu para Entrega / Despachados */}
          <ColunaKanban
            titulo="Saiu para Entrega 🛵"
            badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            count={prontos.length}
            descricao="Motoboy a caminho do cliente (Alerta 5 min)"
          >
            {prontos.map((pedido) => (
              <CardComanda
                key={pedido.id}
                pedido={pedido}
                onAvancar={() => excluir(pedido.id)}
                onEnviarZap={(tipo) => enviarZap(pedido, tipo)}
                btnTexto="Concluir / Entregue ✅"
                isFinal={true}
                onExcluir={() => excluir(pedido.id)}
                onImprimir={() => handleImprimir(pedido)}
              />
            ))}
            {prontos.length === 0 && (
              <EmptyColumn texto="Nenhum motoboy em rota no momento." />
            )}
          </ColunaKanban>
        </div>
      </main>

      {/* Componente Invisível na tela, visível apenas na impressão (@media print) */}
      <ThermalReceipt order={pedidoImprimir} />

      {/* Botão Flutuante Rápido para o Admin */}
      <Link
        to="/admin"
        title="Ir para o Painel Administrativo"
        className="tap fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#121c15]/95 hover:bg-[#17251c] text-amber-200 border border-amber-500/40 px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-md transition-all hover:scale-105"
      >
        <Settings className="h-4 w-4 text-amber-400" />
        <span>⚙️ Painel Admin</span>
      </Link>
    </div>
  );
}

function ColunaKanban({
  titulo,
  badgeColor,
  count,
  descricao,
  children,
}: {
  titulo: string;
  badgeColor: string;
  count: number;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-[#121c15] p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h2 className="text-base font-bold font-display text-white">{titulo}</h2>
          <p className="text-[11px] text-white/50">{descricao}</p>
        </div>
        <span
          className={`grid h-7 min-w-7 place-items-center rounded-full border px-2 text-xs font-black ${badgeColor}`}
        >
          {count}
        </span>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-1">
        {children}
      </div>
    </div>
  );
}

function CardComanda({
  pedido,
  onAvancar,
  onEnviarZap,
  btnTexto,
  isFinal = false,
  onExcluir,
  onImprimir,
}: {
  pedido: Order;
  onAvancar: () => void;
  onEnviarZap: (
    tipo: "etapa1_confirmacao" | "etapa2_preparo" | "etapa3_saiu_entrega"
  ) => void;
  btnTexto: string;
  isFinal?: boolean;
  onExcluir: () => void;
  onImprimir: () => void;
}) {
  const hora = new Date(pedido.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const primeiroNome = (pedido.cliente.nome || "").trim().split(" ")[0] || "Cliente";

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[#17251c] p-4 shadow-md transition-all hover:border-white/20 space-y-3.5">
      {/* Topo da Comanda */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-amber-300 font-display">
            {pedido.id}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-white/60">
            <Clock className="h-3 w-3 text-white/40" />
            {hora}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {pedido.pagamento.status === "pago" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
              <Check className="h-2.5 w-2.5" /> PIX PAGO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
              PAGAR ENTREGA
            </span>
          )}

          <button
            onClick={onExcluir}
            title="Remover comanda"
            className="opacity-40 group-hover:opacity-100 hover:text-red-400 p-1 text-xs transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="flex items-start justify-between text-xs">
        <div>
          <span className="text-[11px] font-semibold text-white/50 block">
            Cliente
          </span>
          <span className="text-sm font-bold text-white">
            {pedido.cliente.nome}
          </span>
        </div>
        <a
          href={`https://wa.me/55${pedido.cliente.telefone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-500/30"
        >
          <Phone className="h-3 w-3" />
          {pedido.cliente.telefone}
        </a>
      </div>

      {/* Endereço de Entrega Completo */}
      <div className="rounded-xl bg-[#0d1710] p-3 border border-white/5 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>ENDEREÇO DE ENTREGA (DELIVERY):</span>
        </div>
        <p className="font-bold text-white text-xs leading-snug">
          {pedido.endereco.rua}, Nº {pedido.endereco.numero}
        </p>
        <p className="text-white/70 text-[11px]">
          Bairro: <span className="font-semibold text-white">{pedido.endereco.bairro}</span>
        </p>
        <p className="text-white/60 text-[11px] italic">
          Ref: {pedido.endereco.referencia}
        </p>
      </div>

      {/* Selo: Kits para Montar em Casa */}
      <div className="rounded-lg bg-forest/20 border border-forest/40 px-2.5 py-1 text-[10px] font-bold text-emerald-200 flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-amber-300 shrink-0" />
        <span>SEPARAÇÃO: GARRAFAS & POTES LACRADOS (MONTE EM CASA)</span>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-1.5 text-xs border-y border-white/10 py-2.5">
        {pedido.itens.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between font-bold text-white">
              <span>
                {item.qtd}x {item.nome}
              </span>
              <span className="text-amber-300">{brl(item.preco * item.qtd)}</span>
            </div>
            {item.extras && item.extras.length > 0 && (
              <div className="pl-3 space-y-0.5">
                {item.extras.map((ex, i) => (
                  <div key={i} className="text-[11px] text-white/70 flex justify-between">
                    <span>↳ Complemento: {ex.nome}</span>
                    <span className="text-white/50">+{brl(ex.preco)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Valor Total e Forma de Pagamento */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div>
          <span className="text-[10px] text-white/50 block">Pagamento</span>
          <span className="font-bold text-white text-[11px]">
            {pedido.pagamento.metodo === "pix"
              ? "Pix"
              : pedido.pagamento.metodo === "cartao_entrega"
              ? "Cartão na Entrega"
              : `Dinheiro ${pedido.pagamento.trocoPara ? `(Troco p/ R$ ${pedido.pagamento.trocoPara})` : ""}`}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-white/50 block">Total</span>
          <span className="text-base font-black text-amber-300 font-display">
            {brl(pedido.total)}
          </span>
        </div>
      </div>

      {/* GATILHOS DE NOTIFICAÇÃO WHATSAPP INTELIGENTES */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
          Disparos Rápidos WhatsApp:
        </span>

        <div className="grid grid-cols-1 gap-1.5">
          {pedido.status === "novo" && (
            <button
              onClick={() => onEnviarZap("etapa1_confirmacao")}
              className="tap flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-bold transition-colors"
            >
              <Send className="h-3 w-3 text-emerald-400" />
              <span>🌿 Avisar {primeiroNome} (Confirmado)</span>
            </button>
          )}

          {pedido.status === "preparo" && (
            <button
              onClick={() => onEnviarZap("etapa2_preparo")}
              className="tap flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-950/70 border border-sky-500/40 text-sky-300 hover:bg-sky-900/60 text-xs font-bold transition-colors"
            >
              <Package className="h-3.5 w-3.5 text-sky-400" />
              <span>👨‍🍳 Avisar {primeiroNome} (Em Preparo)</span>
            </button>
          )}

          {pedido.status === "pronto" && (
            <button
              onClick={() => onEnviarZap("etapa3_saiu_entrega")}
              className="tap flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-colors shadow-xs"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>🚨 Avisar {primeiroNome} (Saiu p/ Entrega)</span>
            </button>
          )}
        </div>
      </div>

      {/* Botão de Impressão Térmica */}
      <button
        type="button"
        onClick={onImprimir}
        className="tap w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-amber-200 text-xs font-bold transition-all shadow-xs"
      >
        <Printer className="h-3.5 w-3.5 text-amber-300" />
        <span>🖨️ Imprimir Comanda</span>
      </button>

      {/* Botão Principal de Avanço de Status */}
      <button
        onClick={onAvancar}
        className={`tap w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-md transition-all ${
          isFinal
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-95 text-white"
        }`}
      >
        <span>{btnTexto}</span>
        {!isFinal && <ArrowRight className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function EmptyColumn({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">
      <UtensilsCrossed className="h-8 w-8 mb-2 stroke-1 text-white/30" />
      <p className="text-xs">{texto}</p>
    </div>
  );
}

// =========================================================================
// TELA DE LOGIN DO PAINEL DA COZINHA (KDS)
// =========================================================================

function TelaLoginCozinha({ onSucesso }: { onSucesso: () => void }) {
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(false);
  const [tentando, setTentando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha.trim()) return;

    setTentando(true);
    setErro(false);

    setTimeout(() => {
      const ok = loginKitchen(senha);
      setTentando(false);
      if (ok) {
        toast.success("Acesso à Cozinha autorizado!");
        onSucesso();
      } else {
        setErro(true);
        toast.error("Senha incorreta. Verifique suas credenciais da cozinha.");
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#0e1611] text-[#f4f7f4] antialiased flex flex-col justify-between font-sans">
      {/* Header simplificado */}
      <header className="border-b border-white/10 bg-[#0a100c]/95 backdrop-blur-md px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="Cantinho do Norte"
              className="h-9 w-9 rounded-full object-cover border border-emerald-400/40 shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="block text-sm font-black font-display tracking-wide text-emerald-300">
                CANTINHO DO NORTE
              </span>
              <span className="block text-[11px] font-semibold text-white/60">
                Painel da Cozinha (KDS)
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao Cardápio</span>
          </Link>
        </div>
      </header>

      {/* Card Central de Login */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-[#0a100c] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Glows decorativos sutis */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Ícone de Cadeado com Selo de Cozinha */}
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/30 border border-emerald-400/30 text-emerald-300 shadow-inner">
                <Lock className="h-8 w-8 text-emerald-400" />
                <div className="absolute -bottom-1 -right-1 rounded-full bg-[#0a100c] p-0.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
              </div>

              <h1 className="text-xl font-black font-display tracking-wide text-emerald-300">
                Acesso à Cozinha (KDS)
              </h1>
              <p className="mt-1 text-xs text-white/60 max-w-xs">
                Área restrita à equipe de preparo e expedição de pedidos do Cantinho do Norte.
              </p>

              {/* Formulário de Senha */}
              <form onSubmit={handleSubmit} className="mt-6 w-full space-y-4 text-left">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-white/80">
                      Senha de Acesso
                    </label>
                    <span className="text-[10px] text-emerald-400/80 font-semibold">
                      Padrão: admin123
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value);
                        if (erro) setErro(false);
                      }}
                      placeholder="Digite a senha da cozinha ou admin..."
                      autoFocus
                      className={`w-full rounded-xl border bg-black/40 pl-3.5 pr-11 py-3 text-sm text-white placeholder-white/30 outline-none transition-all ${
                        erro
                          ? "border-red-500 ring-2 ring-red-500/20"
                          : "border-white/15 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
                    >
                      {mostrarSenha ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {erro && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Senha incorreta. Use a senha de acesso da cozinha ou admin.</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={tentando || !senha.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black py-3 px-4 font-black text-sm transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {tentando ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Desbloquear Cozinha</span>
                    </>
                  )}
                </button>
              </form>

              {/* Informações adicionais / Atalho */}
              <div className="mt-6 pt-4 border-t border-white/10 w-full flex items-center justify-between text-[11px] text-white/40">
                <span>Cantinho do Norte KDS</span>
                <Link to="/admin" className="hover:text-emerald-300 transition-colors">
                  Ir para Admin →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-white/30 border-t border-white/5">
        Área restrita de produção • Cantinho do Norte Maringá / PR
      </footer>
    </div>
  );
}
