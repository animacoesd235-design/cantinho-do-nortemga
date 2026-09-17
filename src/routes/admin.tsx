import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  Lock,
  Minus,
  Package,
  Plus,
  Power,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unlock,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-cantinho.png";
import {
  addCashMovement,
  calculateCashSummary,
  closeCashSession,
  getActiveCashSession,
  getAllCashSessions,
  onCashUpdate,
  openCashSession,
  type CashMovement,
  type CashSession,
} from "@/lib/cash-store";
import { brl } from "@/lib/menu-data";
import {
  deleteProduct,
  getCustomProducts,
  IMAGE_PRESETS,
  onProductsUpdate,
  resetProductsToDefault,
  saveProduct,
  type CustomProduct,
} from "@/lib/products-store";
import {
  checkStoreOpenStatus,
  DIAS_SEMANA,
  getStoreSettings,
  onStoreSettingsUpdate,
  saveStoreSettings,
  type DaySchedule,
  type StoreSettings,
} from "@/lib/store-settings";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Painel Administrativo — Cantinho do Norte" }],
  }),
  component: PainelAdmin,
});

function PainelAdmin() {
  const [tabAtiva, setTabAtiva] = useState<"caixa" | "produtos" | "config">("caixa");

  return (
    <div className="min-h-screen bg-[#0a120c] text-[#f4efe6] antialiased pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0e1710]/95 backdrop-blur-md px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={logo}
                alt="Cantinho do Norte"
                className="h-10 w-10 rounded-full object-cover border border-amber-400/40 shadow-xs group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="block text-sm font-black font-display tracking-wide text-amber-300">
                  CANTINHO DO NORTE
                </span>
                <span className="block text-[11px] font-semibold text-white/60">
                  Painel de Controle & Gestão
                </span>
              </div>
            </Link>
          </div>

          {/* Navegação entre Abas */}
          <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1 border border-white/10">
            <button
              onClick={() => setTabAtiva("caixa")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                tabAtiva === "caixa"
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>Caixa</span>
            </button>
            <button
              onClick={() => setTabAtiva("produtos")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                tabAtiva === "produtos"
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Produtos</span>
            </button>
            <button
              onClick={() => setTabAtiva("config")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                tabAtiva === "config"
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Horários & Pausa</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cozinha"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-300 transition-colors"
            >
              <span>Painel Cozinha (KDS)</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ver Cardápio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-4 pt-6">
        {tabAtiva === "caixa" && <TabCaixa />}
        {tabAtiva === "produtos" && <TabProdutos />}
        {tabAtiva === "config" && <TabConfiguracoes />}
      </main>
    </div>
  );
}

// =========================================================================
// ABA 1: GESTÃO DE CAIXA
// =========================================================================

function TabCaixa() {
  const [session, setSession] = useState<CashSession | null>(null);
  const [historico, setHistorico] = useState<CashSession[]>([]);

  // Modais de ações
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
  const [modalMovimento, setModalMovimento] = useState<"suprimento" | "sangria" | null>(null);
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false);

  // Form states
  const [valorInicial, setValorInicial] = useState("100,00");
  const [operadorAbertura, setOperadorAbertura] = useState("Caixa 01");
  const [valorMovimento, setValorMovimento] = useState("");
  const [descricaoMovimento, setDescricaoMovimento] = useState("");
  const [saldoGavetaConferido, setSaldoGavetaConferido] = useState("");
  const [obsFechamento, setObsFechamento] = useState("");

  const carregarDados = () => {
    setSession(getActiveCashSession());
    setHistorico(getAllCashSessions());
  };

  useEffect(() => {
    carregarDados();
    const cleanup = onCashUpdate(() => carregarDados());
    return cleanup;
  }, []);

  const handleAbrirCaixa = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorInicial.replace(/\./g, "").replace(",", "."));
    if (isNaN(val) || val < 0) {
      toast.error("Informe um valor inicial válido");
      return;
    }
    openCashSession(val, operadorAbertura);
    setModalAbrirCaixa(false);
    toast.success("Caixa aberto com sucesso!");
  };

  const handleSalvarMovimento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMovimento) return;
    const val = parseFloat(valorMovimento.replace(/\./g, "").replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }
    if (!descricaoMovimento.trim()) {
      toast.error("Descreva o motivo do lançamento");
      return;
    }

    addCashMovement(modalMovimento, val, descricaoMovimento, session?.operador || "Operador");
    toast.success(
      modalMovimento === "suprimento"
        ? `Suprimento de ${brl(val)} adicionado!`
        : `Sangria de ${brl(val)} registrada!`
    );
    setModalMovimento(null);
    setValorMovimento("");
    setDescricaoMovimento("");
  };

  const handleConfirmarFechamento = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(saldoGavetaConferido.replace(/\./g, "").replace(",", "."));
    if (isNaN(val) || val < 0) {
      toast.error("Informe o valor em dinheiro conferido na gaveta");
      return;
    }
    closeCashSession(val, obsFechamento);
    setModalFecharCaixa(false);
    setSaldoGavetaConferido("");
    setObsFechamento("");
    toast.success("Caixa fechado com sucesso!");
  };

  const resumo = session ? calculateCashSummary(session) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner Status do Caixa */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#121c15] p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-12 w-12 place-items-center rounded-2xl ${
              session ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {session ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-display text-white">
                {session ? "Caixa Ativo (Aberto)" : "Caixa Fechado"}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  session ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-red-500/20 text-red-300 border border-red-500/40"
                }`}
              >
                {session ? "Em Operação" : "Fechado"}
              </span>
            </div>
            <p className="text-xs text-white/60">
              {session
                ? `Aberto em ${new Date(session.abertoEm).toLocaleDateString("pt-BR")} às ${new Date(session.abertoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} • Operador: ${session.operador}`
                : "Abra o caixa informando o fundo de troco para iniciar as operações do dia."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!session ? (
            <button
              onClick={() => setModalAbrirCaixa(true)}
              className="tap flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-black shadow-lg transition-all"
            >
              <Unlock className="h-4 w-4" />
              <span>Abrir Caixa</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setModalMovimento("suprimento")}
                className="tap flex items-center gap-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 px-3 py-2 text-xs font-bold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Suprimento</span>
              </button>
              <button
                onClick={() => setModalMovimento("sangria")}
                className="tap flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-3 py-2 text-xs font-bold transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
                <span>Sangria</span>
              </button>
              <button
                onClick={() => {
                  setSaldoGavetaConferido(resumo ? resumo.saldoEsperadoGaveta.toFixed(2).replace(".", ",") : "");
                  setModalFecharCaixa(true);
                }}
                className="tap flex items-center gap-1.5 rounded-xl bg-red-600/40 hover:bg-red-600/60 border border-red-500/40 text-red-200 px-3 py-2 text-xs font-bold transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Fechar Caixa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards de Resumo Financeiro da Sessão Ativa */}
      {session && resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#121c15] p-4">
            <span className="text-[11px] font-semibold text-white/50 block">Fundo Inicial</span>
            <span className="text-xl font-black text-white font-display mt-0.5 block">
              {brl(resumo.saldoInicialDinheiro)}
            </span>
            <span className="text-[10px] text-white/40">Fundo de troco de abertura</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121c15] p-4">
            <span className="text-[11px] font-semibold text-emerald-400 block">Total Vendas</span>
            <span className="text-xl font-black text-emerald-300 font-display mt-0.5 block">
              {brl(resumo.totalVendasGeral)}
            </span>
            <span className="text-[10px] text-white/40">
              Din: {brl(resumo.totalVendasDinheiro)} | Pix: {brl(resumo.totalVendasPix)}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121c15] p-4">
            <span className="text-[11px] font-semibold text-amber-400 block">Suprimentos / Sangrias</span>
            <span className="text-xl font-black text-amber-300 font-display mt-0.5 block">
              +{brl(resumo.totalSuprimentos)} / -{brl(resumo.totalSangrias)}
            </span>
            <span className="text-[10px] text-white/40">Ajustes manuais na gaveta</span>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wide block">
              Esperado em Gaveta (Dinheiro)
            </span>
            <span className="text-2xl font-black text-amber-300 font-display mt-0.5 block">
              {brl(resumo.saldoEsperadoGaveta)}
            </span>
            <span className="text-[10px] text-amber-200/60">
              Inicial + Vendas Dinheiro + Suprim. - Sangrias
            </span>
          </div>
        </div>
      )}

      {/* Tabela de Lançamentos da Sessão Ativa */}
      {session && (
        <div className="rounded-3xl border border-white/10 bg-[#121c15] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Lançamentos do Caixa Ativo ({session.movimentos.length})
              </h3>
              <p className="text-xs text-white/50">
                Entradas de vendas do KDS e movimentações manuais de suprimento e sangria.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-white/50 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Forma Pagto</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {session.movimentos.map((mov) => {
                  const dataFormatada = new Date(mov.dataHora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  return (
                    <tr key={mov.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-white/70">{dataFormatada}</td>
                      <td className="py-2.5 px-3">
                        {mov.tipo === "abertura" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                            Abertura
                          </span>
                        )}
                        {mov.tipo === "venda" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            Venda
                          </span>
                        )}
                        {mov.tipo === "suprimento" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                            + Suprimento
                          </span>
                        )}
                        {mov.tipo === "sangria" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-300">
                            - Sangria
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">{mov.descricao}</td>
                      <td className="py-2.5 px-3 uppercase text-white/60 text-[10px] font-bold">
                        {mov.formaPagamento}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-black font-display ${
                          mov.tipo === "sangria" ? "text-red-400" : "text-emerald-300"
                        }`}
                      >
                        {mov.tipo === "sangria" ? `-${brl(mov.valor)}` : `+${brl(mov.valor)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Histórico de Caixas Anteriores */}
      <div className="rounded-3xl border border-white/10 bg-[#121c15] p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Histórico de Caixas Fechados ({historico.length})
            </h3>
            <p className="text-xs text-white/50">Auditoria e conferência de dias anteriores.</p>
          </div>
        </div>

        {historico.length === 0 ? (
          <p className="text-xs text-white/40 py-4 text-center">Nenhum caixa fechado registrado no histórico.</p>
        ) : (
          <div className="space-y-3">
            {historico.slice(0, 5).map((h) => {
              const res = calculateCashSummary(h);
              const dataAbertura = new Date(h.abertoEm).toLocaleDateString("pt-BR");
              const horaFechamento = h.fechadoEm
                ? new Date(h.fechadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div
                  key={h.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#0e1710] p-4 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-300 font-display">{h.id}</span>
                      <span className="text-white/60">
                        {dataAbertura} (Fechado às {horaFechamento})
                      </span>
                      <span className="text-white/40">• {h.operador}</span>
                    </div>
                    <p className="text-white/50 text-[11px]">
                      Vendas Totais: <strong className="text-white">{brl(res.totalVendasGeral)}</strong> | Suprimentos: +{brl(res.totalSuprimentos)} | Sangrias: -{brl(res.totalSangrias)}
                    </p>
                    {h.observacoesFechamento && (
                      <p className="text-[11px] text-amber-200/80 italic">Obs: {h.observacoesFechamento}</p>
                    )}
                  </div>

                  <div className="text-right sm:border-l sm:border-white/10 sm:pl-4">
                    <span className="text-[10px] text-white/50 block">Conferido na Gaveta</span>
                    <span className="text-sm font-black text-amber-300 font-display">
                      {brl(h.saldoFinalDinheiroConferido || 0)}
                    </span>
                    {res.diferencaGaveta !== undefined && res.diferencaGaveta !== 0 && (
                      <span
                        className={`text-[10px] font-bold block ${
                          res.diferencaGaveta > 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {res.diferencaGaveta > 0
                          ? `Sobra: +${brl(res.diferencaGaveta)}`
                          : `Falta: ${brl(res.diferencaGaveta)}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Abertura de Caixa */}
      {modalAbrirCaixa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121c15] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-display text-white">Abertura de Caixa</h3>
              <button
                onClick={() => setModalAbrirCaixa(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAbrirCaixa} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-white/70 mb-1">
                  Fundo de Troco Inicial (em Dinheiro) R$:
                </label>
                <input
                  type="text"
                  value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-base font-black text-amber-300 focus:outline-hidden focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-white/70 mb-1">Operador / Responsável:</label>
                <input
                  type="text"
                  value={operadorAbertura}
                  onChange={(e) => setOperadorAbertura(e.target.value)}
                  placeholder="Nome do operador"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                  required
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbrirCaixa(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suprimento / Sangria */}
      {modalMovimento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121c15] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-display text-white">
                {modalMovimento === "suprimento" ? "Novo Suprimento (Entrada de Troco)" : "Nova Sangria (Retirada de Dinheiro)"}
              </h3>
              <button
                onClick={() => setModalMovimento(null)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSalvarMovimento} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-white/70 mb-1">Valor (R$):</label>
                <input
                  type="text"
                  value={valorMovimento}
                  onChange={(e) => setValorMovimento(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-base font-black text-amber-300 focus:outline-hidden focus:border-amber-400"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-semibold text-white/70 mb-1">Motivo / Descrição:</label>
                <input
                  type="text"
                  value={descricaoMovimento}
                  onChange={(e) => setDescricaoMovimento(e.target.value)}
                  placeholder={
                    modalMovimento === "suprimento"
                      ? "Ex: Troco adicional de moedas e notas"
                      : "Ex: Pagamento entregador / Compra de insumos"
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                  required
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalMovimento(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-black ${
                    modalMovimento === "suprimento"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                      : "bg-red-500 hover:bg-red-400 text-white"
                  }`}
                >
                  Confirmar {modalMovimento === "suprimento" ? "Entrada" : "Retirada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechamento de Caixa */}
      {modalFecharCaixa && resumo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121c15] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-display text-white">Fechamento de Caixa</h3>
              <button
                onClick={() => setModalFecharCaixa(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Resumo de Conferência */}
            <div className="space-y-2 rounded-2xl bg-[#0e1710] p-4 border border-white/5 text-xs">
              <div className="flex justify-between text-white/70">
                <span>(+) Fundo Inicial:</span>
                <span className="font-bold text-white">{brl(resumo.saldoInicialDinheiro)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>(+) Vendas em Dinheiro:</span>
                <span className="font-bold text-emerald-400">+{brl(resumo.totalVendasDinheiro)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>(+) Suprimentos (Aportes):</span>
                <span className="font-bold text-sky-400">+{brl(resumo.totalSuprimentos)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>(-) Sangrias (Retiradas):</span>
                <span className="font-bold text-red-400">-{brl(resumo.totalSangrias)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-black">
                <span className="text-amber-300">SALDO ESPERADO NA GAVETA:</span>
                <span className="text-amber-300 font-display">{brl(resumo.saldoEsperadoGaveta)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmarFechamento} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Valor Contado / Conferido na Gaveta (R$):
                </label>
                <input
                  type="text"
                  value={saldoGavetaConferido}
                  onChange={(e) => setSaldoGavetaConferido(e.target.value)}
                  placeholder="Ex: 350,00"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-base font-black text-emerald-300 focus:outline-hidden focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-white/70 mb-1">
                  Observações de Fechamento (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={obsFechamento}
                  onChange={(e) => setObsFechamento(e.target.value)}
                  placeholder="Ex: Turno encerrado sem divergências"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalFecharCaixa(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 font-bold"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black"
                >
                  Confirmar e Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// ABA 2: GESTÃO DE PRODUTOS
// =========================================================================

function TabProdutos() {
  const [combos, setCombos] = useState<CustomProduct[]>([]);
  const [avulsos, setAvulsos] = useState<CustomProduct[]>([]);
  const [produtoEditando, setProdutoEditando] = useState<CustomProduct | null>(null);

  const carregarProdutos = () => {
    const data = getCustomProducts();
    setCombos(data.combos);
    setAvulsos(data.avulsos);
  };

  useEffect(() => {
    carregarProdutos();
    const cleanup = onProductsUpdate(() => carregarProdutos());
    return cleanup;
  }, []);

  const handleSalvarProduto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoEditando) return;

    if (!produtoEditando.nome.trim()) {
      toast.error("O nome do produto é obrigatório");
      return;
    }
    if (produtoEditando.preco <= 0) {
      toast.error("O preço deve ser maior que zero");
      return;
    }

    saveProduct(produtoEditando);
    toast.success(`Produto "${produtoEditando.nome}" salvo com sucesso!`);
    setProdutoEditando(null);
  };

  const handleExcluirProduto = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover "${nome}"?`)) {
      deleteProduct(id);
      toast("Produto removido");
    }
  };

  const handleRestaurarPadrao = () => {
    if (confirm("Deseja restaurar todos os produtos para a lista original de fábrica? Suas edições serão resetadas.")) {
      resetProductsToDefault();
      toast.success("Cardápio restaurado com os produtos de fábrica!");
    }
  };

  const handleNovoProduto = () => {
    const novo: CustomProduct = {
      id: "prod-" + Date.now().toString().slice(-6),
      nome: "Novo Item Artesanal",
      descricao: "Descrição do produto artesanal",
      preco: 30,
      categoria: "avulso",
      imagem: IMAGE_PRESETS[0].url,
      destaque: "",
    };
    setProdutoEditando(novo);
  };

  return (
    <div className="space-y-6">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#121c15] p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-black font-display text-white">Gestão de Cardápio & Preços</h2>
          <p className="text-xs text-white/60">
            Altere preços, descrições, fotos e destaques. As alterações refletem imediatamente na vitrine dos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestaurarPadrao}
            title="Voltar aos produtos e fotos padrão"
            className="tap flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-white/80 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Padrão</span>
          </button>
          <button
            onClick={handleNovoProduto}
            className="tap flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-black shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Seção de Combos */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
          Combos & Kits Degustação ({combos.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((prod) => (
            <CardProdutoAdmin
              key={prod.id}
              produto={prod}
              onEditar={() => setProdutoEditando({ ...prod })}
              onExcluir={() => handleExcluirProduto(prod.id, prod.nome)}
            />
          ))}
        </div>
      </div>

      {/* Seção de Avulsos */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-300">
          Itens Avulsos & Empório ({avulsos.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avulsos.map((prod) => (
            <CardProdutoAdmin
              key={prod.id}
              produto={prod}
              onEditar={() => setProdutoEditando({ ...prod })}
              onExcluir={() => handleExcluirProduto(prod.id, prod.nome)}
            />
          ))}
        </div>
      </div>

      {/* Modal de Edição de Produto */}
      {produtoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121c15] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-display text-white">
                {produtoEditando.id.startsWith("prod-") ? "Adicionar Produto" : "Editar Produto"}
              </h3>
              <button
                onClick={() => setProdutoEditando(null)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarProduto} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-white/70 mb-1">Nome do Produto:</label>
                  <input
                    type="text"
                    value={produtoEditando.nome}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white font-bold focus:outline-hidden focus:border-amber-400"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-white/70 mb-1">Descrição / Composição:</label>
                  <textarea
                    rows={2}
                    value={produtoEditando.descricao}
                    onChange={(e) =>
                      setProdutoEditando({ ...produtoEditando, descricao: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white/70 mb-1">Preço Atual de Venda (R$):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={produtoEditando.preco}
                    onChange={(e) =>
                      setProdutoEditando({ ...produtoEditando, preco: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-amber-300 font-bold text-sm focus:outline-hidden focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white/70 mb-1">
                    Preço Original Riscado (R$) (Opcional):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={produtoEditando.precoOriginal || ""}
                    onChange={(e) =>
                      setProdutoEditando({
                        ...produtoEditando,
                        precoOriginal: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 65 (Mostra De R$ 65 Por R$ 48)"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white/80 focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white/70 mb-1">Categoria:</label>
                  <select
                    value={produtoEditando.categoria}
                    onChange={(e) =>
                      setProdutoEditando({
                        ...produtoEditando,
                        categoria: e.target.value as "combo" | "avulso",
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-[#0e1710] px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="combo">Combo / Kit Degustação</option>
                    <option value="avulso">Item Avulso / Empório</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-white/70 mb-1">Selo / Destaque (Badge):</label>
                  <input
                    type="text"
                    value={produtoEditando.destaque || ""}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, destaque: e.target.value })}
                    placeholder="Ex: Mais Vendido, Tradição"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Seletor de Foto Pré-definida */}
              <div>
                <label className="block font-semibold text-white/70 mb-1.5">
                  Foto do Produto (Selecione um Preset ou Cole URL):
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setProdutoEditando({ ...produtoEditando, imagem: preset.url })}
                      className={`group relative rounded-xl overflow-hidden border-2 aspect-square transition-all ${
                        produtoEditando.imagem === preset.url
                          ? "border-amber-400 ring-2 ring-amber-400/40"
                          : "border-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[8px] font-bold text-white text-center py-0.5 truncate px-1">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={produtoEditando.imagem}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, imagem: e.target.value })}
                  placeholder="URL da Imagem personalizada (https://...)"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-white/70 text-[11px] focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProdutoEditando(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CardProdutoAdmin({
  produto,
  onEditar,
  onExcluir,
}: {
  produto: CustomProduct;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#121c15] p-3.5 transition-all hover:border-white/20">
      <img
        src={produto.imagem}
        alt={produto.nome}
        className="h-20 w-20 rounded-xl object-cover border border-white/10 shrink-0"
      />
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-bold text-white text-xs truncate">{produto.nome}</h4>
            {produto.destaque && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 shrink-0">
                {produto.destaque}
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5">{produto.descricao}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-amber-300 font-display">
              {brl(produto.preco)}
            </span>
            {produto.precoOriginal && (
              <span className="text-[10px] text-white/40 line-through">
                {brl(produto.precoOriginal)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onEditar}
              className="tap p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onExcluir}
              className="tap p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              title="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// ABA 3: HORÁRIOS & PAUSA EMERGENCIAL
// =========================================================================

function TabConfiguracoes() {
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());
  const [statusAtual, setStatusAtual] = useState(checkStoreOpenStatus());

  const recarregar = () => {
    setSettings(getStoreSettings());
    setStatusAtual(checkStoreOpenStatus());
  };

  useEffect(() => {
    recarregar();
    const cleanup = onStoreSettingsUpdate(() => recarregar());
    return cleanup;
  }, []);

  const handleTogglePausa = () => {
    const novoStatus = !settings.pausadoManualmente;
    const atualizado = { ...settings, pausadoManualmente: novoStatus };
    setSettings(atualizado);
    saveStoreSettings(atualizado);
    toast.success(novoStatus ? "Pausa Emergencial Ativada!" : "Atendimento Reaberto!");
  };

  const handleSalvarConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings(settings);
    toast.success("Horários e configurações salvos com sucesso!");
    setStatusAtual(checkStoreOpenStatus());
  };

  const handleDiaChange = (
    index: number,
    campo: keyof DaySchedule,
    valor: string | boolean
  ) => {
    const novos = [...settings.horariosSemanais];
    novos[index] = { ...novos[index], [campo]: valor };
    setSettings({ ...settings, horariosSemanais: novos });
  };

  return (
    <div className="space-y-6">
      {/* Bloco de Pausa Emergencial (1-clique) */}
      <div
        className={`rounded-3xl border p-6 shadow-xl transition-all ${
          settings.pausadoManualmente
            ? "border-amber-500/50 bg-amber-950/20"
            : "border-white/10 bg-[#121c15]"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-2xl ${
                settings.pausadoManualmente
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              <Power className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-display text-white">
                  Pausa Emergencial ("Pausar Atendimentos Hoje")
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                    settings.pausadoManualmente
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {settings.pausadoManualmente ? "PAUSADO" : "OPERANDO NORMALMENTE"}
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Em caso de imprevisto, folga rápida ou falta de polpa, pause os atendimentos com 1 clique sem fechar o cardápio.
              </p>
            </div>
          </div>

          <button
            onClick={handleTogglePausa}
            className={`tap w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all ${
              settings.pausadoManualmente
                ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                : "bg-amber-500 hover:bg-amber-400 text-black"
            }`}
          >
            {settings.pausadoManualmente ? "Reabrir Atendimento Agora 🟢" : "Pausar Atendimentos Hoje ⏸️"}
          </button>
        </div>

        {/* Campos adicionais da pausa */}
        {settings.pausadoManualmente && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-white/70 mb-1">
                Motivo da Pausa (Ex: Chuva forte, Reposição de polpa):
              </label>
              <input
                type="text"
                value={settings.motivoPausa}
                onChange={(e) => setSettings({ ...settings, motivoPausa: e.target.value })}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-white/70 mb-1">Previsão de Retorno:</label>
              <input
                type="text"
                value={settings.previsaoRetorno}
                onChange={(e) => setSettings({ ...settings, previsaoRetorno: e.target.value })}
                placeholder="Ex: Hoje às 19:00 ou Amanhã às 13:00"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-white/70 mb-1">
                Mensagem Exibida aos Clientes no Topo do Cardápio:
              </label>
              <textarea
                rows={2}
                value={settings.mensagemPausaPersonalizada}
                onChange={(e) =>
                  setSettings({ ...settings, mensagemPausaPersonalizada: e.target.value })
                }
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Grade Semanal de Horários */}
      <form
        onSubmit={handleSalvarConfigs}
        className="rounded-3xl border border-white/10 bg-[#121c15] p-6 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Grade Semanal de Atendimento (Delivery)
            </h3>
            <p className="text-xs text-white/50">
              Fora destes horários, o cardápio exibe aviso acolhedor e informa a previsão de abertura.
            </p>
          </div>
          <button
            type="submit"
            className="tap flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-black shadow-md transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Grade</span>
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {settings.horariosSemanais.map((dia, idx) => (
            <div
              key={dia.dia}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 w-40">
                <input
                  type="checkbox"
                  id={`dia-${idx}`}
                  checked={dia.aberto}
                  onChange={(e) => handleDiaChange(idx, "aberto", e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
                <label
                  htmlFor={`dia-${idx}`}
                  className={`font-bold ${dia.aberto ? "text-white" : "text-white/40"}`}
                >
                  {dia.dia}
                </label>
              </div>

              <div className="flex items-center gap-3">
                {dia.aberto ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/50 text-[11px]">Das</span>
                      <input
                        type="time"
                        value={dia.inicio}
                        onChange={(e) => handleDiaChange(idx, "inicio", e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-white text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/50 text-[11px]">às</span>
                      <input
                        type="time"
                        value={dia.fim}
                        onChange={(e) => handleDiaChange(idx, "fim", e.target.value)}
                        className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-white text-xs font-bold"
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-white/40 italic text-[11px]">Fechado o dia todo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
