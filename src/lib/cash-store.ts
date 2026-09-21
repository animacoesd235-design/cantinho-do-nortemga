export type CashMovementType = "abertura" | "venda" | "suprimento" | "sangria";

export interface CashMovement {
  id: string;
  dataHora: string;
  tipo: CashMovementType;
  descricao: string;
  valor: number;
  formaPagamento: "dinheiro" | "pix" | "cartao_entrega" | "outro";
  orderId?: string;
  operador?: string;
}

export interface CashSession {
  id: string;
  status: "aberto" | "fechado";
  abertoEm: string;
  fechadoEm?: string;
  operador: string;
  saldoInicialDinheiro: number;
  saldoFinalDinheiroConferido?: number;
  movimentos: CashMovement[];
  observacoesFechamento?: string;
}

export interface CashSummary {
  saldoInicialDinheiro: number;
  totalVendasDinheiro: number;
  totalVendasPix: number;
  totalVendasCartao: number;
  totalVendasGeral: number;
  totalSuprimentos: number;
  totalSangrias: number;
  saldoEsperadoGaveta: number;
  saldoFinalConferido?: number;
  diferencaGaveta?: number;
}

const STORAGE_ACTIVE_KEY = "cdn_caixa_ativo_v1";
const STORAGE_HISTORY_KEY = "cdn_caixa_historico_v1";
const CASH_EVENT = "cdn:caixa_atualizado";

export function getActiveCashSession(): CashSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CashSession;
  } catch (e) {
    console.error("Erro ao carregar sessão de caixa ativa:", e);
    return null;
  }
}

export function getAllCashSessions(): CashSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CashSession[];
  } catch (e) {
    console.error("Erro ao carregar histórico de caixas:", e);
    return [];
  }
}

function dispatchCashUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CASH_EVENT));
}

export function openCashSession(saldoInicial: number, operador: string = "Operador"): CashSession {
  const agora = new Date().toISOString();
  const session: CashSession = {
    id: "CX-" + Date.now().toString().slice(-6),
    status: "aberto",
    abertoEm: agora,
    operador: operador.trim() || "Operador",
    saldoInicialDinheiro: Math.max(0, saldoInicial),
    movimentos: [
      {
        id: "mov-" + Math.random().toString(36).substring(2, 9),
        dataHora: agora,
        tipo: "abertura",
        descricao: "Fundo de Troco Inicial (Abertura de Caixa)",
        valor: Math.max(0, saldoInicial),
        formaPagamento: "dinheiro",
        operador: operador.trim() || "Operador",
      },
    ],
  };

  localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));
  dispatchCashUpdate();
  return session;
}

export function addCashMovement(
  tipo: "suprimento" | "sangria",
  valor: number,
  descricao: string,
  operador: string = "Operador"
): boolean {
  const session = getActiveCashSession();
  if (!session || session.status !== "aberto") return false;

  const agora = new Date().toISOString();
  const novoMovimento: CashMovement = {
    id: "mov-" + Math.random().toString(36).substring(2, 9),
    dataHora: agora,
    tipo,
    descricao: descricao.trim() || (tipo === "suprimento" ? "Suprimento de Troco" : "Sangria / Retirada"),
    valor: Math.max(0, valor),
    formaPagamento: "dinheiro",
    operador,
  };

  session.movimentos.unshift(novoMovimento);
  localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));
  dispatchCashUpdate();
  return true;
}

export function registerOrderSale(order: {
  id: string;
  total: number;
  pagamento: { metodo: string; status?: string };
}): void {
  const session = getActiveCashSession();
  if (!session || session.status !== "aberto") return;

  // Pedidos via Pix pendentes NUNCA devem ser registrados no caixa
  if (order.pagamento?.metodo === "pix" && order.pagamento?.status !== "pago") {
    return;
  }

  // Evitar duplicar mesmo orderId
  const exists = session.movimentos.some((m) => m.orderId === order.id);
  if (exists) return;

  const agora = new Date().toISOString();
  let forma: "dinheiro" | "pix" | "cartao_entrega" | "outro" = "outro";
  if (order.pagamento.metodo === "dinheiro_entrega") forma = "dinheiro";
  else if (order.pagamento.metodo === "pix") forma = "pix";
  else if (order.pagamento.metodo === "cartao_entrega") forma = "cartao_entrega";

  const movimento: CashMovement = {
    id: "mov-" + Math.random().toString(36).substring(2, 9),
    dataHora: agora,
    tipo: "venda",
    descricao: `Venda do Pedido ${order.id}`,
    valor: order.total,
    formaPagamento: forma,
    orderId: order.id,
  };

  session.movimentos.unshift(movimento);
  localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));
  dispatchCashUpdate();
}

/**
 * Remove qualquer lançamento de venda de pedido que esteja pendente/não pago
 */
export function removeOrderSaleIfPending(orderId: string): void {
  const session = getActiveCashSession();
  if (!session || !session.movimentos) return;
  const filtered = session.movimentos.filter((m) => m.orderId !== orderId);
  if (filtered.length !== session.movimentos.length) {
    session.movimentos = filtered;
    localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));
    dispatchCashUpdate();
  }
}

export function closeCashSession(
  saldoFinalDinheiroConferido: number,
  observacoes: string = ""
): CashSession | null {
  const session = getActiveCashSession();
  if (!session || session.status !== "aberto") return null;

  const agora = new Date().toISOString();
  session.status = "fechado";
  session.fechadoEm = agora;
  session.saldoFinalDinheiroConferido = Math.max(0, saldoFinalDinheiroConferido);
  session.observacoesFechamento = observacoes.trim();

  // Salvar no histórico
  const history = getAllCashSessions();
  const updatedHistory = [session, ...history.filter((h) => h.id !== session.id)];
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
  localStorage.removeItem(STORAGE_ACTIVE_KEY);

  dispatchCashUpdate();
  return session;
}

export function calculateCashSummary(session: CashSession): CashSummary {
  let totalVendasDinheiro = 0;
  let totalVendasPix = 0;
  let totalVendasCartao = 0;
  let totalSuprimentos = 0;
  let totalSangrias = 0;

  for (const m of session.movimentos) {
    if (m.tipo === "venda") {
      if (m.formaPagamento === "dinheiro") totalVendasDinheiro += m.valor;
      else if (m.formaPagamento === "pix") totalVendasPix += m.valor;
      else if (m.formaPagamento === "cartao_entrega") totalVendasCartao += m.valor;
      else totalVendasDinheiro += m.valor;
    } else if (m.tipo === "suprimento") {
      totalSuprimentos += m.valor;
    } else if (m.tipo === "sangria") {
      totalSangrias += m.valor;
    }
  }

  const saldoInicialDinheiro = session.saldoInicialDinheiro;
  const saldoEsperadoGaveta =
    saldoInicialDinheiro + totalVendasDinheiro + totalSuprimentos - totalSangrias;
  const totalVendasGeral = totalVendasDinheiro + totalVendasPix + totalVendasCartao;

  const diferencaGaveta =
    session.saldoFinalDinheiroConferido !== undefined
      ? session.saldoFinalDinheiroConferido - saldoEsperadoGaveta
      : undefined;

  return {
    saldoInicialDinheiro,
    totalVendasDinheiro,
    totalVendasPix,
    totalVendasCartao,
    totalVendasGeral,
    totalSuprimentos,
    totalSangrias,
    saldoEsperadoGaveta,
    saldoFinalConferido: session.saldoFinalDinheiroConferido,
    diferencaGaveta,
  };
}

export function onCashUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CASH_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CASH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
