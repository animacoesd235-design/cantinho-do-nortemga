import { useEffect, useRef, useState } from "react";
import { CheckCircle, ShoppingBag, X } from "lucide-react";
import {
  getConfirmedOrders,
  onRealPurchase,
  type DeliveryAddress,
  type Order,
  type OrderItem,
} from "@/lib/orders";

export interface SocialNotification {
  id: string | number;
  nome: string;
  local: string;
  item: string;
  tempo: string;
  isReal?: boolean;
}

const NOTIFICACOES: SocialNotification[] = [
  {
    id: 1,
    nome: "Mariana",
    local: "Zona 03",
    item: "1x Kit Completo (Açaí + Farinhas)",
    tempo: "há 2 minutos",
  },
  {
    id: 2,
    nome: "Lucas",
    local: "Jardim Alvorada",
    item: "1x Combo Açaí + Camarão",
    tempo: "há 4 minutos",
  },
  {
    id: 3,
    nome: "Patrícia",
    local: "Zona 07",
    item: "1x Combo 2L Açaí + 1L Farinha",
    tempo: "há 7 minutos",
  },
  {
    id: 4,
    nome: "Rodrigo",
    local: "Parque do Ingá",
    item: "1x Kit Completo Lacrado",
    tempo: "há 3 minutos",
  },
  {
    id: 5,
    nome: "Camila",
    local: "Vila Operária",
    item: "1x Açaí Puro Batido 1L + Tapioca",
    tempo: "há 6 minutos",
  },
  {
    id: 6,
    nome: "Guilherme",
    local: "Zona 01 (Centro)",
    item: "1x Combo 1L Açaí + 1L Farinha",
    tempo: "há 1 minuto",
  },
  {
    id: 7,
    nome: "Fernanda",
    local: "Jardim Maringá",
    item: "1x Combo Açaí + Farinha + Charque",
    tempo: "há 5 minutos",
  },
  {
    id: 8,
    nome: "Thiago",
    local: "Zona 05",
    item: "1x Combo 3L Açaí + 2L Farinha",
    tempo: "há 8 minutos",
  },
  {
    id: 9,
    nome: "Beatriz",
    local: "Jardim Mandacaru",
    item: "1x Combo Açaí + Tapioca + Camarão",
    tempo: "há 4 minutos",
  },
  {
    id: 10,
    nome: "Marcelo",
    local: "Zona 02",
    item: "1x Garrafa Açaí Puro Batido 1L",
    tempo: "há 9 minutos",
  },
  {
    id: 11,
    nome: "Juliana",
    local: "Novo Horizonte",
    item: "1x Combo Açaí + Farinha + Conserva",
    tempo: "há 3 minutos",
  },
  {
    id: 12,
    nome: "Eduardo",
    local: "Zona 04",
    item: "1x Kit Completo (Açaí + Farinhas)",
    tempo: "há 6 minutos",
  },
  {
    id: 13,
    nome: "Letícia",
    local: "Jardim Aclimação",
    item: "1x Pote 250g Camarão Salgado",
    tempo: "há 2 minutos",
  },
  {
    id: 14,
    nome: "Bruno",
    local: "Gleba Palhano / Aeroporto",
    item: "1x Combo Açaí + Camarão",
    tempo: "há 7 minutos",
  },
  {
    id: 15,
    nome: "Amanda",
    local: "Cidade Monções",
    item: "1x Garrafa Tucupi 1L + Farinha",
    tempo: "há 5 minutos",
  },
  {
    id: 16,
    nome: "Rafael",
    local: "Zona 08",
    item: "1x Combo 2L Açaí + 1L Farinha",
    tempo: "há 10 minutos",
  },
  {
    id: 17,
    nome: "Larissa",
    local: "Jardim Universitário",
    item: "1x Açaí Puro Batido 1L",
    tempo: "há 4 minutos",
  },
  {
    id: 18,
    nome: "Felipe",
    local: "Vila Bosque",
    item: "1x Combo Açaí + Tapioca + Camarão",
    tempo: "há 8 minutos",
  },
];

export function extrairNomeCliente(nomeCompleto?: string): string {
  const partes = (nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "Cliente";
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1].charAt(0).toUpperCase()}.`;
}

export function extrairLocal(endereco?: DeliveryAddress): string {
  if (!endereco) return "Maringá";
  const bairro = (endereco.bairro || "").trim();
  if (bairro) return bairro;
  const cidade = (endereco.cidade || "").trim();
  if (cidade) return cidade;
  return "Maringá";
}

export function formatarItensPedido(itens?: OrderItem[]): string {
  if (!itens || itens.length === 0) return "1x Kit de Açaí";
  const primeiro = itens[0];
  const primeiroStr = `${primeiro.qtd}x ${primeiro.nome}`;
  if (itens.length === 1) return primeiroStr;
  const outros = itens.length - 1;
  return `${primeiroStr} + ${outros} ${outros === 1 ? "item" : "itens"}`;
}

export function formatarOrigem(local: string): string {
  const l = (local || "Maringá").trim();
  const lower = l.toLowerCase();
  if (
    lower.startsWith("jardim") ||
    lower.startsWith("parque") ||
    lower.startsWith("novo") ||
    lower.startsWith("centro")
  ) {
    return `do ${l}`;
  }
  if (
    lower.startsWith("vila") ||
    lower.startsWith("zona") ||
    lower.startsWith("cidade") ||
    lower.startsWith("gleba")
  ) {
    return `da ${l}`;
  }
  return `de ${l}`;
}

function tempoRelativo(dataIso?: string): string {
  if (!dataIso) return "agora mesmo";
  const agora = Date.now();
  const criado = new Date(dataIso).getTime();
  if (isNaN(criado)) return "agora mesmo";
  const diffMin = Math.max(0, Math.floor((agora - criado) / (1000 * 60)));
  if (diffMin === 0) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras} ${diffHoras === 1 ? "hora" : "horas"}`;
  return "recente";
}

