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

function getDefaults(): { combos: CustomProduct[]; avulsos: CustomProduct[] } {
  return {
    combos: defaultCombos.map((c) => ({
      ...c,
      categoria: "combo" as const,
      ativo: true,
    })),
    avulsos: defaultAvulsos.map((a) => ({
      ...a,
      categoria: "avulso" as const,
      ativo: true,
    })),
  };
}

export function getCustomProducts(): {
  combos: CustomProduct[];
  avulsos: CustomProduct[];
  todos: CustomProduct[];
} {
  if (typeof window === "undefined") {
    const d = getDefaults();
    return { combos: d.combos, avulsos: d.avulsos, todos: [...d.combos, ...d.avulsos] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const d = getDefaults();
      return { combos: d.combos, avulsos: d.avulsos, todos: [...d.combos, ...d.avulsos] };
    }
    const data = JSON.parse(raw);
    const combos = Array.isArray(data.combos) ? data.combos : getDefaults().combos;
    const avulsos = Array.isArray(data.avulsos) ? data.avulsos : getDefaults().avulsos;
    return {
      combos,
      avulsos,
      todos: [...combos, ...avulsos],
    };
  } catch (e) {
    console.error("Erro ao carregar produtos:", e);
    const d = getDefaults();
    return { combos: d.combos, avulsos: d.avulsos, todos: [...d.combos, ...d.avulsos] };
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
