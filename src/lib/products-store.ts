import {
  combos as defaultCombos,
  avulsos as defaultAvulsos,
  type Produto,
} from "./menu-data";
import comboPara from "@/assets/combo-para.jpg";
import bowlPuro from "@/assets/bowl-puro.jpg";
import farinhaAgua from "@/assets/farinha-agua.jpg";
import farinhaTapioca from "@/assets/farinha-tapioca.jpg";
import camaraoSeco from "@/assets/camarao-seco.jpg";
import acaiCamarao from "@/assets/acai-camarao.jpg";
import acaiCupuacu from "@/assets/acai-cupuacu.jpg";
import tucupi from "@/assets/tucupi.jpg";

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

export const PRODUCTS_STORAGE_KEY = "cantinho_norte_products";
export const STORAGE_KEY = PRODUCTS_STORAGE_KEY;
const CATEGORIES_KEY = "cdn_categorias_v2";

const syncChannel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("cantinho_norte_sync_channel")
    : null;

export const IMAGE_PRESETS = [
  { id: "combo-para", label: "Kit / Combo Amazônico", url: comboPara },
  { id: "bowl-puro", label: "Tigela de Açaí Puro", url: bowlPuro },
  { id: "farinha-agua", label: "Farinha D'água / Mandioca", url: farinhaAgua },
  { id: "farinha-tapioca", label: "Farinha de Tapioca", url: farinhaTapioca },
  { id: "camarao-seco", label: "Camarão Salgado", url: camaraoSeco },
  { id: "acai-camarao", label: "Açaí com Camarão", url: acaiCamarao },
  { id: "acai-cupuacu", label: "Cupuaçu Cremoso", url: acaiCupuacu },
  { id: "tucupi", label: "Tucupi Amarelo", url: tucupi },
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

  // Busca fallback correspondente ao ID caso a imagem esteja ausente
  const originalProd =
    (Array.isArray(defaultCombos) ? defaultCombos : []).find((d) => d.id === p?.id) ||
    (Array.isArray(defaultAvulsos) ? defaultAvulsos : []).find((d) => d.id === p?.id);
  const fallbackImg = originalProd?.imagem || (IMAGE_PRESETS && IMAGE_PRESETS[0]?.url) || "";

  const imagemUrl =
    p?.image ||
    p?.imagem ||
    p?.imageUrl ||
    p?.foto ||
    fallbackImg;

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
  // Se estiver em ambiente sem window (SSR), retorna dados padrão em memória sem gravar no storage
  if (typeof window === "undefined") {
    return getDefaults();
  }

  try {
    // 1. O localStorage é a fonte primária absoluta
    const raw = localStorage.getItem(STORAGE_KEY);

    // Se a chave já existir no localStorage e tiver conteúdo, NUNCA sobrescreve com dados padrão!
    if (raw !== null && raw.trim() !== "") {
      try {
        const parsed = JSON.parse(raw);
        let rawList: any[] = [];
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (Array.isArray(parsed?.todos)) {
          rawList = parsed.todos;
        } else if (Array.isArray(parsed?.combos) || Array.isArray(parsed?.avulsos)) {
          rawList = [...(parsed.combos || []), ...(parsed.avulsos || [])];
        }

        // Se a chave já existe e contém itens, lê diretamente do localStorage sem gravar nada,
        // preservando integralmente todas as alterações, novos produtos e uploads de fotos do admin.
        if (rawList && rawList.length > 0) {
          const todos = rawList.map((p: any) => sanitizeProduct(p, p?.categoria));
          const combos = todos.filter((p) => p.categoria === "combo" || p.categoria === "combos");
          const avulsos = todos.filter((p) => p.categoria !== "combo" && p.categoria !== "combos");
          return { combos, avulsos, todos };
        }
      } catch (parseErr) {
        console.error("Erro ao ler dados do localStorage:", parseErr);
      }
    }

    // 2. Limpeza de chaves legadas para prevenir restauração de fotos antigas em navegadores já visitados
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("cdn_produtos_v2");
        localStorage.removeItem("cdn_produtos_v1");
      } catch {}
    }

    // 3. APENAS se a chave cantinho_norte_products estiver TOTALMENTE VAZIA (null ou sem itens):
    // Carrega a lista padrão com fotos definitivas e grava uma única vez para inicializar
    const def = getDefaults();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def.todos));
    } catch (e) {
      console.warn("Não foi possível inicializar localStorage com dados padrão:", e);
    }
    return def;
  } catch (e) {
    console.error("Erro ao ler produtos do localStorage:", e);
    return getDefaults();
  }
}

