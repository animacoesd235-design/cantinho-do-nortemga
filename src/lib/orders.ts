import { registerOrderSale } from "./cash-store";
import { getSupabaseClient, isCloudConfigured } from "./cloud-sync";

export type ExtraItem = {
  id: string;
  nome: string;
  preco: number;
  descricao?: string;
  categoria: "farinhas" | "proteinas" | "polpas" | "caldos";
};

export const UPSELL_EXTRAS: ExtraItem[] = [
  {
    id: "extra-farinha-agua",
    nome: "500ml Farinha d'Água do Pará Crocante",
    preco: 10,
    descricao: "Torrada artesanalmente, crocância incomparável",
    categoria: "farinhas",
  },
  {
    id: "extra-farinha-tapioca",
    nome: "500ml Farinha de Tapioca Artesanal",
    preco: 10,
    descricao: "Flocada, leve e crocante para finalizar o açaí",
    categoria: "farinhas",
  },
  {
    id: "extra-camarao",
    nome: "250g Camarão Seco Salgado Selecionado",
    preco: 25,
    descricao: "Camarão graúdo do norte, salgado no ponto",
    categoria: "proteinas",
  },
  {
    id: "extra-acai-1l",
    nome: "1 Garrafa Extra de Açaí Puro Batido 1L",
    preco: 35,
    descricao: "Açaí puro batido sem xarope, pronto para servir",
    categoria: "polpas",
  },
  {
    id: "extra-tucupi",
    nome: "1 Garrafa de Tucupi Amazônico 1L",
    preco: 28,
    descricao: "Caldo artesanal de mandioca fermentada",
    categoria: "caldos",
  },
];

export type OrderItem = {
  uid: string;
  nome: string;
  preco: number;
  qtd: number;
  detalhes?: string[];
  extras?: { nome: string; preco: number }[];
  isCombo?: boolean;
};

export type DeliveryAddress = {
  rua: string;
  numero: string;
  bairro: string;
  referencia: string;
  cidade: string;
};

export type Order = {
  id: string; // Ex: "#1042"
  createdAt: string;
  dispatchedAt?: string;
  cliente: {
    nome: string;
    telefone: string;
    email?: string;
  };
  endereco: DeliveryAddress;
  itens: OrderItem[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  pagamento: {
    metodo: "pix" | "cartao_entrega" | "dinheiro_entrega";
    status: "pago" | "pendente";
    trocoPara?: string;
    mercadoPagoId?: string | number;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
  };
  status: "novo" | "preparo" | "pronto";
};

const ORDERS_KEY = "cdn_pedidos_kds_v1";
const ORDERS_EVENT = "cdn_pedidos_atualizados";
const LAST_ORDER_KEY = "cdn_ultimo_pedido_id";

export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch (e) {
    console.error("Erro ao carregar pedidos do KDS:", e);
    return [];
  }
}

export function saveOrder(order: Order): void {
  if (typeof window === "undefined") return;
  try {
    const current = getOrders();
    const updated = [order, ...current.filter((o) => o.id !== order.id)];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    setLastOrderId(order.id);
    registerOrderSale(order);
    dispatchOrdersUpdate();

    // Sincroniza com a tabela 'orders' do Supabase em segundo plano
    if (isCloudConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from("orders")
          .upsert({
            id: order.id,
            created_at: order.createdAt,
            dispatched_at: order.dispatchedAt || null,
            cliente: order.cliente || {},
            endereco: order.endereco || {},
            itens: order.itens || [],
            subtotal: order.subtotal,
            taxa_entrega: order.taxaEntrega,
            total: order.total,
            pagamento: order.pagamento || {},
            status: order.status,
            payment_status: order.pagamento?.status || "pendente",
            mp_payment_id: order.pagamento?.mercadoPagoId ? String(order.pagamento.mercadoPagoId) : null,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) console.warn("[Orders Cloud] Falha ao enviar pedido para o Supabase:", error.message);
          });
      }
    }
  } catch (e) {
    console.error("Erro ao salvar pedido no KDS:", e);
  }
}

