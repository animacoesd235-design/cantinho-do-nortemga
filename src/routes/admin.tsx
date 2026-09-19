import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Minus,
  Package,
  Plus,
  Power,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unlock,
  Upload,
  Wallet,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-cantinho.png";
import { compressImageFile } from "@/lib/image-utils";
import {
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  onAuthChange,
} from "@/lib/auth";
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
  addCategory,
  deleteCategory,
  deleteProduct,
  getCategories,
  getCustomProducts,
  IMAGE_PRESETS,
  onCategoriesUpdate,
  onProductsUpdate,
  resetProductsToDefault,
  saveProduct,
  type Categoria,
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
  ssr: false,
  head: () => ({
    meta: [{ title: "Painel Administrativo — Cantinho do Norte" }],
  }),
  component: PainelAdmin,
});

function PainelAdmin() {
  const [autenticado, setAutenticado] = useState(() => isAdminAuthenticated());
  const [tabAtiva, setTabAtiva] = useState<"caixa" | "produtos" | "config">("caixa");

  useEffect(() => {
    return onAuthChange(() => {
      setAutenticado(isAdminAuthenticated());
    });
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    toast.info("Sessão administrativa encerrada com sucesso.");
  };

  if (!autenticado) {
    return <TelaLoginAdmin onSucesso={() => setAutenticado(true)} />;
  }

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
            <button
              onClick={handleLogout}
              title="Encerrar sessão administrativa e trancar o painel"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair / Trancar</span>
            </button>
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
  const [produtosData, setProdutosData] = useState(() => getCustomProducts());
  const [categorias, setCategorias] = useState<Categoria[]>(() => getCategories());
  const [produtoEditando, setProdutoEditando] = useState<CustomProduct | null>(null);
  const [modoFoto, setModoFoto] = useState<"upload" | "preset" | "url">("upload");
  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const [modoNovaCategoria, setModoNovaCategoria] = useState(false);
  const [novoNomeCategoria, setNovoNomeCategoria] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const carregarProdutosECategorias = () => {
    try {
      setProdutosData(getCustomProducts());
      setCategorias(getCategories());
    } catch (e) {
      console.error("Erro ao carregar produtos/categorias:", e);
    }
  };

  useEffect(() => {
    carregarProdutosECategorias();
    const cleanupProds = onProductsUpdate(() => carregarProdutosECategorias());
    const cleanupCats = onCategoriesUpdate(() => carregarProdutosECategorias());
    return () => {
      cleanupProds();
      cleanupCats();
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido (JPG, PNG ou WEBP).");
      return;
    }

    try {
      setCarregandoImagem(true);
      toast.loading("Processando e otimizando imagem...", { id: "upload-img" });
      const base64 = await compressImageFile(file, 800, 800, 0.85);
      if (produtoEditando) {
        setProdutoEditando({
          ...produtoEditando,
          imagem: base64,
          image: base64,
        });
      }
      toast.success("Foto carregada com sucesso!", { id: "upload-img" });
    } catch (err: any) {
      console.error("Erro no upload da imagem:", err);
      toast.error(err?.message || "Erro ao processar a imagem", { id: "upload-img" });
    } finally {
      setCarregandoImagem(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSalvarProduto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoEditando) return;

    const nome = (produtoEditando.nome || "").trim();
    if (!nome) {
      toast.error("O nome do produto é obrigatório");
      return;
    }
    const preco = typeof produtoEditando.preco === "number" ? produtoEditando.preco : parseFloat(String(produtoEditando.preco)) || 0;
    if (preco <= 0) {
      toast.error("O preço deve ser maior que zero");
      return;
    }

    let categoriaFinal = produtoEditando.categoria || "avulsos";
    if (modoNovaCategoria && novoNomeCategoria.trim()) {
      const nova = addCategory(novoNomeCategoria.trim());
      categoriaFinal = nova.id;
      setCategorias(getCategories());
      setModoNovaCategoria(false);
      setNovoNomeCategoria("");
    }

    const imgFinal = (produtoEditando as any).image || produtoEditando.imagem || "";
    saveProduct({
      ...produtoEditando,
      nome,
      preco,
      imagem: imgFinal,
      image: imgFinal,
      categoria: categoriaFinal,
    });
    // Limpar cache legado de cdn-midia se houver, garantindo que a nova foto seja soberana
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`cdn-midia:${produtoEditando.id}`);
      } catch {}
    }
    toast.success(`Produto "${nome}" salvo com sucesso!`);
    setProdutoEditando(null);
  };

  const handleExcluirProduto = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover "${nome || 'este produto'}"?`)) {
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
    const defaultImg = (IMAGE_PRESETS && IMAGE_PRESETS.length > 0 && IMAGE_PRESETS[0]?.url) || "";
    const defaultCat = categorias[0]?.id || "combos";
    const novo: CustomProduct = {
      id: "prod-" + Date.now().toString().slice(-6),
      nome: "Novo Item Artesanal",
      descricao: "Descrição do produto artesanal",
      preco: 30,
      categoria: defaultCat,
      imagem: defaultImg,
      image: defaultImg,
      destaque: "",
    };
    setModoNovaCategoria(false);
    setNovoNomeCategoria("");
    setModoFoto("upload");
    setProdutoEditando(novo);
  };

  const handleExcluirCategoria = (cat: Categoria) => {
    if (cat.id === "combos" || cat.id === "avulsos") {
      toast.error("As categorias padrão não podem ser excluídas.");
      return;
    }
    if (confirm(`Deseja excluir a categoria "${cat.nome}"? Os produtos vinculados a ela serão movidos para Produtos à Pronta Entrega.`)) {
      deleteCategory(cat.id);
      carregarProdutosECategorias();
      toast.success(`Categoria "${cat.nome}" removida com sucesso!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#121c15] p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-black font-display text-white">Gestão de Cardápio, Categorias & Preços</h2>
          <p className="text-xs text-white/60">
            Crie categorias dinâmicas, altere preços, descrições e fotos com upload direto. As alterações refletem imediatamente na vitrine pública.
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

      {/* Listagem de Categorias e Produtos Dinâmicos */}
      <div className="space-y-8">
        {categorias.map((cat) => {
          const prods = produtosData.todos.filter((p) => {
            if (cat.id === "combos") return p.categoria === "combos" || p.categoria === "combo";
            if (cat.id === "avulsos") return p.categoria === "avulsos" || p.categoria === "avulso";
            return p.categoria === cat.id;
          });
          const isFixa = cat.id === "combos" || cat.id === "avulsos";

          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
                    {cat.nome} ({prods.length})
                  </h3>
                  {!isFixa && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                      Categoria Personalizada
                    </span>
                  )}
                </div>
                {!isFixa && (
                  <button
                    type="button"
                    onClick={() => handleExcluirCategoria(cat)}
                    title="Excluir esta categoria personalizada"
                    className="tap inline-flex items-center gap-1 text-[11px] font-medium text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remover Categoria</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prods.length > 0 ? (
                  prods.map((prod) => (
                    <CardProdutoAdmin
                      key={prod.id}
                      produto={prod}
                      onEditar={() => {
                        setModoNovaCategoria(false);
                        setNovoNomeCategoria("");
                        setProdutoEditando({ ...prod });
                      }}
                      onExcluir={() => handleExcluirProduto(prod.id, prod.nome)}
                    />
                  ))
                ) : (
                  <p className="text-xs text-white/40 col-span-full py-4 text-center">
                    Nenhum produto cadastrado nesta categoria.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edição de Produto */}
      {produtoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121c15] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-display text-white">
                {produtoEditando?.id?.startsWith("prod-") ? "Adicionar Produto" : "Editar Produto"}
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
                    value={produtoEditando.nome || ""}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white font-bold focus:outline-hidden focus:border-amber-400"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-white/70 mb-1">Descrição / Composição:</label>
                  <textarea
                    rows={2}
                    value={produtoEditando.descricao || ""}
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
                    value={produtoEditando.preco ?? ""}
                    onChange={(e) =>
                      setProdutoEditando({
                        ...produtoEditando,
                        preco: parseFloat(e.target.value) || 0,
                      })
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

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-white/70 mb-1">Categoria:</label>
                  <select
                    value={modoNovaCategoria ? "__nova__" : (produtoEditando.categoria || "avulsos")}
                    onChange={(e) => {
                      if (e.target.value === "__nova__") {
                        setModoNovaCategoria(true);
                        setNovoNomeCategoria("");
                      } else {
                        setModoNovaCategoria(false);
                        setProdutoEditando({
                          ...produtoEditando,
                          categoria: e.target.value,
                        });
                      }
                    }}
                    className="w-full rounded-xl border border-white/20 bg-[#0e1710] px-3 py-2 text-white focus:outline-hidden focus:border-amber-400 font-medium"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                    <option value="__nova__">➕ Adicionar Nova Categoria...</option>
                  </select>

                  {modoNovaCategoria && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-amber-300">
                          Nome da Nova Categoria:
                        </label>
                        <span className="text-[10px] text-amber-400/80 font-semibold">
                          Aparece como nova aba no cardápio
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={novoNomeCategoria}
                          onChange={(e) => setNovoNomeCategoria(e.target.value)}
                          placeholder="Ex: Sobremesas, Bebidas, Promoções..."
                          className="flex-1 rounded-xl border border-amber-400/40 bg-black/60 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-amber-400 font-semibold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const limpo = novoNomeCategoria.trim();
                              if (!limpo) {
                                toast.error("Informe o nome da nova categoria.");
                                return;
                              }
                              const nova = addCategory(limpo);
                              setCategorias(getCategories());
                              setProdutoEditando({ ...produtoEditando, categoria: nova.id });
                              setModoNovaCategoria(false);
                              setNovoNomeCategoria("");
                              toast.success(`Categoria "${nova.nome}" criada com sucesso!`);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const limpo = novoNomeCategoria.trim();
                            if (!limpo) {
                              toast.error("Informe o nome da nova categoria.");
                              return;
                            }
                            const nova = addCategory(limpo);
                            setCategorias(getCategories());
                            setProdutoEditando({ ...produtoEditando, categoria: nova.id });
                            setModoNovaCategoria(false);
                            setNovoNomeCategoria("");
                            toast.success(`Categoria "${nova.nome}" criada com sucesso!`);
                          }}
                          className="tap px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          Adicionar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModoNovaCategoria(false);
                          }}
                          className="tap px-3 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white text-xs transition-colors shrink-0 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
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

              {/* Seletor e Upload de Foto */}
              <div className="space-y-3 rounded-2xl bg-black/25 p-3.5 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block font-bold text-white text-xs">
                    Foto do Produto:
                  </label>
                  <div className="flex items-center gap-1 rounded-xl bg-white/5 p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setModoFoto("upload")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        modoFoto === "upload"
                          ? "bg-amber-500 text-black shadow-xs"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Upload className="h-3 w-3 inline mr-1" />
                      Upload Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoFoto("preset")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        modoFoto === "preset"
                          ? "bg-amber-500 text-black shadow-xs"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <ImageIcon className="h-3 w-3 inline mr-1" />
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoFoto("url")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        modoFoto === "url"
                          ? "bg-amber-500 text-black shadow-xs"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Link / URL
                    </button>
                  </div>
                </div>

                {/* Pré-visualização da Foto Selecionada */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  {produtoEditando.imagem ? (
                    <img
                      src={produtoEditando.imagem}
                      alt="Pré-visualização"
                      className="h-20 w-20 rounded-xl object-contain p-1 border border-amber-400/40 bg-black/40 shrink-0"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-black/40 border border-white/10 grid place-items-center text-white/40 text-[10px] shrink-0">
                      Sem foto
                    </div>
                  )}
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Imagem Definida
                    </span>
                    <p className="text-[11px] text-white/70 truncate">
                      {produtoEditando.imagem?.startsWith("data:image")
                        ? "Arquivo próprio convertido (Base64)"
                        : produtoEditando.imagem || "Nenhuma imagem selecionada"}
                    </p>
                    <p className="text-[10px] text-white/40">
                      Enquadramento automático proporcional no cardápio e no painel.
                    </p>
                  </div>
                </div>

                {/* MODO 1: UPLOAD DO DISPOSITIVO */}
                {modoFoto === "upload" && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 p-5 text-center transition-all"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                        {carregandoImagem ? (
                          <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {carregandoImagem
                            ? "Otimizando e convertendo imagem..."
                            : "Clique para escolher foto do computador ou celular"}
                        </span>
                        <span className="text-[10px] text-white/50 block mt-0.5">
                          Suporta JPG, PNG, WEBP ou câmera (Conversão inteligente em Base64)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODO 2: PRESETS */}
                {modoFoto === "preset" && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-white/50 block">Selecione uma imagem padrão da despensa:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {IMAGE_PRESETS &&
                        IMAGE_PRESETS.map((preset) => (
                          <button
                            type="button"
                            key={preset.id}
                            onClick={() =>
                              setProdutoEditando({
                                ...produtoEditando,
                                imagem: preset.url,
                                image: preset.url,
                              })
                            }
                            className={`group relative rounded-xl overflow-hidden border-2 aspect-square transition-all ${
                              (produtoEditando.image || produtoEditando.imagem) === preset.url
                                ? "border-amber-400 ring-2 ring-amber-400/40"
                                : "border-white/10 opacity-70 hover:opacity-100"
                            }`}
                          >
                            {preset.url ? (
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-white/5" />
                            )}
                            <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[8px] font-bold text-white text-center py-0.5 truncate px-1">
                              {preset.label}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* MODO 3: URL EXTERNA */}
                {modoFoto === "url" && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={produtoEditando.image || produtoEditando.imagem || ""}
                      onChange={(e) =>
                        setProdutoEditando({
                          ...produtoEditando,
                          imagem: e.target.value,
                          image: e.target.value,
                        })
                      }
                      placeholder="Cole a URL da imagem (ex: https://site.com/foto.jpg)"
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white text-xs focus:outline-hidden focus:border-amber-400"
                    />
                    <span className="text-[10px] text-white/40 block">
                      Aceita links seguros HTTPS diretos para arquivos de imagem.
                    </span>
                  </div>
                )}
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
  if (!produto) return null;

  const nome = produto.nome || "Item Artesanal";
  const descricao = produto.descricao || "";
  const preco = typeof produto.preco === "number" && !isNaN(produto.preco) ? produto.preco : 0;
  const precoOriginal =
    typeof produto.precoOriginal === "number" && !isNaN(produto.precoOriginal)
      ? produto.precoOriginal
      : undefined;
  const destaque = produto.destaque ? String(produto.destaque) : "";
  const imagem = produto.imagem || "";

  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#121c15] p-3.5 transition-all hover:border-white/20">
      {imagem ? (
        <img
          src={imagem}
          alt={nome}
          className="h-20 w-20 rounded-xl object-contain p-1 border border-white/10 shrink-0 bg-[#0e1710]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
          }}
        />
      ) : (
        <div className="h-20 w-20 rounded-xl bg-white/5 border border-white/10 shrink-0 grid place-items-center text-white/30 text-[10px]">
          Sem foto
        </div>
      )}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-bold text-white text-xs truncate">{nome}</h4>
            {destaque && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 shrink-0">
                {destaque}
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5">{descricao}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-amber-300 font-display">
              {brl(preco)}
            </span>
            {precoOriginal !== undefined && precoOriginal > 0 && (
              <span className="text-[10px] text-white/40 line-through">
                {brl(precoOriginal)}
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

// =========================================================================
// TELA DE LOGIN DO ADMINISTRADOR (ÁREA RESTRITA)
// =========================================================================

function TelaLoginAdmin({ onSucesso }: { onSucesso: () => void }) {
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
      const ok = loginAdmin(senha);
      setTentando(false);
      if (ok) {
        toast.success("Acesso administrativo autorizado!");
        onSucesso();
      } else {
        setErro(true);
        toast.error("Senha incorreta. Verifique suas credenciais.");
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#0a120c] text-[#f4efe6] antialiased flex flex-col justify-between">
      {/* Header simplificado */}
      <header className="border-b border-white/10 bg-[#0e1710]/95 backdrop-blur-md px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="Cantinho do Norte"
              className="h-9 w-9 rounded-full object-cover border border-amber-400/40 shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="block text-sm font-black font-display tracking-wide text-amber-300">
                CANTINHO DO NORTE
              </span>
              <span className="block text-[11px] font-semibold text-white/60">
                Painel Administrativo
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
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[#0e1710] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Glows decorativos sutis */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Ícone de Cadeado com Selo */}
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/10 border border-amber-400/30 text-amber-300 shadow-inner">
                <Lock className="h-8 w-8 text-amber-400" />
                <div className="absolute -bottom-1 -right-1 rounded-full bg-[#0a120c] p-0.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
              </div>

              <h1 className="text-xl font-black font-display tracking-wide text-amber-300">
                Acesso Administrativo
              </h1>
              <p className="mt-1 text-xs text-white/60 max-w-xs">
                Área restrita para controle de caixa, gestão de produtos e configuração de horários.
              </p>

              {/* Formulário de Senha */}
              <form onSubmit={handleSubmit} className="mt-6 w-full space-y-4 text-left">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-white/80">
                      Senha de Acesso
                    </label>
                    <span className="text-[10px] text-amber-400/80 font-semibold">
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
                      placeholder="Digite a senha de administrador..."
                      autoFocus
                      className={`w-full rounded-xl border bg-black/40 pl-3.5 pr-11 py-3 text-sm text-white placeholder-white/30 outline-none transition-all ${
                        erro
                          ? "border-red-500 ring-2 ring-red-500/20"
                          : "border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
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
                      <span>Senha incorreta. Use a senha padrão "admin123".</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={tentando || !senha.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-3 px-4 font-black text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {tentando ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Desbloquear Painel</span>
                    </>
                  )}
                </button>
              </form>

              {/* Informações adicionais / Atalho */}
              <div className="mt-6 pt-4 border-t border-white/10 w-full flex items-center justify-between text-[11px] text-white/40">
                <span>Cantinho do Norte Delivery</span>
                <Link to="/cozinha" className="hover:text-amber-300 transition-colors">
                  Ir para Cozinha (KDS) →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-white/30 border-t border-white/5">
        Acesso restrito a operadores do Cantinho do Norte • Maringá / PR
      </footer>
    </div>
  );
}
