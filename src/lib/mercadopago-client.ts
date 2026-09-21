import type { Order } from "./orders";

export interface CreatePixResponse {
  success: boolean;
  payment_id?: number | string;
  order_id?: string;
  status?: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  error?: string;
}

export interface CheckPixStatusResponse {
  success: boolean;
  is_paid: boolean;
  status?: string;
  status_detail?: string;
  payment_id?: number | string;
  error?: string;
}

/**
 * Chama o backend da aplicação para gerar uma cobrança Pix real no Mercado Pago.
 */
export async function createPixPayment(data: {
  transaction_amount: number;
  description?: string;
  order_id?: string;
  email?: string;
  nome?: string;
  telefone?: string;
  order?: Order;
}): Promise<CreatePixResponse> {
  try {
    const res = await fetch("/api/mercadopago/create-pix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `Erro HTTP ${res.status} ao gerar cobrança Pix.`,
      };
    }

    return json as CreatePixResponse;
  } catch (err: any) {
    console.error("[MercadoPago Client] Falha na requisição createPixPayment:", err);
    return {
      success: false,
      error: err?.message || "Erro de rede ao conectar com o serviço de pagamentos.",
    };
  }
}

/**
 * Consulta o status atual de uma cobrança Pix no Mercado Pago.
 */
export async function checkPixPaymentStatus(
  paymentId: number | string,
  orderId?: string
): Promise<CheckPixStatusResponse> {
  try {
    const q = new URLSearchParams({
      id: String(paymentId),
      ...(orderId ? { order_id: orderId } : {}),
    });

    const res = await fetch(`/api/mercadopago/payment-status?${q.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        is_paid: false,
        error: json?.error || `Erro HTTP ${res.status} ao verificar status.`,
      };
    }

    return json as CheckPixStatusResponse;
  } catch (err: any) {
    return {
      success: false,
      is_paid: false,
      error: err?.message || "Erro de rede ao consultar status do Pix.",
    };
  }
}
