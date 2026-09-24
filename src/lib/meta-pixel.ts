declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = "1730334224937135";

/**
 * Dispara evento global de PageView
 */
export function trackPageView() {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", "PageView");
    } catch (e) {
      console.warn("[Meta Pixel] Erro ao disparar PageView:", e);
    }
  }
}

/**
 * Dispara evento de AddToCart ao adicionar item ao pedido
 */
export function trackAddToCart(nomeDoProduto: string, precoDoProduto: number) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", "AddToCart", {
        content_name: nomeDoProduto,
        value: precoDoProduto,
        currency: "BRL",
      });
      console.log("[Meta Pixel] AddToCart disparado:", {
        content_name: nomeDoProduto,
        value: precoDoProduto,
        currency: "BRL",
      });
    } catch (e) {
      console.warn("[Meta Pixel] Erro ao disparar AddToCart:", e);
    }
  }
}

/**
 * Dispara evento de InitiateCheckout ao abrir a finalização de pedido
 */
export function trackInitiateCheckout() {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", "InitiateCheckout");
      console.log("[Meta Pixel] InitiateCheckout disparado");
    } catch (e) {
      console.warn("[Meta Pixel] Erro ao disparar InitiateCheckout:", e);
    }
  }
}

/**
 * Dispara evento de Purchase ao confirmar pagamento Pix
 */
export function trackPurchase(valorTotalDoPedido: number) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", "Purchase", {
        currency: "BRL",
        value: valorTotalDoPedido,
      });
      console.log("[Meta Pixel] Purchase disparado:", {
        currency: "BRL",
        value: valorTotalDoPedido,
      });
    } catch (e) {
      console.warn("[Meta Pixel] Erro ao disparar Purchase:", e);
    }
  }
}
