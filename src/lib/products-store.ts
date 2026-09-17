import {
  combos as defaultCombos,
  avulsos as defaultAvulsos,
  type Produto,
} from "./menu-data";

export interface CustomProduct extends Produto {
  categoria: "combo" | "avulso";
  ativo?: boolean;
}

const STORAGE_KEY = "cdn_produtos_v2";

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

function sanitizeProduct(p: any, defaultCat: "combo" | "avulso"): CustomProduct {
  return {
    id: String(p?.id || "prod-" + Math.random().toString(36).substring(2, 8)),
    nome: String(p?.nome || "Item Artesanal"),
    descricao: String(p?.descricao || ""),
    preco: typeof p?.preco === "number" && !isNaN(p.preco) ? p.preco : (Number(p?.preco) || 0),
    precoOriginal: typeof p?.precoOriginal === "number" && !isNaN(p.precoOriginal) ? p.precoOriginal : (p?.precoOriginal ? Number(p.precoOriginal) : undefined),
    economia: typeof p?.economia === "number" && !isNaN(p.economia) ? p.economia : undefined,
    imagem: p?.imagem || IMAGE_PRESETS[0]?.url || "",
    destaque: p?.destaque ? String(p.destaque) : "",
    categoria: p?.categoria === "combo" || p?.categoria === "avulso" ? p.categoria : defaultCat,
    ativo: p?.ativo !== false,
  };
}

function getDefaults(): { combos: CustomProduct[]; avulsos: CustomProduct[] } {
  const cList = Array.isArray(defaultCombos) ? defaultCombos : [];
  const aList = Array.isArray(defaultAvulsos) ? defaultAvulsos : [];
  return {
    combos: cList.map((c) => sanitizeProduct(c, "combo")),
    avulsos: aList.map((a) => sanitizeProduct(a, "avulso")),
  };
}

export function getCustomProducts(): {
  combos: CustomProduct[];
  avulsos: CustomProduct[];
  todos: CustomProduct[];
} {
  const def = getDefaults();
  if (typeof window === "undefined") {
    return { combos: def.combos, avulsos: def.avulsos, todos: [...def.combos, ...def.avulsos] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { combos: def.combos, avulsos: def.avulsos, todos: [...def.combos, ...def.avulsos] };
    }
    const data = JSON.parse(raw);
    const combos = Array.isArray(data?.combos)
      ? data.combos.map((c: any) => sanitizeProduct(c, "combo"))
      : def.combos;
    const avulsos = Array.isArray(data?.avulsos)
      ? data.avulsos.map((a: any) => sanitizeProduct(a, "avulso"))
      : def.avulsos;

    return {
      combos,
      avulsos,
      todos: [...combos, ...avulsos],
    };
  } catch (e) {
    console.error("Erro ao carregar produtos:", e);
    return { combos: def.combos, avulsos: def.avulsos, todos: [...def.combos, ...def.avulsos] };
  }
}

export function saveAllProducts(data: {
  combos: CustomProduct[];
  avulsos: CustomProduct[];
}): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("cdn:products_updated"));
  } catch (e) {
    console.error("Erro ao salvar produtos:", e);
  }
}

export function saveProduct(produto: CustomProduct): void {
  const current = getCustomProducts();
  let combos = [...current.combos];
  let avulsos = [...current.avulsos];

  if (produto.categoria === "combo") {
    const idx = combos.findIndex((c) => c.id === produto.id);
    if (idx >= 0) {
      combos[idx] = produto;
    } else {
      combos.push(produto);
    }
    // Caso tenha mudado de categoria
    avulsos = avulsos.filter((a) => a.id !== produto.id);
  } else {
    const idx = avulsos.findIndex((a) => a.id === produto.id);
    if (idx >= 0) {
      avulsos[idx] = produto;
    } else {
      avulsos.push(produto);
    }
    combos = combos.filter((c) => c.id !== produto.id);
  }

  saveAllProducts({ combos, avulsos });
}

export function deleteProduct(id: string): void {
  const current = getCustomProducts();
  const combos = current.combos.filter((c) => c.id !== id);
  const avulsos = current.avulsos.filter((a) => a.id !== id);
  saveAllProducts({ combos, avulsos });
}

export function resetProductsToDefault(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("cdn:products_updated"));
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
