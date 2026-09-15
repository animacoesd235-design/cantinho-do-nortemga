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
  imagem: string;
  destaque?: string;
};

export const pratos: Produto[] = [
  {
    id: "acai-camarao",
    nome: "Açaí com Camarão Tradicional",
    descricao:
      "O autêntico açaí grosso da Amazônia servido com camarão seco selecionado, azeite e farinha do norte.",
    preco: 34.9,
    imagem: acaiCamarao,
    destaque: "Mais pedido",
  },
  {
    id: "bowl-puro",
    nome: "Bowl Amazônico Puro",
    descricao:
      "Açaí 100% puro da Amazônia, sem xarope de guaraná artificial, batido na hora, cremoso e natural.",
    preco: 22.9,
    imagem: bowlPuro,
    destaque: "Sem misturas",
  },
  {
    id: "acai-cupuacu",
    nome: "Açaí com Cupuaçu",
    descricao:
      "A combinação perfeita do açaí puro com o creme cremoso de cupuaçu legítimo da Amazônia.",
    preco: 26.9,
    imagem: acaiCupuacu,
  },
  {
    id: "combo-para",
    nome: "Combo Pará-Maringá",
    descricao:
      "Açaí grande (500ml) + porção extra de camarão seco + mix de farinhas artesanais do norte.",
    preco: 49.9,
    imagem: comboPara,
    destaque: "Combo",
  },
];

export const emporio: Produto[] = [
  {
    id: "farinha-agua",
    nome: "Farinha d'Água do Pará (1kg)",
    descricao: "Crocante, artesanal e torrada no ponto certo, direto do Pará.",
    preco: 24.9,
    imagem: farinhaAgua,
  },
  {
    id: "farinha-tapioca",
    nome: "Farinha de Tapioca / Ojon (500g)",
    descricao: "Leve e delicada, perfeita para acompanhar o açaí ou o café da tarde.",
    preco: 19.9,
    imagem: farinhaTapioca,
  },
  {
    id: "camarao-seco",
    nome: "Camarão Seco Salgado Selecionado (250g)",
    descricao: "Camarão graúdo, salgado no ponto e selecionado peça a peça.",
    preco: 39.9,
    imagem: camaraoSeco,
  },
  {
    id: "tucupi",
    nome: "Tucupi Autêntico da Amazônia (1L)",
    descricao: "Caldo dourado de mandioca fermentada, base do tacacá e do pato no tucupi.",
    preco: 28.9,
    imagem: tucupi,
  },
];

export const tamanhos = [
  { id: "p", nome: "P — 300ml", preco: 16.9 },
  { id: "m", nome: "M — 500ml", preco: 22.9 },
  { id: "g", nome: "G — 700ml", preco: 28.9 },
];

export const bases = [
  { id: "puro", nome: "Açaí Puro da Amazônia", preco: 0 },
  { id: "cupuacu", nome: "Meio Açaí / Meio Cupuaçu", preco: 3 },
  { id: "castanha", nome: "Açaí com Creme de Castanha", preco: 4 },
];

export const doces = [
  { id: "leite-cond", nome: "Leite Condensado", preco: 0 },
  { id: "leite-po", nome: "Leite em Pó", preco: 0 },
  { id: "granola", nome: "Granola Crocante", preco: 0 },
  { id: "pacoca", nome: "Paçoca", preco: 0 },
  { id: "banana", nome: "Banana em rodelas", preco: 0 },
  { id: "morango", nome: "Morango", preco: 0 },
];

export const norte = [
  { id: "camarao", nome: "Camarão Seco", preco: 8 },
  { id: "farinha-dagua", nome: "Farinha d'Água", preco: 3 },
  { id: "farinha-tap", nome: "Farinha de Tapioca", preco: 3 },
  { id: "castanha-para", nome: "Castanha do Pará triturada", preco: 5 },
];

export const WHATSAPP = "5544999999999";

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