export function saveAllProducts(data: {
  combos: CustomProduct[];
  avulsos: CustomProduct[];
  todos?: CustomProduct[];
}): void {
  if (typeof window === "undefined") return;
  try {
    const rawTodos =
      data.todos ||
      [...data.combos, ...data.avulsos].filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      );
    const todos = rawTodos.map((p) => sanitizeProduct(p, p.categoria));
    const combos = todos.filter((p) => p.categoria === "combo" || p.categoria === "combos");
    const avulsos = todos.filter((p) => p.categoria !== "combo" && p.categoria !== "combos");

    // Grava na chave unificada e primária 'cantinho_norte_products' no localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (quotaErr) {
      console.warn("Possível limite de cota no localStorage, limpando dados legados...", quotaErr);
      try {
        localStorage.removeItem("cdn_produtos_v1");
        localStorage.removeItem("cdn_produtos_v2");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch (retryErr) {
        console.error("Erro crítico ao salvar no localStorage:", retryErr);
      }
    }

    // Grava timestamp de sincronização
    try {
      localStorage.setItem("cantinho_norte_sync_time", String(Date.now()));
    } catch {}

    // Notificação instantânea local
    window.dispatchEvent(new CustomEvent("cdn:products_updated"));
    document.dispatchEvent(new CustomEvent("cdn:products_updated"));

    // Notificação instantânea cross-tab via BroadcastChannel
    try {
      syncChannel?.postMessage({ type: "products_updated", timestamp: Date.now() });
    } catch {}
  } catch (e) {
    console.error("Erro ao salvar produtos no localStorage:", e);
  }
}

export function saveProduct(produto: CustomProduct): void {
  const current = getCustomProducts();
  const produtoSanitizado = sanitizeProduct(produto, produto.categoria);
  let todos = [...current.todos];
  const idx = todos.findIndex((p) => p.id === produtoSanitizado.id);

  if (idx >= 0) {
    todos[idx] = produtoSanitizado;
  } else {
    todos.push(produtoSanitizado);
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
    localStorage.removeItem("cdn_produtos_v2");
    localStorage.removeItem("cdn_produtos_v1");
    localStorage.removeItem(CATEGORIES_KEY);

    window.dispatchEvent(new CustomEvent("cdn:products_updated"));
    document.dispatchEvent(new CustomEvent("cdn:products_updated"));
    window.dispatchEvent(new CustomEvent("cdn:categories_updated"));
    document.dispatchEvent(new CustomEvent("cdn:categories_updated"));

    try {
      syncChannel?.postMessage({ type: "products_updated", timestamp: Date.now() });
    } catch {}
  } catch (e) {
    console.error("Erro ao resetar produtos:", e);
  }
}

export function onProductsUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();

  window.addEventListener("cdn:products_updated", handler);
  document.addEventListener("cdn:products_updated", handler);
  window.addEventListener("storage", handler);

  const bcHandler = (e: MessageEvent) => {
    if (e.data?.type === "products_updated") {
      handler();
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener("message", bcHandler);
  }

  return () => {
    window.removeEventListener("cdn:products_updated", handler);
    document.removeEventListener("cdn:products_updated", handler);
    window.removeEventListener("storage", handler);
    if (syncChannel) {
      syncChannel.removeEventListener("message", bcHandler);
    }
  };
}
