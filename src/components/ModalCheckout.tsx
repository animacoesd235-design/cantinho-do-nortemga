import { useState } from "react";
import {
  Bike,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { WHATSAPP, brl } from "@/lib/menu-data";
import {
  generateOrderId,
  saveOrder,
  type DeliveryAddress,
  type Order,
  type OrderItem,
} from "@/lib/orders";

interface ModalCheckoutProps {
  cart: OrderItem[];
  total: number;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
}

export function ModalCheckout({
  cart,
  total,
  onClose,
  onOrderCompleted,
}: ModalCheckoutProps) {
  const taxaEntrega = total >= 100 ? 0 : 7;
  const totalGeral = total + taxaEntrega;

  // Form states
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [referencia, setReferencia] = useState("");

  // Payment states
  const [metodoPagamento, setMetodoPagamento] = useState<
    "pix" | "cartao_entrega" | "dinheiro_entrega"
  >("pix");
  const [trocoPara, setTrocoPara] = useState("");

  // Pix interaction
  const [pixCopiado, setPixCopiado] = useState(false);
  const [pixAprovado, setPixAprovado] = useState(false);
  const chavePixSimulada = "00020126580014br.gov.bcb.pix0136cantinho-norte-maringa-acai-artesanal5204000053039865405" + totalGeral.toFixed(2) + "5802BR5918CANTINHO DO NORTE6007MARINGA62070503***6304";

  const copiarPix = () => {
    navigator.clipboard.writeText(chavePixSimulada);
    setPixCopiado(true);
    toast.success("Chave Pix Copia e Cola copiada com sucesso!");
    setTimeout(() => setPixCopiado(false), 3000);
  };

  const simularPagamentoAprovado = () => {
    setPixAprovado(true);
    toast.success("Pagamento via Pix confirmado!", {
      description: "Seu pedido foi aprovado e enviado para a cozinha.",
    });
    setTimeout(() => {
      finalizarPedido("pago");
    }, 1200);
  };

  const validarFormulario = () => {
    if (!nome.trim()) {
      toast.error("Por favor, preencha seu nome.");
      return false;
    }
    if (!telefone.trim()) {
      toast.error("Por favor, informe seu WhatsApp.");
      return false;
    }
    if (!rua.trim()) {
      toast.error("Informe a Rua / Avenida de entrega.");
      return false;
    }
    if (!numero.trim()) {
      toast.error("Informe o Número do endereço.");
      return false;
    }
    if (!bairro.trim()) {
      toast.error("Informe o Bairro de entrega.");
      return false;
    }
    if (!referencia.trim()) {
      toast.error("Informe um Ponto de Referência para o entregador.");
      return false;
    }
    return true;
  };

  const finalizarPedido = (statusPagamento: "pago" | "pendente" = "pendente") => {
    if (!validarFormulario()) return;

    const endereco: DeliveryAddress = {
      rua: rua.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      referencia: referencia.trim(),
      cidade: "Maringá/PR",
    };

    const novoPedido: Order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      cliente: {
        nome: nome.trim(),
        telefone: telefone.trim(),
      },
      endereco,
      itens: cart,
      subtotal: total,
      taxaEntrega,
      total: totalGeral,
      pagamento: {
        metodo: metodoPagamento,
        status: statusPagamento,
        trocoPara: metodoPagamento === "dinheiro_entrega" ? trocoPara : undefined,
      },
      status: "novo",
    };

    // Salva no KDS (localStorage com sync em tempo real)
    saveOrder(novoPedido);

    // Formata mensagem do WhatsApp
    const linhasItens = cart.map((i) => {
      const extras = i.extras?.length
        ? `\n     ↳ Complementos: ${i.extras.map((e) => e.nome).join(", ")}`
        : "";
      return `• ${i.qtd}x ${i.nome} — ${brl(i.preco * i.qtd)}${extras}`;
    });

    const textoPagamento =
      metodoPagamento === "pix"
        ? statusPagamento === "pago"
          ? "✅ Pix (Aprovado Instantaneamente)"
          : "⏳ Pix (Comprovante em anexo)"
        : metodoPagamento === "cartao_entrega"
        ? "💳 Cartão na Entrega (Levar maquininha)"
        : `💵 Dinheiro na Entrega ${trocoPara ? `(Troco p/ R$ ${trocoPara})` : ""}`;

    const msg = [
      `*PEDIDO ${novoPedido.id} — CANTINHO DO NORTE*`,
      `🛵 *Atendimento 100% Delivery (Maringá/PR)*`,
      "",
      `*Cliente:* ${novoPedido.cliente.nome}`,
      `*WhatsApp:* ${novoPedido.cliente.telefone}`,
      "",
      `📍 *ENDEREÇO DE ENTREGA:*`,
      `${endereco.rua}, Nº ${endereco.numero}`,
      `Bairro: ${endereco.bairro}`,
      `Referência: ${endereco.referencia}`,
      `Cidade: ${endereco.cidade}`,
      "",
      `📦 *ITENS DO PEDIDO (Garrafas e potes lacrados):*`,
      ...linhasItens,
      "",
      `Subtotal: ${brl(total)}`,
      `Taxa de Entrega: ${taxaEntrega === 0 ? "GRÁTIS" : brl(taxaEntrega)}`,
      `*TOTAL: ${brl(totalGeral)}*`,
      "",
      `*Forma de Pagamento:* ${textoPagamento}`,
      "",
      `_Pedido enviado automaticamente para a cozinha!_`,
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );

    onOrderCompleted(novoPedido);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl transition-all">
        {/* Header do Checkout */}
        <div className="flex items-center justify-between border-b border-border/70 p-4 sm:p-5 bg-gradient-forest text-forest-foreground">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white">
              <Bike className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold font-display leading-tight">
                Finalizar Pedido — 100% Delivery
              </h3>
              <p className="text-xs text-white/80">
                Entrega expressa com lacre de segurança em Maringá
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="tap grid h-8 w-8 place-items-center rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Seção 1: Dados do Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5">
              <span>1. Seus Dados de Contato</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ana Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  WhatsApp / Celular *
                </label>
                <input
                  type="tel"
                  placeholder="(44) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço Obrigatório de Entrega */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-forest flex items-center gap-1.5">
                <span>2. Endereço Completo de Entrega (Obrigatório)</span>
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-bold text-forest">
                Maringá/PR
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Rua / Avenida *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Brasil"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1234"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Zona 01"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Ponto de Referência *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Próximo ao parque / Apto 302"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Forma de Pagamento */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-forest">
              3. Forma de Pagamento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMetodoPagamento("pix")}
                className={`tap p-3 rounded-2xl border text-left flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2 transition-all ${
                  metodoPagamento === "pix"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500"
                    : "bg-background/60 border-border hover:border-gold/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500 text-white shrink-0">
                    <QrCode className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-bold leading-tight text-foreground">
                      Pix
                    </span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Instantâneo
                    </span>
                  </div>
                </div>
                {metodoPagamento === "pix" && (
                  <Check className="h-4 w-4 text-emerald-600 sm:self-end" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamento("cartao_entrega")}
                className={`tap p-3 rounded-2xl border text-left flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2 transition-all ${
                  metodoPagamento === "cartao_entrega"
                    ? "bg-forest/10 border-forest text-forest ring-1 ring-forest"
                    : "bg-background/60 border-border hover:border-gold/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest text-white shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-bold leading-tight text-foreground">
                      Cartão
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Na entrega
                    </span>
                  </div>
                </div>
                {metodoPagamento === "cartao_entrega" && (
                  <Check className="h-4 w-4 text-forest sm:self-end" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamento("dinheiro_entrega")}
                className={`tap p-3 rounded-2xl border text-left flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2 transition-all ${
                  metodoPagamento === "dinheiro_entrega"
                    ? "bg-gold/10 border-gold text-gold-foreground ring-1 ring-gold"
                    : "bg-background/60 border-border hover:border-gold/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-600 text-white shrink-0">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-bold leading-tight text-foreground">
                      Dinheiro
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Na entrega
                    </span>
                  </div>
                </div>
                {metodoPagamento === "dinheiro_entrega" && (
                  <Check className="h-4 w-4 text-amber-600 sm:self-end" />
                )}
              </button>
            </div>

            {/* Opção Troco para dinheiro */}
            {metodoPagamento === "dinheiro_entrega" && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Precisa de troco para quanto? (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 50, 100"
                  value={trocoPara}
                  onChange={(e) => setTrocoPara(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none"
                />
              </div>
            )}

            {/* Interface Exclusiva Pix com QR Code Simulado e Teste */}
            {metodoPagamento === "pix" && (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/5 dark:bg-emerald-950/20 p-4 sm:p-5 space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code Simulado em SVG */}
                  <div className="relative p-2.5 bg-white rounded-2xl shadow-md border border-border shrink-0">
                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 120 120"
                      className="rounded-lg"
                    >
                      <rect width="120" height="120" fill="white" />
                      {/* Cantos do QR Code */}
                      <rect x="10" y="10" width="30" height="30" fill="#0f1712" rx="4" />
                      <rect x="16" y="16" width="18" height="18" fill="white" rx="2" />
                      <rect x="20" y="20" width="10" height="10" fill="#0f1712" />

                      <rect x="80" y="10" width="30" height="30" fill="#0f1712" rx="4" />
                      <rect x="86" y="16" width="18" height="18" fill="white" rx="2" />
                      <rect x="90" y="20" width="10" height="10" fill="#0f1712" />

                      <rect x="10" y="80" width="30" height="30" fill="#0f1712" rx="4" />
                      <rect x="16" y="86" width="18" height="18" fill="white" rx="2" />
                      <rect x="20" y="90" width="10" height="10" fill="#0f1712" />

                      {/* Padrões internos do QR */}
                      <rect x="48" y="15" width="8" height="8" fill="#0f1712" />
                      <rect x="62" y="20" width="8" height="8" fill="#0f1712" />
                      <rect x="48" y="32" width="6" height="6" fill="#0f1712" />
                      <rect x="52" y="48" width="16" height="16" fill="#4a154b" rx="2" />
                      <rect x="25" y="52" width="12" height="6" fill="#0f1712" />
                      <rect x="85" y="52" width="10" height="12" fill="#0f1712" />
                      <rect x="75" y="75" width="12" height="12" fill="#0f1712" />
                      <rect x="55" y="85" width="10" height="8" fill="#0f1712" />
                      <rect x="92" y="88" width="12" height="12" fill="#0f1712" />
                    </svg>
                    {pixAprovado && (
                      <div className="absolute inset-0 bg-emerald-600/90 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-[1px] animate-in zoom-in-95">
                        <CheckCircle2 className="h-10 w-10 text-white animate-bounce" />
                        <span className="text-[11px] font-extrabold mt-1">
                          PAGO!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informações Pix e Copia e Cola */}
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Chave Pix (Copia e Cola)
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Abra o app do seu banco, escolha Pix Copia e Cola e conclua.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copiarPix}
                      className="tap w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card border border-emerald-500/40 text-xs font-bold text-foreground shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    >
                      {pixCopiado ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Chave Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Copiar Chave Pix</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão de Teste - Simular Pagamento Aprovado */}
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Ambiente de Demonstração / Teste
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={simularPagamentoAprovado}
                    className="tap w-full sm:w-auto px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all"
                  >
                    Simular Pagamento Aprovado ⚡
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Subtotal dos produtos</span>
              <span>{brl(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Taxa de Entrega (Maringá)</span>
              <span className={taxaEntrega === 0 ? "text-emerald-600 font-bold" : ""}>
                {taxaEntrega === 0 ? "GRÁTIS (Pedido acima de R$ 100)" : brl(taxaEntrega)}
              </span>
            </div>
            <div className="flex justify-between text-base font-black text-forest pt-1.5 border-t border-border/50">
              <span>Total a Pagar</span>
              <span className="text-xl text-acai font-display">{brl(totalGeral)}</span>
            </div>
          </div>
        </div>

        {/* Footer do Modal com Ação Final */}
        <div className="p-4 sm:p-5 border-t border-border/70 bg-card flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="tap px-4 py-2.5 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            Voltar ao cardápio
          </button>

          <button
            onClick={() => finalizarPedido(metodoPagamento === "pix" ? (pixAprovado ? "pago" : "pendente") : "pendente")}
            className="tap flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-acai text-acai-foreground text-sm font-extrabold shadow-lg hover:opacity-95 active:scale-95 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>
              {metodoPagamento === "pix" && pixAprovado
                ? "Enviar Pedido Aprovado"
                : "Finalizar Pedido via WhatsApp"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
