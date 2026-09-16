import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  Flame,
  Heart,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";

interface ModalSugestaoPreparoProps {
  onClose: () => void;
}

interface Receita {
  id: string;
  titulo: string;
  subtitulo: string;
  tempo: string;
  icone: string;
  badge: string;
  ingredientes: string[];
  comoFazer: string;
  dicaExtra?: string;
}

const RECEITAS: Receita[] = [
  {
    id: "creme-sorvete",
    titulo: "Creme de Açaí Cremoso (Estilo Sorvete)",
    subtitulo: "Textura densa e aveludada, perfeito para consumir na tigela",
    tempo: "5 minutos",
    icone: "🍧",
    badge: "Mais Popular",
    ingredientes: [
      "1 polpa de açaí puro congelado (200g)",
      "1 banana bem madura (de preferência congelada)",
      "2 colheres de sopa de leite em pó (ou adoçante a gosto)",
    ],
    comoFazer:
      "Coloque tudo no liquidificador. Bata aos poucos, ajudando com uma espátula ou pilão se precisar, até virar um creme liso e consistente. Servido na tigela com granola, fica perfeito.",
    dicaExtra: "Use a banana bem congelada para atingir o ponto de sorvete cremoso sem precisar adicionar água.",
  },
  {
    id: "vitamina-rapida",
    titulo: "Vitamina Rápida de Açaí com Banana e Mel",
    subtitulo: "Prática, energética e refrescante para qualquer hora",
    tempo: "3 minutos",
    icone: "🥤",
    badge: "Super Rápido",
    ingredientes: [
      "1 polpa de açaí puro",
      "1 copo de leite (ou bebida vegetal)",
      "1 banana",
      "1 colher de sopa de mel",
    ],
    comoFazer:
      "Bata todos os ingredientes no liquidificador até espumar e incorporar bem. Servido gelado, dá muita energia para o dia a dia.",
    dicaExtra: "Se quiser ainda mais refrescante, adicione 2 pedras de gelo antes de bater.",
  },
  {
    id: "acai-salgado",
    titulo: "Açaí Salgado Tradicional (Estilo Norte)",
    subtitulo: "A verdadeira tradição amazônica servida junto com a refeição",
    tempo: "5 minutos",
    icone: "🐟",
    badge: "Tradição do Norte",
    ingredientes: [
      "Polpa de açaí puro batida com um pouco de água (deixando na textura de sopa grossa ou cremosa)",
      "Peixe frito (como pescada) ou camarão",
      "Farinha de mandioca",
    ],
    comoFazer:
      "No Norte, o açaí puro é consumido salgado acompanhando refeições quentes. Basta colocar o açaí em uma tigela ao lado do prato de peixe frito e jogar a farinha de mandioca direto no açaí (ou comer de colher junto com a comida).",
    dicaExtra: "Use a nossa farinha d'água ou farinha de tapioca artesanal para sentir a autêntica crocância do Pará.",
  },
];

export function ModalSugestaoPreparo({ onClose }: ModalSugestaoPreparoProps) {
  const [abaAtiva, setAbaAtiva] = useState<string>("todas");

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const receitasExibidas =
    abaAtiva === "todas"
      ? RECEITAS
      : RECEITAS.filter((r) => r.id === abaAtiva);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-preparo-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl transition-all">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-border/70 p-4 sm:p-5 bg-gradient-forest text-forest-foreground shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-amber-300 shadow-inner">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="modal-preparo-titulo"
                  className="text-base sm:text-lg font-bold font-display text-white leading-tight"
                >
                  Sugestões de Preparo • Monte em Casa
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-extrabold text-gold-foreground uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> 3 Receitas
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Receba os ingredientes lacrados e prepare o melhor açaí do seu jeito
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar modal de receitas"
            className="tap grid h-9 w-9 place-items-center rounded-full bg-black/30 hover:bg-black/50 text-white/90 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas de Navegação das Receitas */}
        <div className="px-4 pt-3 pb-2 bg-secondary/40 border-b border-border/60 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setAbaAtiva("todas")}
              className={`tap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                abaAtiva === "todas"
                  ? "bg-forest text-forest-foreground shadow-sm"
                  : "bg-background/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              ✨ Ver Todas (3)
            </button>
            {RECEITAS.map((rec) => (
              <button
                key={rec.id}
                onClick={() => setAbaAtiva(rec.id)}
                className={`tap inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  abaAtiva === rec.id
                    ? "bg-forest text-forest-foreground shadow-sm"
                    : "bg-background/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{rec.icone}</span>
                <span>{rec.id === "creme-sorvete" ? "Creme Sorvete" : rec.id === "vitamina-rapida" ? "Vitamina" : "Açaí Salgado"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {receitasExibidas.map((r, idx) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border/80 bg-background/70 p-4 sm:p-5 shadow-xs space-y-3.5 transition-all hover:border-gold/50"
            >
              {/* Cabeçalho da Receita */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl" role="img" aria-label={r.titulo}>
                    {r.icone}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-display text-forest leading-snug">
                      {r.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {r.subtitulo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 border border-forest/20 px-2.5 py-1 text-xs font-bold text-forest">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span>Tempo: {r.tempo}</span>
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                    {r.badge}
                  </span>
                </div>
              </div>

              {/* Seção de Ingredientes */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5 text-acai" />
                  Ingredientes:
                </span>
                <ul className="grid gap-1.5 pl-1">
                  {r.ingredientes.map((ing, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90 font-medium"
                    >
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Seção Como Fazer */}
              <div className="space-y-1.5 rounded-xl bg-secondary/50 p-3 sm:p-3.5 border border-border/50">
                <span className="text-[11px] font-black uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-600" />
                  Como fazer:
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/95 font-medium">
                  {r.comoFazer}
                </p>
              </div>

              {/* Dica Extra */}
              {r.dicaExtra && (
                <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 pl-1">
                  <Heart className="h-3 w-3 text-acai shrink-0" />
                  <span>Dica: {r.dicaExtra}</span>
                </div>
              )}
            </article>
          ))}

          {/* Card Institucional Dica de Monte em Casa */}
          <div className="rounded-2xl bg-forest/10 border border-forest/20 p-4 text-xs text-forest flex items-start gap-3">
            <span className="text-xl shrink-0">🌿</span>
            <div className="space-y-1">
              <p className="font-bold text-forest">
                Por que nossos kits são entregues para "Montar em Casa"?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Entregamos as garrafas de açaí puro batido e os potes de farinha artesanal 100% lacrados separadamente. Assim, as farinhas não amolecem no trajeto da entrega e você prepara seu açaí no exato momento de consumir, garantindo crocância máxima e o autêntico sabor amazônico!
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-between border-t border-border/70 p-4 bg-secondary/30 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Todos os combos acompanham itens lacrados para preparo fácil.
          </span>
          <button
            onClick={onClose}
            className="tap w-full sm:w-auto ml-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-forest px-6 py-2.5 text-xs sm:text-sm font-extrabold text-forest-foreground shadow-md hover:opacity-95 transition-all"
          >
            <span>Entendido, vou pedir meu açaí! 🌿</span>
          </button>
        </div>
      </div>
    </div>
  );
}
