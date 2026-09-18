import {
  combos as defaultCombos,
  avulsos as defaultAvulsos,
  type Produto,
} from "./menu-data";

export interface Categoria {
  id: string;
  nome: string;
}

export const DEFAULT_CATEGORIAS: Categoria[] = [
  {
    id: "combos",
    nome: "Combos Especiais",
  },
  {
    id: "avulsos",
    nome: "Produtos à Pronta Entrega",
  },
];

export interface CustomProduct extends Produto {
  image?: string;
  categoria: string;
  ativo?: boolean;
}

const STORAGE_KEY = "cdn_produtos_v2";
const CATEGORIES_KEY = "cdn_categorias_v2";

export const IMAGE_PRESETS = [
  { id: "combo-para", label: "Kit / Combo Amazônico", url: defaultCombos[0]?.imagem || "" },
  { id: "bowl-puro", label: "Tigela de Açaí Puro", url: defaultCombos[2]?.imagem || "" },
  { id: "farinha-agua", label: "Farinha D'água / Mandioca", url: defaultCombos[1]?.imagem || "" },
  { id: "farinha-tapioca", label: "Farinha de Tapioca", url: defaultCombos[6]?.imagem || "" },
  { id: "camarao-seco", label: "Camarão Salgado", url: defaultCombos[4]?.imagem || "" },
  { id: "acai-camarao", label: "Açaí com Camarão", url: defaultCombos[5]?.imagem || "" },
  { id: "acai-cupuacu", label: "Cupuaçu Cremoso", url: defaultAvulsos[4]?.imagem || "" },
  { id: "tucupi", label: "Tucupi Amarelo", url: defaultAvulsos[7]?.imagem || "" },
];

export function getCategories(): Categoria[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIAS;
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIAS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIAS;

    const temCombos = parsed.some((c) => c.id === "combos");
    const temAvulsos = parsed.some((c) => c.id === "avulsos");
    const resultado = [...parsed];
    if (!temCombos) resultado.unshift(DEFAULT_CATEGORIAS[0]);
    if (!temAvulsos) resultado.splice(1, 0, DEFAULT_CATEGORIAS[1]);
    return resultado;
  } catch (e) {
    console.error("Erro ao carregar categorias:", e);
    return DEFAULT_CATEGORIAS;
  }
}

export function saveCategories(categorias: Categoria[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categorias));
    window.dispatchEvent(new CustomEvent("cdn:categories_updated"));
    window.dispatchEvent(new CustomEvent("cdn:products_updated"));
  } catch (e) {
    console.error("Erro ao salvar categorias:", e);
  }
}

export function addCategory(nome: string): Categoria {
  const limpo = nome.trim();
  const slug =
    limpo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `cat-${Date.now().toString(36)}`;

  const current = getCategories();
  const existente = current.find((c) => c.id === slug || c.nome.toLowerCase() === limpo.toLowerCase());
  if (existente) return existente;

  const nova: Categoria = {
    id: slug,
    nome: limpo,
  };

  const atualizadas = [...current, nova];
  saveCategories(atualizadas);
  return nova;
}

export function deleteCategory(id: string): void {
  if (id === "combos" || id === "avulsos") return;
  const current = getCategories();
  const atualizadas = current.filter((c) => c.id !== id);
  saveCategories(atualizadas);

  const prods = getCustomProducts();
  const todos = prods.todos.map((p) => (p.categoria === id ? { ...p, categoria: "avulsos" } : p));
  const combos = todos.filter((p) => p.categoria === "combo" || p.categoria === "combos");
  const avulsos = todos.filter((p) => p.categoria !== "combo" && p.categoria !== "combos");
  saveAllProducts({ combos, avulsos, todos });
}

export function onCategoriesUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("cdn:categories_updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cdn:categories_updated", handler);
    window.removeEventListener("storage", handler);
  };
}

