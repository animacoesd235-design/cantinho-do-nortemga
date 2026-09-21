import { useState } from "react";
import { Check, Plus, Sparkles, X } from "lucide-react";
import { brl, combos as defaultCombos, avulsos as defaultAvulsos, type Produto } from "@/lib/menu-data";
import { UPSELL_EXTRAS, type ExtraItem } from "@/lib/orders";
import { isVideoMedia } from "@/lib/image-utils";

interface ModalUpsellProps {
  produto: Produto;
  isCombo?: boolean;
  onConfirm: (extras: ExtraItem[]) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function ModalUpsell({
  produto,
  isCombo,
  onConfirm,
  onSkip,
  onClose,
}: ModalUpsellProps) {
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const toggleExtra = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const extrasEscolhidos = UPSELL_EXTRAS.filter((e) =>
    selecionados.includes(e.id)
  );
  const totalExtras = extrasEscolhidos.reduce((acc, curr) => acc + curr.preco, 0);
  const valorTotal = produto.preco + totalExtras;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-[4px] animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border/80 bg-card shadow-2xl transition-all">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-border/70 p-4 sm:p-5 bg-secondary/40">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-gold-foreground font-bold">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-forest font-display leading-tight">
                Turbine seu {isCombo ? "Kit" : "Pedido"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Complementos artesanais frescos para montar em casa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="tap grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-accent text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resumo do Produto Selecionado */}
        <div className="p-4 sm:p-5 bg-background/50 border-b border-border/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {(() => {
              const defaultItem =
                (Array.isArray(defaultCombos) ? defaultCombos : []).find((c) => c.id === produto.id) ||
                (Array.isArray(defaultAvulsos) ? defaultAvulsos : []).find((a) => a.id === produto.id);
              let srcFinal =
                (produto as any).image ||
                produto.imagem ||
                defaultItem?.image ||
                defaultItem?.imagem ||
                "";
              if (
                defaultItem &&
                typeof srcFinal === "string" &&
                !srcFinal.startsWith("data:") &&
                !srcFinal.startsWith("blob:") &&
                !srcFinal.startsWith("http") &&
                !srcFinal.includes("-v2")
              ) {
                srcFinal = defaultItem.imagem || defaultItem.image || srcFinal;
              }
              return isVideoMedia(srcFinal) ? (
                <video
                  src={srcFinal}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-14 w-14 rounded-2xl object-contain p-1 bg-sand-deep/40 border border-border/80 shrink-0"
                />
              ) : (
                <img
                  src={srcFinal}
                  alt={produto.nome}
                  className="h-14 w-14 rounded-2xl object-contain p-1 bg-sand-deep/40 border border-border/80 shrink-0"
                />
              );
            })()}
            <div className="min-w-0">
              <p className="text-sm font-bold text-forest truncate font-display">
                {produto.nome}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {produto.descricao}
              </p>
              <p className="text-xs font-semibold text-acai mt-0.5">
                Preço base: {brl(produto.preco)}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Adicionais / Upselling */}
        <div className="max-h-[42vh] overflow-y-auto p-4 sm:p-5 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Deseja adicionar complementos com desconto?
          </p>

          {UPSELL_EXTRAS.map((extra) => {
            const isSelected = selecionados.includes(extra.id);
            return (
              <div
                key={extra.id}
                onClick={() => toggleExtra(extra.id)}
                className={`tap flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-forest/10 border-forest/50 shadow-xs"
                    : "bg-background/70 border-border hover:border-gold/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                      isSelected
                        ? "bg-forest border-forest text-white"
                        : "border-border bg-card"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {extra.nome}
                    </p>
                    {extra.descricao && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {extra.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-acai">
                    +{brl(extra.preco)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer com Subtotal e Ações */}
        <div className="p-4 sm:p-5 border-t border-border/70 bg-card/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto text-left flex items-center justify-between sm:block">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Subtotal do Item
            </span>
            <span className="text-xl font-black text-acai font-display">
              {brl(valorTotal)}
            </span>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
            <button
              onClick={onSkip}
              className="tap px-4 py-2.5 rounded-full border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Pular complementos
            </button>
            <button
              onClick={() => onConfirm(extrasEscolhidos)}
              className="tap flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-acai text-acai-foreground text-xs sm:text-sm font-extrabold shadow-md hover:opacity-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              {selecionados.length > 0
                ? `Confirmar (+${brl(totalExtras)})`
                : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
