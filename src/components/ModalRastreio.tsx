import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Bike,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-cantinho.png";
import { WHATSAPP, brl } from "@/lib/menu-data";
import { getOrderById, onOrdersUpdate, type Order } from "@/lib/orders";

interface ModalRastreioProps {
  orderId: string;
  onClose: () => void;
}

export function ModalRastreio({ orderId, onClose }: ModalRastreioProps) {
  const [pedido, setPedido] = useState<Order | null>(() => getOrderById(orderId));

  // Temporizador de 5 minutos (300s) para o alerta cíclico de proximidade do motoboy
  const [segundosRestantes, setSegundosRestantes] = useState(300);
  const [ciclosAlerta, setCiclosAlerta] = useState(0);

  useEffect(() => {
    setPedido(getOrderById(orderId));
    const cleanup = onOrdersUpdate(() => {
      const atualizado = getOrderById(orderId);
      if (atualizado) {
        setPedido((prev) => {
          if (prev && prev.status !== atualizado.status) {
            if (atualizado.status === "preparo") {
              toast.info("A cozinha iniciou o preparo do seu pedido!", {
                description: "Garrafas e potes lacrados estão sendo preparados.",
              });
            } else if (atualizado.status === "pronto") {
              toast.success("🛵 Seu pedido saiu para entrega!", {
                description: "O motoboy está a caminho do seu endereço!",
              });
            }
          }
          return atualizado;
        });
      }
    });
    return cleanup;
  }, [orderId]);

  // Efeito do contador regressivo de 5 minutos quando status for "pronto" (Saiu para Entrega)
  useEffect(() => {
    if (!pedido || pedido.status !== "pronto") return;

    const interval = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          // Dispara alerta dinâmico de 5 minutos
          setCiclosAlerta((c) => c + 1);
          toast.warning("⚠️ Atenção! Motoboy chegando!", {
            description:
              "Seu pedido do Cantinho do Norte está muito próximo. Fique atento ao interfone ou portão!",
            duration: 8000,
          });
          return 300; // Reinicia o ciclo de 5 minutos
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pedido?.status]);

  if (!pedido) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="w-full max-w-md rounded-3xl bg-card p-6 text-center border border-border">
          <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>
          <button
            onClick={onClose}
            className="tap mt-4 px-5 py-2 rounded-full bg-forest text-white text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Determinação das etapas
  // 1. novo: Confirmado
  // 2. preparo: Em Preparo na Cozinha
  // 3. pronto: Saiu para Entrega
  const etapaAtual =
    pedido.status === "novo" ? 1 : pedido.status === "preparo" ? 2 : 3;

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-6 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl transition-all">
        {/* Topo do Modal de Rastreio */}
        <div className="flex items-center justify-between border-b border-border/70 p-4 sm:p-5 bg-gradient-forest text-forest-foreground">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Cantinho do Norte — A essência da Amazônia na sua mesa"
              className="h-10 w-10 rounded-full aspect-square object-contain ring-2 ring-white/20 bg-black/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-display leading-tight">
                  Rastreamento do Pedido {pedido.id}
                </h3>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <p className="text-xs text-white/80">
                Acompanhamento em tempo real • 100% Delivery
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

        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* MENSAGEM PERSONALIZADA DE AGRADECIMENTO PÓS-COMPRA */}
          <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-amber-500/10 via-background to-forest/10 p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl bg-gold/20 text-gold-foreground dark:text-amber-300 border border-gold/40 shadow-xs">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
              </span>
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-bold text-forest dark:text-amber-200 font-display leading-tight">
                    Muito obrigado pelo seu pedido{pedido.cliente?.nome ? `, ${pedido.cliente.nome.split(" ")[0]}` : ""}! 🌿
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 text-forest dark:text-emerald-300 border border-forest/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                    Feito no Capricho
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
                  É um verdadeiro prazer ter você como nosso cliente. Preparamos tudo com muito carinho e capricho para você saborear o autêntico açaí e as delícias do Norte no conforto da sua casa!
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground font-medium flex-wrap">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Kits lacrados com segurança
                  </span>
                  <span>•</span>
                  <span>100% Delivery em Maringá</span>
                </div>
              </div>
            </div>
          </div>

          {/* ALERTA INTELIGENTE MOTOBOY A CAMINHO (ATIVO QUANDO STATUS = PRONTO) */}
          {pedido.status === "pronto" && (
            <div className="rounded-2xl border-2 border-amber-500/80 bg-amber-500/15 p-4 sm:p-5 shadow-lg animate-in zoom-in-95 space-y-3">
              <div className="flex items-start gap-3">
                <span className="relative flex h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-500 text-white shadow">
                  <Bike className="h-4 w-4 animate-bounce" />
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-black text-amber-900 dark:text-amber-300 leading-tight">
                    ⚠️ Atenção! Motoboy a caminho do seu endereço!
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-amber-950/80 dark:text-amber-200/90 leading-relaxed">
                    Seu pedido do Cantinho do Norte está chegando próximo ao endereço.
                    Deixe o celular por perto e prepare-se para receber o entregador!
                  </p>
                </div>
              </div>

              {/* Lembrete Dinâmico / Contador Regressivo a cada 5 minutos */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
                <div className="inline-flex items-center gap-1.5 font-medium">
                  <Bell className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                  <span>
                    Lembretes periódicos ativos{" "}
                    {ciclosAlerta > 0 && `(Disparo #${ciclosAlerta})`}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-bold font-mono text-[11px]">
                  <span>Próximo aviso em:</span>
                  <span className="text-amber-800 dark:text-amber-100 font-extrabold">
                    {formatarTempo(segundosRestantes)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* LINHA DO TEMPO DAS ETAPAS */}
          <div className="rounded-3xl border border-border/80 bg-background/60 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-forest">
              Progresso do Seu Pedido
            </h4>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border before:z-0">
              {/* Etapa 1: Pedido Confirmado */}
              <div className="relative z-10 flex items-start gap-3.5">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                    etapaAtual >= 1
                      ? "bg-forest text-white shadow-sm ring-4 ring-forest/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">
                      1. Pedido Confirmado
                    </p>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(pedido.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pedido registrado e aprovado com sucesso na central de atendimento.
                  </p>
                </div>
              </div>

              {/* Etapa 2: Em Preparo na Cozinha */}
              <div className="relative z-10 flex items-start gap-3.5">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                    etapaAtual >= 2
                      ? "bg-amber-600 text-white shadow-sm ring-4 ring-amber-600/20"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">
                      2. Em Preparo na Cozinha
                    </p>
                    {etapaAtual === 2 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                        </span>
                        Agora
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nossa equipe está separando e lacrando suas garrafas de açaí batido puro e potes de complementos para montagem perfeita em casa.
                  </p>
                </div>
              </div>

              {/* Etapa 3: Saiu para Entrega */}
              <div className="relative z-10 flex items-start gap-3.5">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                    etapaAtual >= 3
                      ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-600/20"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Bike className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">
                      3. Saiu para Entrega
                    </p>
                    {etapaAtual === 3 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        A caminho
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kits com lacre de segurança em mãos do motoboy para entrega rápida em Maringá/PR.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço de Entrega */}
          <div className="rounded-2xl bg-secondary/40 p-4 border border-border/70 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-forest text-xs">
              <MapPin className="h-3.5 w-3.5 text-acai shrink-0" />
              <span>Endereço de Entrega Confirmado:</span>
            </div>
            <p className="font-bold text-foreground text-sm">
              {pedido.endereco.rua}, Nº {pedido.endereco.numero}
            </p>
            <p className="text-muted-foreground">
              Bairro: {pedido.endereco.bairro} • {pedido.endereco.cidade}
            </p>
            <p className="text-muted-foreground italic">
              Ponto de referência: {pedido.endereco.referencia}
            </p>
          </div>

          {/* Itens do Pedido */}
          <div className="space-y-2 text-xs">
            <h5 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
              Itens Solicitados
            </h5>
            <div className="rounded-2xl border border-border/70 bg-card p-3.5 divide-y divide-border/50">
              {pedido.itens.map((i, idx) => (
                <div key={idx} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>
                      {i.qtd}x {i.nome}
                    </span>
                    <span className="text-acai">{brl(i.preco * i.qtd)}</span>
                  </div>
                  {i.extras && i.extras.length > 0 && (
                    <div className="pl-3 mt-0.5 space-y-0.5 text-[11px] text-muted-foreground">
                      {i.extras.map((ex, exIdx) => (
                        <p key={exIdx}>↳ Complemento: {ex.nome}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-1 font-extrabold text-sm text-forest pt-1">
              <span>Total Pago/A Pagar</span>
              <span className="text-lg text-acai font-display">{brl(pedido.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer do Rastreio */}
        <div className="p-4 sm:p-5 border-t border-border/70 bg-card/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Gostaria de uma informação sobre meu pedido ${pedido.id} no Cantinho do Norte.`)}`}
            target="_blank"
            rel="noreferrer"
            className="tap w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <span>Suporte via WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="tap w-full sm:w-auto px-6 py-2.5 rounded-full bg-forest hover:bg-forest/90 text-white text-xs font-extrabold shadow-md transition-all"
          >
            Continuar Navegando
          </button>
        </div>
      </div>
    </div>
  );
}