function sanitizeProduct(p: any, defaultCat: string = "avulsos"): CustomProduct {
  let cat = String(p?.categoria || defaultCat).toLowerCase();
  if (cat === "combo") cat = "combos";
  if (cat === "avulso") cat = "avulsos";

  const imagemUrl =
    p?.image ||
    p?.imagem ||
    p?.imageUrl ||
    p?.foto ||
    IMAGE_PRESETS[0]?.url ||
    "";

  return {
    id: String(p?.id || "prod-" + Math.random().toString(36).substring(2, 8)),
    nome: String(p?.nome || "Item Artesanal"),
    descricao: String(p?.descricao || ""),
    preco: typeof p?.preco === "number" && !isNaN(p.preco) ? p.preco : (Number(p?.preco) || 0),
    precoOriginal:
      typeof p?.precoOriginal === "number" && !isNaN(p.precoOriginal)
        ? p.precoOriginal
        : p?.precoOriginal
        ? Number(p.precoOriginal)
        : undefined,
    economia: typeof p?.economia === "number" && !isNaN(p.economia) ? p.economia : undefined,
    imagem: imagemUrl,
    image: imagemUrl,
    destaque: p?.destaque ? String(p.destaque) : "",
    categoria: cat,
    ativo: p?.ativo !== false,
  };
}

function getDefaults(): { combos: CustomProduct[]; avulsos: CustomProduct[]; todos: CustomProduct[] } {
  const cList = Array.isArray(defaultCombos) ? defaultCombos : [];
  const aList = Array.isArray(defaultAvulsos) ? defaultAvulsos : [];
  const combos = cList.map((c) => sanitizeProduct(c, "combos"));
  const avulsos = aList.map((a) => sanitizeProduct(a, "avulsos"));
  return {
    combos,
    avulsos,
    todos: [...combos, ...avulsos],
  };
}

export function getCustomProducts(): {
  combos: CustomProduct[];
  avulsos: CustomProduct[];
  todos: CustomProduct[];
} {
  const def = getDefaults();
  if (typeof window === "undefined") {
    return def;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return def;
    }
    const data = JSON.parse(raw);

    if (Array.isArray(data?.todos) && data.todos.length > 0) {
      const todos = data.todos.map((p: any) => sanitizeProduct(p));
      const combos = todos.filter((p) => p.categoria === "combo" || p.categoria === "combos");
      const avulsos = todos.filter((p) => p.categoria !== "combo" && p.categoria !== "combos");
      return { combos, avulsos, todos };
    }

    const combos = Array.isArray(data?.combos)
      ? data.combos.map((c: any) => sanitizeProduct(c, "combos"))
      : def.combos;
    const avulsos = Array.isArray(data?.avulsos)
      ? data.avulsos.map((a: any) => sanitizeProduct(a, "avulsos"))
      : def.avulsos;

    return {
      combos,
      avulsos,
      todos: [...combos, ...avulsos],
    };
  } catch (e) {
    console.error("Erro ao carregar produtos:", e);
    return def;
  }
}

export function saveAllProducts(data: {
  combos: CustomProduct[];
  avulsos: CustomProduct[];
  todos?: CustomProduct[];
}): void {
  if (typeof window === "undefined") return;
  try {
    const todos =
      data.todos ||
      [...data.combos, ...data.avulsos].filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        combos: data.combos,
        avulsos: data.avulsos,
        todos,
      })
    );
    window.dispatchEvent(new CustomEvent("cdn:products_updated"));
  } catch (e) {
    console.error("Erro ao salvar produtos:", e);
  }
}

export function saveProduct(produto: CustomProduct): void {
  const current = getCustomProducts();
  let todos = [...current.todos];
  const idx = todos.findIndex((p) => p.id === produto.id);

  if (idx >= 0) {
    todos[idx] = produto;
  } else {
    todos.push(produto);
  }

  const combos = todos.filter((p) => p.categoria === "combo" || p.categoria === "combos");
  const avulsos = todos.filter((p) => p.categoria !== "combo" && p.categoria !== "combos");

  saveAllProducts({ combos, avulsos, todos });
}

export function deleteProduct(id: string): void {
  const current = getCustomProducts();
  const todos = current.todos.filter((p) => p.id !== id);
  const combos = todos.filter((p) => p.categoria === "combo" || p.categoria === "combos");
  const avulsos = todos.filter((p) => p.categoria !== "combo" && p.categoria !== "combos");
  saveAllProducts({ combos, avulsos, todos });
}

export function resetProductsToDefault(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    window.dispatchEvent(new CustomEvent("cdn:products_updated"));
    window.dispatchEvent(new CustomEvent("cdn:categories_updated"));
  } catch (e) {
    console.error("Erro ao resetar produtos:", e);
  }
}

export function onProductsUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("cdn:products_updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cdn:products_updated", handler);
    window.removeEventListener("storage", handler);
  };
}