export function orderParaNotificacao(
  order: Order,
  tempoTexto = "agora mesmo"
): SocialNotification {
  return {
    id: `real-${order.id}-${Date.now()}`,
    nome: extrairNomeCliente(order.cliente?.nome),
    local: extrairLocal(order.endereco),
    item: formatarItensPedido(order.itens),
    tempo: tempoTexto,
    isReal: true,
  };
}

function carregarNotificacoesIniciais(): SocialNotification[] {
  try {
    const pedidosReais = getConfirmedOrders();
    const reaisFormatados: SocialNotification[] = pedidosReais.slice(0, 10).map((o) => ({
      id: `real-${o.id}`,
      nome: extrairNomeCliente(o.cliente?.nome),
      local: extrairLocal(o.endereco),
      item: formatarItensPedido(o.itens),
      tempo: tempoRelativo(o.createdAt),
      isReal: true,
    }));
    return [...reaisFormatados, ...NOTIFICACOES];
  } catch {
    return NOTIFICACOES;
  }
}

export function SocialProofToast() {
  const [notificacoes, setNotificacoes] = useState<SocialNotification[]>(carregarNotificacoesIniciais);
  const [atual, setAtual] = useState<SocialNotification>(() => {
    const pool = notificacoes.length > 0 ? notificacoes : NOTIFICACOES;
    return pool[Math.floor(Math.random() * pool.length)];
  });
  const [visivel, setVisivel] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const historicoRef = useRef<Array<string | number>>([]);
  const timerRef = useRef<any>(null);
  const notificacoesRef = useRef<SocialNotification[]>(notificacoes);

  useEffect(() => {
    notificacoesRef.current = notificacoes;
  }, [notificacoes]);

  // Função para agendar próximo ciclo suave (12.5s a 13s)
  const agendarCiclo = (atrasoEspera: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const pool =
        notificacoesRef.current.length > 0 ? notificacoesRef.current : NOTIFICACOES;
      const candidatos = pool.filter((n) => !historicoRef.current.includes(n.id));
      const disponiveis = candidatos.length > 0 ? candidatos : pool;
      const sorteada = disponiveis[Math.floor(Math.random() * disponiveis.length)];

      setAtual(sorteada);
      historicoRef.current = [sorteada.id, ...historicoRef.current.slice(0, 7)];
      setVisivel(true);

      // Permanece visível por 5.5s para leitura agradável
      timerRef.current = setTimeout(() => {
        setVisivel(false);
        // Aguarda 7 segundos recolhido antes da próxima aparição (5.5s + 7s = 12.5s de intervalo)
        agendarCiclo(7000);
      }, 5500);
    }, atrasoEspera);
  };

  // Inicia o ciclo regular ao abrir a página
  useEffect(() => {
    if (dispensado) return;

    agendarCiclo(4500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dispensado]);

  // Escuta novas compras reais confirmadas para subir o toast na hora!
  useEffect(() => {
    const unsub = onRealPurchase((novaOrder) => {
      const novaNotificacao = orderParaNotificacao(novaOrder, "agora mesmo");

      // Injeta de imediato na fila de notificações para rotação futura
      setNotificacoes((prev) => [novaNotificacao, ...prev.filter((n) => n.id !== novaNotificacao.id)]);

      // Cancela qualquer timer em andamento
      if (timerRef.current) clearTimeout(timerRef.current);

      // Suba na hora com a compra real efetuada!
      setAtual(novaNotificacao);
      setDispensado(false);
      setVisivel(true);
      historicoRef.current = [novaNotificacao.id, ...historicoRef.current.slice(0, 7)];

      // Permanece visível por 6 segundos para destaque da compra real
      timerRef.current = setTimeout(() => {
        setVisivel(false);
        // Retoma ciclo normal após 7s recolhido
        agendarCiclo(7000);
      }, 6000);
    });

    return () => {
      unsub();
    };
  }, []);

  if (dispensado && !visivel) return null;

  return (
    <div
      className={`fixed bottom-24 sm:bottom-6 left-4 z-40 max-w-[340px] sm:max-w-sm transition-all duration-500 transform ${
        visivel
          ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
          : "translate-y-4 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="relative flex items-center gap-3 rounded-2xl border border-forest/20 bg-background/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
        {/* Ícone com Pulse */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest/10 border border-forest/20 text-forest">
          <ShoppingBag className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        </div>

        {/* Informações da Notificação */}
        <div className="min-w-0 flex-1 text-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3 inline" />
            <span>
              {atual.isReal ? "Compra real confirmada • Maringá" : "Compra recente • Maringá"}
            </span>
          </div>
          <p className="mt-0.5 text-foreground leading-snug">
            <strong className="font-bold text-forest">
              {atual.nome}
            </strong>{" "}
            {formatarOrigem(atual.local)} pediu{" "}
            <span className="font-semibold text-acai">
              {atual.item}
            </span>
          </p>
          <span className="text-[10px] text-muted-foreground">
            {atual.tempo}
          </span>
        </div>

        {/* Botão de Fechar */}
        <button
          onClick={() => {
            setVisivel(false);
            setDispensado(true);
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
          aria-label="Fechar notificação"
          className="tap -mr-1 -mt-4 text-muted-foreground hover:text-foreground p-1 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
