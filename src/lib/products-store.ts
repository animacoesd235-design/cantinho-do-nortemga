import {
  combos as defaultCombos,
  avulsos as defaultAvulsos,
  type Produto,
} from "./menu-data";
import kitCompleto from "@/assets/kit-completo-v2.jpg";
import combo1lFarinha from "@/assets/combo-1l-farinha-v2.jpg";
import combo2lFarinha from "@/assets/combo-2l-farinha-v2.jpg";
import combo3lFarinha from "@/assets/combo-3l-farinha-v2.jpg";
import comboFarinhaCamarao from "@/assets/combo-farinha-camarao-v2.jpg";
import comboTapiocaCamarao from "@/assets/combo-tapioca-camarao-v2.jpg";
import comboFarinhaConserva from "@/assets/combo-farinha-conserva-v2.jpg";
import comboFarinhaCharque from "@/assets/combo-farinha-charque-v2.jpg";
import comboPara from "@/assets/combo-para-v2.jpg";
import bowlPuro from "@/assets/bowl-puro-v2.jpg";
import farinhaAgua from "@/assets/farinha-agua-v2.jpg";
import farinhaTapioca from "@/assets/farinha-tapioca-v2.jpg";
import camaraoSeco from "@/assets/camarao-seco-v2.jpg";
import acaiCamarao from "@/assets/acai-camarao-v2.jpg";
import acaiCupuacu from "@/assets/acai-cupuacu-v2.jpg";
import tucupi from "@/assets/tucupi-v2.jpg";

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

export const STORAGE_VERSION = "v4";
export const PRODUCTS_STORAGE_KEY = "cantinho_norte_products_v4";
export const STORAGE_KEY = PRODUCTS_STORAGE_KEY;
export const STORE_VERSION_KEY = "cantinho_norte_products_version";
const CATEGORIES_KEY = "cdn_categorias_v2";

const LEGACY_STORAGE_KEYS = [
  "cantinho_norte_products",
  "cantinho_norte_products_v1",
  "cantinho_norte_products_v2",
  "cantinho_norte_products_v3",
  "cdn_produtos_v1",
  "cdn_produtos_v2",
];

const syncChannel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("cantinho_norte_sync_channel")
    : null;

export const IMAGE_PRESETS = [
  { id: "kit-completo", label: "Kit Completo (Açaí + Farinhas)", url: kitCompleto },
  { id: "combo-1l-farinha", label: "Combo 1L Açaí + 1L Farinha", url: combo1lFarinha },
  { id: "combo-2l-farinha", label: "Combo 2L Açaí + 1L Farinha", url: combo2lFarinha },
  { id: "combo-3l-farinha", label: "Combo 3L Açaí + 2L Farinha", url: combo3lFarinha },
  { id: "combo-farinha-camarao", label: "Combo Açaí + Farinha + Camarão", url: comboFarinhaCamarao },
  { id: "combo-tapioca-camarao", label: "Combo Açaí + Tapioca + Camarão", url: comboTapiocaCamarao },
  { id: "combo-farinha-conserva", label: "Combo Açaí + Farinha + Conserva", url: comboFarinhaConserva },
  { id: "combo-farinha-charque", label: "Combo Açaí + Farinha + Charque", url: comboFarinhaCharque },
  { id: "combo-para", label: "Kit / Combo Amazônico", url: comboPara },
  { id: "bowl-puro", label: "Açaí Batido Puro (1 Litro)", url: bowlPuro },
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
  const fallbackImg = originalProd?.imagem || originalProd?.image || (IMAGE_PRESETS && IMAGE_PRESETS[0]?.url) || "";

  let imagemCandidate =
    p?.image ||
    p?.imagem ||
    p?.imageUrl ||
    p?.foto ||
    fallbackImg;

  // Se o item for um dos produtos padrão e não for upload próprio (data: ou blob:),
  // garante atualização instantânea para o asset oficial do catálogo
  if (
    originalProd &&
    typeof imagemCandidate === "string" &&
    !imagemCandidate.startsWith("data:") &&
    !imagemCandidate.startsWith("blob:") &&
    !imagemCandidate.startsWith("http")
  ) {
    if (imagemCandidate !== originalProd.imagem && imagemCandidate !== originalProd.image) {
      imagemCandidate = originalProd.imagem || originalProd.image || fallbackImg;
    }
  }

  const imagemUrl = imagemCandidate;

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
    // 0. Versionamento de cache obrigatório:
    // Se a versão atual não for STORAGE_VERSION ('v4'), descarta automaticamente o localStorage antigo
    // para forçar a leitura imediata da nova versão com as fotos oficiais do catálogo
    const storedVersion = localStorage.getItem(STORE_VERSION_KEY);
    if (storedVersion !== STORAGE_VERSION) {
      // Preserva eventuais produtos adicionais criados no admin pelo usuário (não padrão)
      let customProductsToKeep: any[] = [];
      const keysToScan = ["cantinho_norte_products", "cantinho_norte_products_v3", ...LEGACY_STORAGE_KEYS];
      for (const oldKey of keysToScan) {
        try {
          const oldRaw = localStorage.getItem(oldKey);
          if (oldRaw) {
            const parsedOld = JSON.parse(oldRaw);
            const listOld = Array.isArray(parsedOld)
              ? parsedOld
              : Array.isArray(parsedOld?.todos)
              ? parsedOld.todos
              : [];
            const isDefaultId = (id: string) =>
              (Array.isArray(defaultCombos) && defaultCombos.some((c) => c.id === id)) ||
              (Array.isArray(defaultAvulsos) && defaultAvulsos.some((a) => a.id === id));
            for (const item of listOld) {
              if (item?.id && !isDefaultId(item.id) && !customProductsToKeep.some((x) => x.id === item.id)) {
                customProductsToKeep.push(item);
              }
            }
          }
        } catch {}
      }

      // Descarta imediatamente o localStorage antigo
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        try {
          localStorage.removeItem(legacyKey);
        } catch {}
      }

      // Marca a versão v4 como ativa
      try {
        localStorage.setItem(STORE_VERSION_KEY, STORAGE_VERSION);
      } catch {}

      // Inicializa a nova versão cantinho_norte_products_v4 com as fotos oficiais do catálogo
      const def = getDefaults();
      const todosIniciais = [
        ...def.todos,
        ...customProductsToKeep.map((p) => sanitizeProduct(p, p?.categoria)),
      ];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todosIniciais));
      } catch (e) {
        console.warn("Não foi possível inicializar localStorage com dados padrão:", e);
      }

      const combos = todosIniciais.filter((p) => p.categoria === "combo" || p.categoria === "combos");
      const avulsos = todosIniciais.filter((p) => p.categoria !== "combo" && p.categoria !== "combos");
      return { combos, avulsos, todos: todosIniciais };
    }

    // 1. O localStorage na versão v3 é a fonte primária absoluta
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

    // 2. Limpeza adicional de segurança de chaves legadas
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      try {
        localStorage.removeItem(legacyKey);
      } catch {}
    }

    // 3. APENAS se a chave cantinho_norte_products_v3 estiver TOTALMENTE VAZIA (null ou sem itens):
    // Carrega a lista padrão com fotos definitivas e grava uma única vez para inicializar
    const def = getDefaults();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def.todos));
      localStorage.setItem(STORE_VERSION_KEY, STORAGE_VERSION);
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
    localStorage.removeItem(STORE_VERSION_KEY);
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      try {
        localStorage.removeItem(legacyKey);
      } catch {}
    }
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
