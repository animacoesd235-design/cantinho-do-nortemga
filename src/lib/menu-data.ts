import acaiCamarao from "@/assets/acai-camarao.jpg";
import bowlPuro from "@/assets/bowl-puro.jpg";
import acaiCupuacu from "@/assets/acai-cupuacu.jpg";
import comboPara from "@/assets/combo-para.jpg";
import farinhaAgua from "@/assets/farinha-agua.jpg";
import farinhaTapioca from "@/assets/farinha-tapioca.jpg";
import camaraoSeco from "@/assets/camarao-seco.jpg";
import tucupi from "@/assets/tucupi.jpg";

export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  precoOriginal?: number;
  economia?: number;
  imagem: string;
  image?: string;
  destaque?: string;
};

export const combos: Produto[] = [
  {
    id: "kit-completo",
    nome: "Kit Completo (Açaí + Farinhas)",
    descricao: "1 Litro de Açaí + 500ml de Farinha + 500ml de Tapioca.",
    preco: 48,
    precoOriginal: 65,
    economia: 17,
    imagem: comboPara,
    image: comboPara,
    destaque: "Mais Vendido • Melhor Custo",
  },
  {
    id: "combo-1l-farinha",
    nome: "Combo 1L Açaí + 1L Farinha",
    descricao: "1 Litro de Açaí + 1 Litro de Farinha de Mandioca.",
    preco: 53,
    precoOriginal: 57,
    economia: 4,
    imagem: comboPara,
    image: comboPara,
  },
  {
    id: "combo-2l-farinha",
    nome: "Combo 2L Açaí + 1L Farinha",
    descricao: "2 Litros de Açaí + 1 Litro de Farinha de Mandioca.",
    preco: 85,
    precoOriginal: 94,
    economia: 9,
    imagem: comboPara,
    image: comboPara,
  },
  {
    id: "combo-3l-farinha",
    nome: "Combo 3L Açaí + 2L Farinha",
    descricao: "3 Litros de Açaí + 2 Litros de Farinha de Mandioca.",
    preco: 131,
    precoOriginal: 151,
    economia: 20,
    imagem: comboPara,
    image: comboPara,
    destaque: "Família",
  },
  {
    id: "combo-farinha-camarao",
    nome: "Combo Açaí + Farinha + Camarão",
    descricao: "1 Litro de Açaí + 1 Litro de Farinha + 250g de Camarão.",
    preco: 70,
    precoOriginal: 82,
    economia: 12,
    imagem: acaiCamarao,
    image: acaiCamarao,
    destaque: "Tradição",
  },
  {
    id: "combo-tapioca-camarao",
    nome: "Combo Açaí + Tapioca + Camarão",
    descricao: "1 Litro de Açaí + 1 Litro de Tapioca + 250g de Camarão.",
    preco: 68,
    precoOriginal: 82,
    economia: 14,
    imagem: acaiCamarao,
    image: acaiCamarao,
  },
  {
    id: "combo-farinha-conserva",
    nome: "Combo Açaí + Farinha + Conserva Desfiada",
    descricao:
      "1 Litro de Açaí + 1 Litro de Farinha + 1 Conserva Desfiada 320g.",
    preco: 68,
    precoOriginal: 77,
    economia: 9,
    imagem: comboPara,
    image: comboPara,
  },
  {
    id: "combo-farinha-charque",
    nome: "Combo Açaí + Farinha + Charque",
    descricao:
      "1 Litro de Açaí + 1 Litro de Farinha + 200g de Charque Regional do Amapá.",
    preco: 68,
    precoOriginal: 78,
    economia: 10,
    imagem: comboPara,
    image: comboPara,
  },
];

export const avulsos: Produto[] = [
  {
    id: "acai-litro",
    nome: "Açaí Batido ou Polpa (1 Litro)",
    descricao: "Puro da Amazônia, sem misturas, pronto para consumir ou montar em casa.",
    preco: 37,
    imagem: bowlPuro,
    image: bowlPuro,
    destaque: "Mais pedido",
  },
  {
    id: "charque",
    nome: "Charque Regional do Amapá (1 kg)",
    descricao: "Charque selecionado do Amapá, sabor autêntico do norte.",
    preco: 90,
    imagem: comboPara,
    image: comboPara,
  },
  {
    id: "camarao-salgado",
    nome: "Camarão Salgado Selecionado (1 kg)",
    descricao: "Camarão graúdo, salgado no ponto e selecionado peça a peça.",
    preco: 100,
    imagem: camaraoSeco,
    image: camaraoSeco,
  },
  {
    id: "conserva-carne",
    nome: "Conserva de Carne (Unidade)",
    descricao: "Carne em conserva artesanal, tradição da despensa amazônica.",
    preco: 20,
    imagem: comboPara,
    image: comboPara,
  },
  {
    id: "polpa-cupuacu",
    nome: "Polpa de Cupuaçu (Unidade)",
    descricao: "Polpa cremosa e legítima de cupuaçu, direto da Amazônia.",
    preco: 45,
    imagem: acaiCupuacu,
    image: acaiCupuacu,
  },
  {
    id: "farinha-mandioca",
    nome: "Farinha de Mandioca (O Litro)",
    descricao: "Crocante, artesanal e torrada no ponto certo, direto do Pará.",
    preco: 20,
    imagem: farinhaAgua,
    image: farinhaAgua,
  },
  {
    id: "farinha-tapioca",
    nome: "Farinha de Tapioca (O Litro)",
    descricao: "Leve e delicada, perfeita para acompanhar o açaí.",
    preco: 20,
    imagem: farinhaTapioca,
    image: farinhaTapioca,
  },
  {
    id: "tucupi",
    nome: "Tucupi (O Litro)",
    descricao: "Caldo dourado de mandioca fermentada, base do tacacá e do pato no tucupi.",
    preco: 30,
    imagem: tucupi,
    image: tucupi,
  },
  {
    id: "maniva",
    nome: "Maniva Pré-Cozida (1 kg)",
    descricao: "Folha de mandioca pronta para a sua maniçoba.",
    preco: 60,
    imagem: farinhaAgua,
    image: farinhaAgua,
  },
  {
    id: "farofa",
    nome: "Farofa (O Litro)",
    descricao: "Farofa artesanal dourada, companhia ideal de qualquer prato.",
    preco: 20,
    imagem: farinhaAgua,
    image: farinhaAgua,
  },
];

export const WHATSAPP = "5544991723310";

export const brl = (v?: number | null) => {
  const num = typeof v === "number" && !isNaN(v) ? v : 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