export function updateOrderStatus(orderId: string, newStatus: Order["status"]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getOrders();
    let dispatchedDate: string | undefined = undefined;
    const updated = current.map((o) => {
      if (o.id === orderId) {
        dispatchedDate = newStatus === "pronto" && !o.dispatchedAt ? new Date().toISOString() : o.dispatchedAt;
        return {
          ...o,
          status: newStatus,
          dispatchedAt: dispatchedDate,
        };
      }
      return o;
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    dispatchOrdersUpdate();

    if (isCloudConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from("orders")
          .update({
            status: newStatus,
            dispatched_at: dispatchedDate || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .then(({ error }) => {
            if (error) console.warn("[Orders Cloud] Falha ao atualizar status no Supabase:", error.message);
          });
      }
    }
  } catch (e) {
    console.error("Erro ao atualizar status do pedido:", e);
  }
}

export function updateOrderPaymentStatus(
  orderId: string,
  newPaymentStatus: "pago" | "pendente",
  mpPaymentId?: string | number
): void {
  if (typeof window === "undefined") return;
  try {
    const current = getOrders();
    const updated = current.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          pagamento: {
            ...o.pagamento,
            status: newPaymentStatus,
            mercadoPagoId: mpPaymentId || o.pagamento.mercadoPagoId,
          },
        };
      }
      return o;
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    dispatchOrdersUpdate();

    if (isCloudConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase
          .from("orders")
          .update({
            payment_status: newPaymentStatus,
            mp_payment_id: mpPaymentId ? String(mpPaymentId) : undefined,
            pagamento: {
              status: newPaymentStatus,
              mercadoPagoId: mpPaymentId,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .then(({ error }) => {
            if (error) console.warn("[Orders Cloud] Falha ao atualizar pagamento no Supabase:", error.message);
          });
      }
    }
  } catch (e) {
    console.error("Erro ao atualizar pagamento do pedido:", e);
  }
}

export function deleteOrder(orderId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getOrders();
    const updated = current.filter((o) => o.id !== orderId);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    dispatchOrdersUpdate();

    if (isCloudConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from("orders").delete().eq("id", orderId).then(() => {});
      }
    }
  } catch (e) {
    console.error("Erro ao remover pedido:", e);
  }
}

export function clearOrders(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORDERS_KEY);
  dispatchOrdersUpdate();
}

export function getLastOrderId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_ORDER_KEY);
}

export function setLastOrderId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ORDER_KEY, id);
}

export function getOrderById(orderId: string): Order | null {
  const orders = getOrders();
  return orders.find((o) => o.id === orderId) || null;
}

function dispatchOrdersUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ORDERS_EVENT));
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: ORDERS_KEY,
      newValue: localStorage.getItem(ORDERS_KEY),
    })
  );
}

let realtimeOrdersSubscribed = false;

/**
 * Inicializa subscrição e sincronização em tempo real da tabela 'orders' no Supabase.
 */
