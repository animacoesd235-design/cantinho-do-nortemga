import { registerOrderSale } from "./cash-store";

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
  } catch (e) {
    console.error("Erro ao salvar pedido no KDS:", e);
  }
}

export function updateOrderStatus(orderId: string, newStatus: Order["status"]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getOrders();
    const updated = current.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          dispatchedAt: newStatus === "pronto" && !o.dispatchedAt ? new Date().toISOString() : o.dispatchedAt,
        };
      }
      return o;
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    dispatchOrdersUpdate();
  } catch (e) {
    console.error("Erro ao atualizar status do pedido:", e);
  }
}

export function deleteOrder(orderId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getOrders();
    const updated = current.filter((o) => o.id !== orderId);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    dispatchOrdersUpdate();
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

export function onOrdersUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

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
        ? "Pix Aprovado"
        : "Pix"
      : order.pagamento.metodo === "cartao_entrega"
      ? "Cartão na Entrega"
      : "Dinheiro na Entrega";

  let msg = "";
  if (type === "etapa1_confirmacao") {
    msg = `🌿 Olá, ${order.cliente.nome}! Recebemos seu pedido ${order.id} no Cantinho do Norte. Separando kits para entrega em ${enderecoFormatado}. Pagamento via ${metodoFormatado}. Avisaremos quando iniciar o preparo! 🛵✨`;
  } else if (type === "etapa2_preparo") {
    msg = `👨‍🍳 Oi, ${order.cliente.nome}! Seu pedido ${order.id} entrou em preparo na cozinha. Nossos kits são lacrados para você montar em casa com o verdadeiro sabor do Norte. Logo vai para ${enderecoFormatado}! 🌿`;
  } else if (type === "etapa3_saiu_entrega") {
    msg = `🚨 Olá, ${order.cliente.nome}! Seu pedido do Cantinho do Norte acabou de sair para entrega e está a caminho de ${enderecoFormatado}. Nosso motoboy chega em instantes! Por favor, deixe o celular por perto e fique atento ao interfone ou portão para receber nossos kits fresquinhos sem espera. 🛵💨`;
  }

  return `https://wa.me/${numDestino}?text=${encodeURIComponent(msg)}`;
}
