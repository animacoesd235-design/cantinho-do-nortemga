import { useEffect, useRef, useState } from "react";
import { CheckCircle, ShoppingBag, X } from "lucide-react";

interface SocialNotification {
  id: number;
  nome: string;
  local: string;
  item: string;
  tempo: string;
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

/**
 * Seleciona a próxima notificação garantindo que nomes recentes não se repitam.
 */
function sortearProximoIndex(ultimoIndex: number, historicoRecente: number[]): number {
  // Filtra itens já exibidos recentemente e evita o mesmo da última rodada
  const candidatos = NOTIFICACOES.map((_, i) => i).filter(
    (i) => i !== ultimoIndex && !historicoRecente.includes(i)
  );

  const pool =
    candidatos.length > 0
      ? candidatos
      : NOTIFICACOES.map((_, i) => i).filter((i) => i !== ultimoIndex);

  const sorteado = pool[Math.floor(Math.random() * pool.length)];
  return sorteado;
}

export function SocialProofToast() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * NOTIFICACOES.length));
  const [visivel, setVisivel] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const historicoRef = useRef<number[]>([]);

  useEffect(() => {
    if (dispensado) return;

    let cancelado = false;
    let timerId: any = null;

    // Função cíclica com intervalo de 12.5 a 13 segundos entre aparições
    // Visível por 5.5s (leitura calma e natural), recolhido por 7s (total de 12.5s)
    const agendarCiclo = (atrasoEspera: number) => {
      timerId = setTimeout(() => {
        if (cancelado) return;

        // Seleciona a próxima notificação evitando qualquer repetição recente
        setIndex((prevIndex) => {
          const proximo = sortearProximoIndex(prevIndex, historicoRef.current);
          // Mantém um histórico das últimas 8 notificações para rotação diversificada
          historicoRef.current = [proximo, ...historicoRef.current.slice(0, 7)];
          return proximo;
        });

        // Revela o pop-up com transição suave
        setVisivel(true);

        // Permanece visível por 5.5s para leitura confortável
        timerId = setTimeout(() => {
          if (cancelado) return;

          // Recolhe suavemente
          setVisivel(false);

          // Aguarda 7 segundos recolhido antes da próxima aparição
          // (5.5s visível + 7.0s recolhido = 12.5 segundos de intervalo entre pop-ups)
          agendarCiclo(7000);
        }, 5500);
      }, atrasoEspera);
    };

    // Primeira aparição suave após 4.5 segundos da abertura da página
    agendarCiclo(4500);

    return () => {
      cancelado = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [dispensado]);

  if (dispensado) return null;

  const current = NOTIFICACOES[index] || NOTIFICACOES[0];

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
            <span>Compra recente • Maringá</span>
          </div>
          <p className="mt-0.5 text-foreground leading-snug">
            <strong className="font-bold text-forest">
              {current.nome}
            </strong>{" "}
            da {current.local} pediu{" "}
            <span className="font-semibold text-acai">
              {current.item}
            </span>
          </p>
          <span className="text-[10px] text-muted-foreground">
            {current.tempo}
          </span>
        </div>

        {/* Botão de Fechar */}
        <button
          onClick={() => {
            setVisivel(false);
            setDispensado(true);
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