export function initOrdersCloudSync(): void {
  if (typeof window === "undefined" || !isCloudConfigured() || realtimeOrdersSubscribed) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  realtimeOrdersSubscribed = true;

  // Busca pedidos recentes da nuvem
  supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)
    .then(({ data, error }) => {
      if (!error && Array.isArray(data) && data.length > 0) {
        const cloudOrders: Order[] = data.map((row: any) => ({
          id: row.id,
          createdAt: row.created_at,
          dispatchedAt: row.dispatched_at || undefined,
          cliente: row.cliente || {},
          endereco: row.endereco || {},
          itens: row.itens || [],
          subtotal: Number(row.subtotal) || 0,
          taxaEntrega: Number(row.taxa_entrega) || 0,
          total: Number(row.total) || 0,
          pagamento: {
            ...(row.pagamento || {}),
            status: row.payment_status || row.pagamento?.status || "pendente",
            mercadoPagoId: row.mp_payment_id || row.pagamento?.mercadoPagoId,
          },
          status: row.status || "novo",
        }));

        const local = getOrders();
        const merged = [...local];
        for (const co of cloudOrders) {
          const idx = merged.findIndex((m) => m.id === co.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...co };
          } else {
            merged.push(co);
          }
        }
        localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
        dispatchOrdersUpdate();
      }
    });

  // Escuta novos pedidos e atualizações de pagamento via WebSocket Realtime
  try {
    supabase
      .channel(`public:orders-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: any) => {
          const newRow = payload.new;
          if (newRow && newRow.id) {
            const current = getOrders();
            const existingIdx = current.findIndex((o) => o.id === newRow.id);
            const updatedOrder: Order = {
              id: newRow.id,
              createdAt: newRow.created_at,
              dispatchedAt: newRow.dispatched_at || undefined,
              cliente: newRow.cliente || {},
              endereco: newRow.endereco || {},
              itens: newRow.itens || [],
              subtotal: Number(newRow.subtotal) || 0,
              taxaEntrega: Number(newRow.taxa_entrega) || 0,
              total: Number(newRow.total) || 0,
              pagamento: {
                ...(newRow.pagamento || {}),
                status: newRow.payment_status || newRow.pagamento?.status || "pendente",
                mercadoPagoId: newRow.mp_payment_id || newRow.pagamento?.mercadoPagoId,
              },
              status: newRow.status || "novo",
            };

            let nextOrders: Order[];
            if (existingIdx >= 0) {
              nextOrders = [...current];
              nextOrders[existingIdx] = updatedOrder;
            } else {
              nextOrders = [updatedOrder, ...current];
            }

            localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
            dispatchOrdersUpdate();
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn("[Orders Cloud] Erro ao subscrever a pedidos realtime:", err);
  }
}

export function onOrdersUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  initOrdersCloudSync();

  const handleCustom = () => callback();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === ORDERS_KEY || !e.key) {
      callback();
    }
  };

  window.addEventListener(ORDERS_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(ORDERS_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

export function generateOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `#${num}`;
}

export function buildWhatsAppStatusUrl(
  order: Order,
  type: "etapa1_confirmacao" | "etapa2_preparo" | "etapa3_saiu_entrega"
): string {
  const foneLimpo = order.cliente.telefone.replace(/\D/g, "");
  const numDestino = foneLimpo.length <= 11 ? `55${foneLimpo}` : foneLimpo;

  const enderecoFormatado = `${order.endereco.rua}, Nº ${order.endereco.numero} (${order.endereco.bairro})`;
  const metodoFormatado =
    order.pagamento.metodo === "pix"
      ? order.pagamento.status === "pago"
        ? "Pix Aprovado no Mercado Pago"
        : "Pix"
      : order.pagamento.metodo === "cartao_entrega"
      ? "Cartão na Entrega"
      : "Dinheiro na Entrega";

  const primeiroNome = order.cliente.nome.trim().split(" ")[0] || "Cliente";

  let msg = "";
  if (type === "etapa1_confirmacao") {
    msg = `🌿 Olá, ${primeiroNome}! Muito obrigado pelo seu pedido ${order.id} no Cantinho do Norte. É um verdadeiro prazer ter você como nosso cliente VIP! Já confirmamos sua solicitação e estamos separando tudo com muito carinho e capricho para entrega em ${enderecoFormatado}. Pagamento via ${metodoFormatado}. Avisaremos assim que iniciar o preparo dos seus kits! 🛵✨`;
  } else if (type === "etapa2_preparo") {
    msg = `👨‍🍳 Olá, ${primeiroNome}! Seu pedido ${order.id} acabou de entrar em preparo na nossa cozinha artesanal do Cantinho do Norte. Nossas garrafas e potes estão sendo lacrados para você montar em casa com a verdadeira essência da Amazônia. Logo estará a caminho de ${enderecoFormatado}! 🌿🥥`;
  } else if (type === "etapa3_saiu_entrega") {
    msg = `🚨 Olá, ${primeiroNome}! Seu pedido ${order.id} do Cantinho do Norte acabou de sair para entrega e está a caminho de ${enderecoFormatado}. Nosso motoboy chega em instantes! Por favor, deixe o celular por perto e fique atento ao interfone ou portão para receber seus kits lacrados. Foi um prazer enorme atender você e tenha uma experiência deliciosa! 🛵💨🌿`;
  }

  return `https://wa.me/${numDestino}?text=${encodeURIComponent(msg)}`;
}

// Inicializa sincronização de pedidos ao carregar no browser
if (typeof window !== "undefined") {
  initOrdersCloudSync();
}
