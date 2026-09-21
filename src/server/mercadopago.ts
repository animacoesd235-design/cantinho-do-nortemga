/**
 * Serviço e Handlers de API para Integração Pix do Mercado Pago.
 * Autenticação obrigatória via MP_ACCESS_TOKEN.
 */

function getAccessToken(env?: any): string {
  const token =
    env?.MP_ACCESS_TOKEN ||
    (typeof process !== "undefined" ? process.env?.MP_ACCESS_TOKEN : "") ||
    (import.meta as any)?.env?.MP_ACCESS_TOKEN;
  return typeof token === "string" ? token.trim() : "";
}

function getSupabaseConfig(env?: any) {
  const url =
    env?.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_URL : "") ||
    (import.meta as any)?.env?.VITE_SUPABASE_URL;

  const key =
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    (typeof process !== "undefined" ? process.env?.SUPABASE_SERVICE_ROLE_KEY : "") ||
    env?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_ANON_KEY : "") ||
    (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;

  if (url && key) return { url, key };
  return null;
}

/**
 * Atualiza o status do pedido na tabela 'orders' do Supabase quando o pagamento for aprovado.
 */
export async function updateSupabaseOrderPayment(
  orderId: string,
  paymentId: string | number,
  env?: any
): Promise<boolean> {
  const cfg = getSupabaseConfig(env);
  if (!cfg) {
    console.log("[MercadoPago Server] Supabase não configurado no ambiente, pulando atualização direta no DB.");
    return false;
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(cfg.url, cfg.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (existing) {
      const pagamentoAtual = typeof existing.pagamento === "object" ? existing.pagamento : {};
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "pago",
          mp_payment_id: String(paymentId),
          pagamento: {
            ...pagamentoAtual,
            status: "pago",
            mercadoPagoId: paymentId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        console.warn("[MercadoPago Server] Erro ao atualizar pedido existente no Supabase:", error.message);
        return false;
      }
      console.log(`[MercadoPago Server] Pedido ${orderId} atualizado para 'pago' no Supabase.`);
      return true;
    } else {
      // Se o pedido ainda não estava na nuvem, registra com status pago
      const { error } = await supabase.from("orders").insert({
        id: orderId,
        payment_status: "pago",
        mp_payment_id: String(paymentId),
        status: "novo",
        pagamento: {
          metodo: "pix",
          status: "pago",
          mercadoPagoId: paymentId,
        },
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("[MercadoPago Server] Erro ao criar pedido como pago no Supabase:", error.message);
        return false;
      }
      console.log(`[MercadoPago Server] Pedido ${orderId} inserido como 'pago' no Supabase.`);
      return true;
    }
  } catch (err: any) {
    console.warn("[MercadoPago Server] Falha ao sincronizar pagamento no Supabase:", err?.message || err);
    return false;
  }
}

/**
 * Handler: POST /api/mercadopago/create-pix
 */
export async function handleCreatePixPayment(request: Request, env?: any): Promise<Response> {
  const token = getAccessToken(env);
  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Variável de ambiente MP_ACCESS_TOKEN não configurada. Configure o token de acesso do Mercado Pago no arquivo .env ou nas configurações da Vercel.",
      }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      transaction_amount,
      description,
      order_id,
      email,
      nome,
      telefone,
      order,
    } = body;

    const amount = Number(transaction_amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Valor total (transaction_amount) inválido." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const orderId = order_id || order?.id || `#${Math.floor(1000 + Math.random() * 9000)}`;
    const clientName = (nome || order?.cliente?.nome || "Cliente").trim();
    const clientPhone = (telefone || order?.cliente?.telefone || "").replace(/\D/g, "");
    
    // E-mail válido do cliente ou fallback amigável
    let clientEmail = (email || order?.cliente?.email || "").trim().toLowerCase();
    if (!clientEmail || !clientEmail.includes("@")) {
      const sanitizedPhone = clientPhone || Math.floor(10000000 + Math.random() * 90000000);
      clientEmail = `cliente_${sanitizedPhone}@cantinhodonorte.com.br`;
    }

    const nameParts = clientName.split(" ");
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "Cantinho";

    const desc =
      description || `Pedido ${orderId} - Cantinho do Norte (Açaí & Empório)`;

    // Prepara payload para o Mercado Pago (/v1/payments)
    const mpPayload = {
      transaction_amount: Number(amount.toFixed(2)),
      description: desc,
      payment_method_id: "pix",
      payer: {
        email: clientEmail,
        first_name: firstName,
        last_name: lastName,
      },
      external_reference: orderId,
    };

    const idempotencyKey = `pix-${orderId}-${Date.now()}`;

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpResponse.json().catch(() => ({}));

    if (!mpResponse.ok) {
      console.error("[MercadoPago Server] Erro da API Mercado Pago:", mpData);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            mpData?.message ||
            mpData?.cause?.[0]?.description ||
            "Erro ao comunicar com o Mercado Pago para geração do Pix.",
          details: mpData,
        }),
        { status: mpResponse.status || 500, headers: { "content-type": "application/json" } }
      );
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || "";
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || "";
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || "";
    const paymentId = mpData.id;
    const status = mpData.status || "pending";

    // Se recebemos o pedido completo, salvamos o registro inicial no Supabase com status pendente
    if (order) {
      const cfg = getSupabaseConfig(env);
      if (cfg) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(cfg.url, cfg.key, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          await supabase.from("orders").upsert({
            id: orderId,
            cliente: order.cliente || {},
            endereco: order.endereco || {},
            itens: order.itens || [],
            subtotal: order.subtotal || 0,
            taxa_entrega: order.taxaEntrega || 0,
            total: order.total || amount,
            pagamento: {
              ...order.pagamento,
              metodo: "pix",
              status: "pendente",
              mercadoPagoId: paymentId,
              pixQrCode: qrCode,
            },
            status: "novo",
            payment_status: "pendente",
            mp_payment_id: String(paymentId),
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("[MercadoPago Server] Erro ao gravar pedido inicial no Supabase:", dbErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        order_id: orderId,
        status,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[MercadoPago Server] Exceção ao gerar Pix:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Erro interno ao processar requisição de Pix.",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

/**
 * Handler: GET /api/mercadopago/payment-status?id=...&order_id=...
 */
export async function handleCheckPaymentStatus(request: Request, env?: any): Promise<Response> {
  const token = getAccessToken(env);
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: "MP_ACCESS_TOKEN não configurado." }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const paymentId = url.searchParams.get("id");
  const orderId = url.searchParams.get("order_id");

  if (!paymentId) {
    return new Response(
      JSON.stringify({ success: false, error: "ID do pagamento é obrigatório (?id=...)." }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const mpData = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: mpData?.message || "Erro ao consultar status no Mercado Pago.",
        }),
        { status: mpResponse.status || 500, headers: { "content-type": "application/json" } }
      );
    }

    const status = mpData.status; // 'pending' | 'approved' | 'authorized' | 'in_process' | 'rejected' | 'cancelled'
    const isPaid = status === "approved";
    const refOrderId = orderId || mpData.external_reference;

    // Se aprovado e tivermos o orderId, atualiza o Supabase
    if (isPaid && refOrderId) {
      await updateSupabaseOrderPayment(refOrderId, paymentId, env);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        order_id: refOrderId,
        status,
        is_paid: isPaid,
        status_detail: mpData.status_detail,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Erro ao verificar status do pagamento.",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

/**
 * Handler: POST /api/mercadopago/webhook
 */
export async function handleMercadoPagoWebhook(request: Request, env?: any): Promise<Response> {
  const token = getAccessToken(env);
  if (!token) {
    return new Response("Webhook received (no token)", { status: 200 });
  }

  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Mercado Pago pode enviar dados no body ou via query params
    const paymentId =
      body?.data?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      (body?.type === "payment" ? body?.id : null);

    if (paymentId) {
      console.log(`[MercadoPago Webhook] Notificação recebida para pagamento: ${paymentId}`);
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (mpResponse.ok) {
        const mpData = await mpResponse.json();
        if (mpData.status === "approved" && mpData.external_reference) {
          await updateSupabaseOrderPayment(mpData.external_reference, paymentId, env);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.warn("[MercadoPago Webhook] Erro ao processar webhook:", err?.message || err);
    return new Response(JSON.stringify({ received: true, error: err?.message }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}
