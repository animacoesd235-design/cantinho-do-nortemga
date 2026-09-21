import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Bike,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { WHATSAPP, brl } from "@/lib/menu-data";
import {
  generateOrderId,
  getOrderById,
  onOrdersUpdate,
  saveOrder,
  updateOrderPaymentStatus,
  type DeliveryAddress,
  type Order,
  type OrderItem,
} from "@/lib/orders";
import {
  createPixPayment,
  checkPixPaymentStatus,
  type CreatePixResponse,
} from "@/lib/mercadopago-client";

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
  const [email, setEmail] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [referencia, setReferencia] = useState("");

  // Payment method
  const [metodoPagamento, setMetodoPagamento] = useState<
    "pix" | "cartao_entrega" | "dinheiro_entrega"
  >("pix");
  const [trocoPara, setTrocoPara] = useState("");

  // Pix Mercado Pago states
  const [gerandoPix, setGerandoPix] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);
  const [codigoPixCopiaCola, setCodigoPixCopiaCola] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [mpPaymentId, setMpPaymentId] = useState<number | string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [pixCopiado, setPixCopiado] = useState(false);
  const [pixAprovado, setPixAprovado] = useState(false);
  const [verificandoStatusManual, setVerificandoStatusManual] = useState(false);
  const [erroPix, setErroPix] = useState<string | null>(null);

  // Polling ref
  const pollingRef = useRef<any>(null);

  // Limpa o polling ao desmontar o componente
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Escuta confirmações de pagamento em tempo real (Webhook do Mercado Pago / Sincronização em Nuvem)
  useEffect(() => {
    if (!currentOrderId || !pixGerado || pixAprovado) return;
    const cleanup = onOrdersUpdate(() => {
      const order = getOrderById(currentOrderId);
      if (order && order.pagamento.status === "pago") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setPixAprovado(true);
        toast.success("Pagamento via Pix confirmado!", {
          description: "Seu pedido foi aprovado pelo Mercado Pago e enviado para a produção da cozinha.",
        });
        setTimeout(() => {
          concluirFluxoPedido(order);
        }, 1200);
      }
    });
    return cleanup;
  }, [currentOrderId, pixGerado, pixAprovado]);

  const copiarPix = () => {
    if (!codigoPixCopiaCola) return;
    navigator.clipboard.writeText(codigoPixCopiaCola);
    setPixCopiado(true);
    toast.success("Código Pix Copia e Cola copiado com sucesso!");
    setTimeout(() => setPixCopiado(false), 3500);
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

  // Monta objeto de pedido padronizado
  const construirObjetoPedido = (orderId: string, statusPag: "pago" | "pendente" = "pendente"): Order => {
    const endereco: DeliveryAddress = {
      rua: rua.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      referencia: referencia.trim(),
      cidade: "Maringá/PR",
    };

    return {
      id: orderId,
      createdAt: new Date().toISOString(),
      cliente: {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || undefined,
      },
      endereco,
      itens: cart,
      subtotal: total,
      taxaEntrega,
      total: totalGeral,
      pagamento: {
        metodo: metodoPagamento,
        status: statusPag,
        trocoPara: metodoPagamento === "dinheiro_entrega" ? trocoPara : undefined,
        mercadoPagoId: mpPaymentId || undefined,
        pixQrCode: codigoPixCopiaCola || undefined,
        pixQrCodeBase64: qrCodeBase64 || undefined,
      },
      status: "novo",
    };
  };

  // Gerar cobrança Pix real com o Mercado Pago
  const handleGerarPixMercadoPago = async () => {
    if (!validarFormulario()) return;

    try {
      setGerandoPix(true);
      setErroPix(null);

      const orderId = currentOrderId || generateOrderId();
      setCurrentOrderId(orderId);

      const pedido = construirObjetoPedido(orderId, "pendente");

      const res = await createPixPayment({
        transaction_amount: totalGeral,
        description: `Pedido ${orderId} - Cantinho do Norte (Delivery)`,
        order_id: orderId,
        email: email.trim(),
        nome: nome.trim(),
        telefone: telefone.trim(),
        order: pedido,
      });

      if (res.success && res.qr_code) {
        setCodigoPixCopiaCola(res.qr_code);
        setQrCodeBase64(res.qr_code_base64 || "");
        setTicketUrl(res.ticket_url || "");
        setMpPaymentId(res.payment_id || null);
        setPixGerado(true);

        // Salva pedido inicialmente com status pendente
        saveOrder(pedido);

        toast.success("QR Code Pix gerado com sucesso pelo Mercado Pago!");

        // Inicia polling automático a cada 3 segundos para confirmar aprovação
        iniciarPollingStatus(res.payment_id!, orderId, pedido);
      } else {
        const msgErro = res.error || "Não foi possível gerar a cobrança Pix no Mercado Pago.";
        setErroPix(msgErro);
        toast.error(msgErro);
      }
    } catch (err: any) {
      const msg = err?.message || "Erro de conexão ao gerar o Pix.";
      setErroPix(msg);
      toast.error(msg);
    } finally {
      setGerandoPix(false);
    }
  };

  // Inicia o polling contínuo para verificar aprovação do pagamento
  const iniciarPollingStatus = (paymentId: number | string, orderId: string, pedidoBase: Order) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await checkPixPaymentStatus(paymentId, orderId);
        if (res.is_paid || res.status === "approved") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;

          setPixAprovado(true);
          updateOrderPaymentStatus(orderId, "pago", paymentId);

          toast.success("Pagamento via Pix confirmado!", {
            description: "Seu pedido foi aprovado pelo Mercado Pago e enviado para a cozinha.",
          });

          // Conclui pedido após breve animação de confirmação
          setTimeout(() => {
            concluirFluxoPedido({
              ...pedidoBase,
              pagamento: {
                ...pedidoBase.pagamento,
                status: "pago",
                mercadoPagoId: paymentId,
              },
            });
          }, 1500);
        }
      } catch (err) {
        console.warn("[Polling Status] Falha silenciosa ao verificar Pix:", err);
      }
    }, 3000);
  };

  // Verificação manual sob demanda pelo cliente
  const handleVerificarStatusManual = async () => {
    if (!mpPaymentId) return;
    try {
      setVerificandoStatusManual(true);
      const res = await checkPixPaymentStatus(mpPaymentId, currentOrderId);
      if (res.is_paid || res.status === "approved") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setPixAprovado(true);
        updateOrderPaymentStatus(currentOrderId, "pago", mpPaymentId);
        toast.success("Pagamento confirmado com sucesso!");

        setTimeout(() => {
          finalizarPedido("pago");
        }, 1200);
      } else {
        toast.info("Pagamento ainda pendente no banco. Por favor, conclua a transferência.");
      }
    } catch {
      toast.error("Erro ao checar status do pagamento.");
    } finally {
      setVerificandoStatusManual(false);
    }
  };

  const concluirFluxoPedido = (pedidoFinalizado: Order) => {
    saveOrder(pedidoFinalizado);

    const linhasItens = cart.map((i) => {
      const extras = i.extras?.length
        ? `\n     ↳ Complementos: ${i.extras.map((e) => e.nome).join(", ")}`
        : "";
      return `• ${i.qtd}x ${i.nome} — ${brl(i.preco * i.qtd)}${extras}`;
    });

    const textoPagamento =
      metodoPagamento === "pix"
        ? pedidoFinalizado.pagamento.status === "pago"
          ? "✅ Pix Aprovado no Mercado Pago"
          : "⏳ Pix (Aguardando confirmação bancária)"
        : metodoPagamento === "cartao_entrega"
        ? "💳 Cartão na Entrega (Levar maquininha)"
        : `💵 Dinheiro na Entrega ${trocoPara ? `(Troco p/ R$ ${trocoPara})` : ""}`;

    const primeiroNome = pedidoFinalizado.cliente.nome.trim().split(" ")[0] || "Cliente";

    const avisoProducao =
      metodoPagamento === "pix" && pedidoFinalizado.pagamento.status !== "pago"
        ? `_⏳ Atenção: Pagamento Pix pendente. O pedido entrará em produção na cozinha imediatamente após a confirmação do pagamento._`
        : `_🛵 Pedido confirmado e enviado automaticamente para a produção da cozinha!_`;

    const msg = [
      `*PEDIDO ${pedidoFinalizado.id} — CANTINHO DO NORTE*`,
      `🛵 *Atendimento 100% Delivery (Maringá/PR)*`,
      "",
      `*Cliente:* ${pedidoFinalizado.cliente.nome}`,
      `*WhatsApp:* ${pedidoFinalizado.cliente.telefone}`,
      ...(pedidoFinalizado.cliente.email ? [`*E-mail:* ${pedidoFinalizado.cliente.email}`] : []),
      "",
      `📍 *ENDEREÇO DE ENTREGA:*`,
      `${pedidoFinalizado.endereco.rua}, Nº ${pedidoFinalizado.endereco.numero}`,
      `Bairro: ${pedidoFinalizado.endereco.bairro}`,
      `Referência: ${pedidoFinalizado.endereco.referencia}`,
      `Cidade: ${pedidoFinalizado.endereco.cidade}`,
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
      `✨ *MUITO OBRIGADO PELO SEU PEDIDO, ${primeiroNome.toUpperCase()}!*`,
      `Olá, ${primeiroNome}! Foi um verdadeiro prazer ter você como nosso cliente. Preparamos tudo com muito carinho e capricho para você saborear a verdadeira essência da Amazônia na sua casa! 🌿🥥`,
      "",
      avisoProducao,
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );

    onOrderCompleted(pedidoFinalizado);
  };

  const finalizarPedido = (statusPagamento: "pago" | "pendente" = "pendente") => {
    if (!validarFormulario()) return;
    const orderId = currentOrderId || generateOrderId();
    const pedido = construirObjetoPedido(orderId, statusPagamento);
    concluirFluxoPedido(pedido);
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
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  E-mail para comprovante Pix (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
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
                      Mercado Pago
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

            {/* Interface Real Pix Integrada com Mercado Pago */}
            {metodoPagamento === "pix" && (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/5 dark:bg-emerald-950/20 p-4 sm:p-5 space-y-4 animate-in fade-in">
                {/* Botão de Geração ou Carregamento */}
                {!pixGerado ? (
                  <div className="text-center py-2 space-y-3">
                    <div className="max-w-xs mx-auto space-y-1">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                        Pagamento Instantâneo via Pix (Mercado Pago)
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Clique abaixo para gerar o QR Code oficial e o código Copia e Cola diretamente no Mercado Pago.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGerarPixMercadoPago}
                      disabled={gerandoPix}
                      className="tap inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all disabled:opacity-50"
                    >
                      {gerandoPix ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Gerando Pix com o Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4" />
                          <span>Gerar QR Code Pix Oficial</span>
                        </>
                      )}
                    </button>

                    {erroPix && (
                      <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-left text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold block">Aviso de Configuração:</span>
                          <span className="text-[11px] leading-relaxed block">{erroPix}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visualização do QR Code e Copia e Cola */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative p-2.5 bg-white rounded-2xl shadow-md border border-border shrink-0">
                        {qrCodeBase64 ? (
                          <img
                            src={`data:image/png;base64,${qrCodeBase64}`}
                            alt="QR Code Pix Mercado Pago"
                            className="h-32 w-32 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="h-32 w-32 grid place-items-center bg-gray-50 rounded-lg text-gray-400">
                            <QrCode className="h-16 w-16" />
                          </div>
                        )}

                        {pixAprovado && (
                          <div className="absolute inset-0 bg-emerald-600/90 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-[1px] animate-in zoom-in-95">
                            <CheckCircle2 className="h-10 w-10 text-white animate-bounce" />
                            <span className="text-[11px] font-extrabold mt-1">
                              APROVADO!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Informações Pix e Copia e Cola */}
                      <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                        <div>
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                            Pix Copia e Cola (Mercado Pago)
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Abra o aplicativo do seu banco, selecione a opção <strong>Pix Copia e Cola</strong> e conclua a transferência.
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
                              <span>Código Copiado com Sucesso!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Copiar Código Pix</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Indicador Visual Dinâmico de Aguardando Pagamento */}
                    {!pixAprovado ? (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-500 shrink-0" />
                          <div className="text-left">
                            <span className="font-bold text-amber-900 dark:text-amber-200 block">
                              Aguardando confirmação do pagamento...
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              O sistema identifica a transferência automaticamente em segundos.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleVerificarStatusManual}
                          disabled={verificandoStatusManual}
                          className="tap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-800 dark:text-amber-200 transition-colors"
                        >
                          <RefreshCw className={`h-3 w-3 ${verificandoStatusManual ? "animate-spin" : ""}`} />
                          <span>Já Paguei</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold animate-in zoom-in-95">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <span>Pagamento confirmado com sucesso pelo Mercado Pago! Redirecionando...</span>
                      </div>
                    )}
                  </div>
                )}
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
        <div className="p-4 sm:p-5 border-t border-border/70 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tap px-4 py-2.5 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Voltar ao cardápio
            </button>
            {metodoPagamento === "pix" && pixGerado && !pixAprovado && (
              <button
                type="button"
                onClick={() => finalizarPedido("pendente")}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
                title="Caso prefira enviar o comprovante diretamente para o atendente no WhatsApp"
              >
                Enviar comprovante no WhatsApp
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (metodoPagamento === "pix" && !pixGerado) {
                handleGerarPixMercadoPago();
              } else if (metodoPagamento === "pix" && !pixAprovado) {
                handleVerificarStatusManual();
              } else {
                finalizarPedido(metodoPagamento === "pix" ? (pixAprovado ? "pago" : "pendente") : "pendente");
              }
            }}
            disabled={gerandoPix || verificandoStatusManual}
            className="tap w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-acai text-acai-foreground text-sm font-extrabold shadow-lg hover:opacity-95 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            {gerandoPix ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Gerando Pix...</span>
              </>
            ) : verificandoStatusManual ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Checando no banco...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {metodoPagamento === "pix"
                    ? pixAprovado
                      ? "Concluir Pedido Aprovado ✅"
                      : !pixGerado
                      ? "Pagar via Pix (Mercado Pago)"
                      : "Já Paguei (Verificar Pix) 🔄"
                    : "Finalizar Pedido via WhatsApp"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
