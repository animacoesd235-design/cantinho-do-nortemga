import { useEffect, useState } from "react";
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
    item: "1x Kit Completo",
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
    item: "2L de Açaí + Farinha",
    tempo: "há 7 minutos",
  },
  {
    id: 4,
    nome: "Rodrigo",
    local: "Parque do Ingá",
    item: "1x Kit Completo",
    tempo: "há 3 minutos",
  },
  {
    id: 5,
    nome: "Camila",
    local: "Vila Operária",
    item: "1x Açaí Puro Batido + Tapioca",
    tempo: "há 6 minutos",
  },
  {
    id: 6,
    nome: "Guilherme",
    local: "Zona 01",
    item: "1x Kit Completo",
    tempo: "há 1 minuto",
  },
];

export function SocialProofToast() {
  const [index, setIndex] = useState(0);
  const [visivel, setVisivel] = useState(false);
  const [dispensado, setDispensado] = useState(false);

  useEffect(() => {
    if (dispensado) return;

    // Primeiro toast aparece após 4 segundos
    const initialTimer = setTimeout(() => {
      setVisivel(true);
    }, 4000);

    // Loop de ciclo: visível por 6s, oculto por 9s (ciclo de 15s)
    const interval = setInterval(() => {
      setVisivel(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % NOTIFICACOES.length);
        setVisivel(true);
      }, 9000);
    }, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dispensado]);

  if (dispensado) return null;

  const current = NOTIFICACOES[index];

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
