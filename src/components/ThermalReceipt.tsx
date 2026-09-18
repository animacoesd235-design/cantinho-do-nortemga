import { brl } from "@/lib/menu-data";
import type { Order } from "@/lib/orders";

interface ThermalReceiptProps {
  order: Order | null;
}

export function ThermalReceipt({ order }: ThermalReceiptProps) {
  if (!order) return null;

  const dataFormatada = new Date(order.createdAt).toLocaleDateString("pt-BR");
  const horaFormatada = new Date(order.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const metodoPagamentoTexto =
    order.pagamento.metodo === "pix"
      ? `PIX (${order.pagamento.status === "pago" ? "PAGO ANTECIPADO" : "AGUARDANDO"})`
      : order.pagamento.metodo === "cartao_entrega"
      ? "CARTÃO NA ENTREGA (MÁQUINA)"
      : `DINHEIRO NA ENTREGA ${order.pagamento.trocoPara ? `(Troco p/ R$ ${order.pagamento.trocoPara})` : "(Sem troco)"}`;

  return (
    <div id="thermal-receipt" className="hidden print:block font-mono text-black bg-white p-2 leading-tight text-xs max-w-[80mm] mx-auto">
      {/* Cabeçalho */}
      <div className="text-center space-y-0.5 border-b-2 border-dashed border-black pb-2">
        <h1 className="text-base font-black tracking-wider uppercase">
          CANTINHO DO NORTE
        </h1>
        <p className="text-[11px] font-bold">Açaí & Empório Artesanal</p>
        <p className="text-[10px] font-extrabold uppercase bg-black text-white px-2 py-0.5 inline-block mt-1">
          *** 100% DELIVERY ***
        </p>
        <p className="text-[10px] text-gray-700">Maringá - PR • Pedidos WhatsApp</p>
      </div>

      {/* Identificação do Pedido */}
      <div className="py-2 border-b border-dashed border-black space-y-1">
        <div className="flex justify-between items-baseline font-black text-sm">
          <span>COMANDA: {order.id}</span>
          <span className="text-xs">{horaFormatada}</span>
        </div>
        <div className="text-[11px] text-gray-800">
          <span>Data: {dataFormatada}</span>
        </div>
      </div>

      {/* Dados do Cliente e Endereço */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-1">
        <div className="font-bold text-xs uppercase">
          CLIENTE: <span className="font-black">{order.cliente.nome}</span>
        </div>
        <div className="text-xs">
          TEL: <span className="font-bold">{order.cliente.telefone}</span>
        </div>
        <div className="mt-1 pt-1 border-t border-dotted border-gray-400">
          <div className="font-extrabold text-[11px] uppercase tracking-wide">
            ENDEREÇO DE ENTREGA:
          </div>
          <div className="font-black text-xs uppercase">
            {order.endereco.rua}, Nº {order.endereco.numero}
          </div>
          <div className="text-xs">
            Bairro: <span className="font-bold">{order.endereco.bairro}</span>
          </div>
          {order.endereco.referencia && (
            <div className="text-[11px] italic font-semibold mt-0.5 bg-gray-100 p-1 border border-gray-300">
              Ref: {order.endereco.referencia}
            </div>
          )}
        </div>
      </div>

      {/* Itens do Pedido */}
      <div className="py-2 border-b-2 border-dashed border-black">
        <div className="flex justify-between font-black text-[11px] border-b border-black pb-1 mb-1">
          <span>QTD ITEM</span>
          <span>VALOR</span>
        </div>
        <div className="space-y-1.5">
          {order.itens.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between font-bold text-xs">
                <span>
                  {item.qtd}x {item.nome}
                </span>
                <span>{brl(item.preco * item.qtd)}</span>
              </div>
              {item.extras && item.extras.length > 0 && (
                <div className="pl-3 space-y-0.5 text-[10px] text-gray-800">
                  {item.extras.map((ex, i) => (
                    <div key={i} className="flex justify-between italic">
                      <span>↳ + {ex.nome}</span>
                      <span>+{brl(ex.preco)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{brl(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxa de Entrega:</span>
          <span>{brl(order.taxaEntrega)}</span>
        </div>
        <div className="flex justify-between font-black text-sm pt-1 border-t border-dotted border-black">
          <span>TOTAL GERAL:</span>
          <span>{brl(order.total)}</span>
        </div>
      </div>

      {/* Pagamento */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-1">
        <div className="text-[10px] font-bold uppercase text-gray-700">
          FORMA DE PAGAMENTO:
        </div>
        <div className="font-black text-xs uppercase p-1 bg-gray-100 border border-black text-center">
          {metodoPagamentoTexto}
        </div>
      </div>

      {/* Rodapé da Comanda */}
      <div className="pt-2 text-center text-[10px] space-y-0.5">
        <p className="font-bold">🌿 SABORES QUE VÊM DA NOSSA TERRA</p>
        <p className="italic">Preparamos tudo com muito carinho e capricho!</p>
        <p className="font-black pt-0.5">Muito obrigado pela preferência!</p>
        <div className="text-[9px] text-gray-500 pt-1">
          Impresso em: {new Date().toLocaleString("pt-BR")}
        </div>
      </div>
    </div>
  );
}
