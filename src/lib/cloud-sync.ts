import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { CustomProduct } from "./products-store";

export const CLOUD_STORAGE_KEY = "cantinho_norte_supabase_config";

// Detecta credenciais nos parâmetros de URL no telemóvel/computador (ex: ?cloud_url=...&cloud_key=...)
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("cloud_url") || params.get("sync_url");
    const paramKey = params.get("cloud_key") || params.get("sync_key");

    if (paramUrl && paramKey && paramUrl.startsWith("http") && paramKey.length > 10) {
      localStorage.setItem(
        CLOUD_STORAGE_KEY,
        JSON.stringify({
          url: paramUrl.trim(),
          anonKey: paramKey.trim(),
        })
      );
      // Remove da URL para manter a navegação limpa
      params.delete("cloud_url");
      params.delete("sync_url");
      params.delete("cloud_key");
      params.delete("sync_key");
      const newQuery = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + newQuery + window.location.hash
      );
    }
  } catch (e) {
    console.warn("[CloudSync] Erro ao ler parâmetros de conexão na URL:", e);
  }
}

let client: SupabaseClient | null = null;
let cachedConfigKey = "";

export interface CloudConfig {
  url: string;
  anonKey: string;
  source: "env" | "local";
}

/**
 * Obtém a configuração ativa do Supabase (lendo primeiro variáveis de ambiente Vite e depois localStorage).
 */
export function getCloudConfig(): CloudConfig | null {
  // 1. Variáveis de ambiente de build / Vercel
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (
    envUrl &&
    envKey &&
    typeof envUrl === "string" &&
    envUrl.startsWith("http") &&
    typeof envKey === "string" &&
    envKey.length > 10
  ) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), source: "env" };
  }

  // 2. Configuração salva pelo painel Admin ou por link de emparelhamento
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CLOUD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed?.url &&
          parsed?.anonKey &&
          typeof parsed.url === "string" &&
          parsed.url.startsWith("http") &&
          typeof parsed.anonKey === "string" &&
          parsed.anonKey.length > 10
        ) {
          return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim(), source: "local" };
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Salva a configuração do Supabase no dispositivo e reinicializa o cliente.
 */
export function setCloudConfig(url: string, anonKey: string): void {
  if (typeof window === "undefined") return;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  client = null;
  cachedConfigKey = "";
  window.dispatchEvent(new CustomEvent("cdn:cloud_config_updated"));
}

/**
 * Desconecta a nuvem e remove as credenciais locais.
 */
export function clearCloudConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLOUD_STORAGE_KEY);
  client = null;
  cachedConfigKey = "";
  window.dispatchEvent(new CustomEvent("cdn:cloud_config_updated"));
}

/**
 * Retorna true apenas se a nuvem estiver configurada com credenciais válidas.
 */
export function isCloudConfigured(): boolean {
  return getCloudConfig() !== null;
}

/**
 * Retorna a instância do cliente Supabase de forma preguiçosa (lazy) e segura.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getCloudConfig();
  if (!config) return null;

  const currentKey = `${config.url}:${config.anonKey}`;
  if (!client || cachedConfigKey !== currentKey) {
    try {
      client = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      cachedConfigKey = currentKey;
    } catch (e) {
      console.warn("[CloudSync] Falha ao inicializar cliente Supabase, operando em modo local:", e);
      client = null;
      cachedConfigKey = "";
    }
  }
  return client;
}

/**
 * Testa a conexão com o Supabase e a tabela 'products'.
 */
export async function testCloudConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; count?: number }> {
  let testClient: SupabaseClient | null = null;
  if (customUrl && customKey) {
    try {
      testClient = createClient(customUrl.trim(), customKey.trim(), {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch (err: any) {
      return { success: false, message: `URL ou chave inválida: ${err?.message || err}` };
    }
  } else {
    testClient = getSupabaseClient();
  }

  if (!testClient) {
    return { success: false, message: "Nenhuma credencial configurada." };
  }

  try {
    const { count, error } = await testClient
      .from("products")
      .select("*", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(6000));

    if (error) {
      return {
        success: false,
        message: `Erro no Supabase: ${error.message}. Verifique se executou o script supabase-schema.sql.`,
      };
    }

    return {
      success: true,
      count: count ?? 0,
      message: `Conexão bem-sucedida! Tabela 'products' ativa com ${count ?? 0} item(ns).`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha de rede ou timeout ao conectar: ${err?.message || err}`,
    };
  }
}

/**
 * Converte um registro do banco de dados para a interface CustomProduct
 */
export function dbRowToProduct(row: any): CustomProduct {
  return {
    id: String(row.id),
    nome: String(row.nome || "Item Artesanal"),
    descricao: String(row.descricao || ""),
    preco: typeof row.preco === "number" ? row.preco : Number(row.preco) || 0,
    precoOriginal:
      row.preco_original !== null && row.preco_original !== undefined
        ? Number(row.preco_original)
        : undefined,
    economia:
      row.economia !== null && row.economia !== undefined
        ? Number(row.economia)
        : undefined,
    imagem: String(row.imagem || ""),
    image: String(row.imagem || ""),
    destaque: row.destaque ? String(row.destaque) : "",
    categoria: String(row.categoria || "avulsos").toLowerCase(),
    ativo: row.ativo !== false,
  };
}

/**
 * Converte a interface CustomProduct para o formato da tabela de produtos do banco de dados
 */
export function productToDbRow(p: CustomProduct): Record<string, any> {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    preco: p.preco,
    preco_original: p.precoOriginal ?? null,
    economia: p.economia ?? null,
    imagem: p.imagem || p.image || "",
    destaque: p.destaque || null,
    categoria: p.categoria || "avulsos",
    ativo: p.ativo !== false,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Busca a lista de produtos na nuvem de forma assíncrona.
 * Se a nuvem estiver desativada ou houver falha de rede/timeout, retorna null de forma limpa.
 */
export async function fetchCloudProducts(): Promise<CustomProduct[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("ordem", { ascending: true })
      .abortSignal(AbortSignal.timeout(5000));

    if (error) {
      console.warn("[CloudSync] Consulta de produtos na nuvem falhou, mantendo dados locais:", error.message);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map(dbRowToProduct);
    }

    return [];
  } catch (err: any) {
    console.warn("[CloudSync] Sem conexão com a nuvem (offline ou timeout), mantendo dados locais:", err?.message || err);
    return null;
  }
}

/**
 * Sincroniza um único produto com a nuvem (upsert).
 * Chamado pelo painel Admin em segundo plano após gravação otimista local.
 */
export async function syncProductToCloud(produto: CustomProduct): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = productToDbRow(produto);
    const { error } = await supabase
      .from("products")
      .upsert(row, { onConflict: "id" })
      .abortSignal(AbortSignal.timeout(6000));

    if (error) {
      console.warn("[CloudSync] Erro ao sincronizar produto na nuvem:", error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn("[CloudSync] Falha na sincronização do produto com a nuvem:", err?.message || err);
    return false;
  }
}

/**
 * Deleta um produto na nuvem.
 */
export async function deleteProductFromCloud(productId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .abortSignal(AbortSignal.timeout(6000));

    if (error) {
      console.warn("[CloudSync] Erro ao deletar produto na nuvem:", error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn("[CloudSync] Falha ao deletar produto na nuvem:", err?.message || err);
    return false;
  }
}

/**
 * Sincroniza todo o catálogo inicial de fábrica para a nuvem de uma só vez (se a nuvem estiver vazia).
 */
export async function seedCloudIfEmpty(defaultProducts: CustomProduct[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(5000));

    if (countError) return false;

    if ((count === 0 || count === null) && defaultProducts.length > 0) {
      console.log("[CloudSync] Banco na nuvem vazio. Enviando catálogo padrão oficial...");
      const rows = defaultProducts.map((p, idx) => ({
        ...productToDbRow(p),
        ordem: idx,
      }));

      const { error: insertError } = await supabase
        .from("products")
        .insert(rows)
        .abortSignal(AbortSignal.timeout(10000));

      if (insertError) {
        console.warn("[CloudSync] Falha no seed inicial da nuvem:", insertError.message);
        return false;
      }
      console.log("[CloudSync] Catálogo inicial oficial sincronizado na nuvem com sucesso!");
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[CloudSync] Erro ao verificar seed da nuvem:", err);
    return false;
  }
}

/**
 * Escuta atualizações de produtos em tempo real via WebSocket (Supabase Realtime).
 * Sempre que outro dispositivo ou o painel Admin alterar algo, dispara a callback informada.
 */
export function subscribeToCloudProducts(onUpdate: (payload?: any) => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channelName = `public:products-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("[CloudSync Realtime] Alteração recebida da nuvem:", payload.eventType);
          onUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[CloudSync Realtime] Conectado e escutando alterações em tempo real!");
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn("[CloudSync] Não foi possível subscrever ao canal realtime:", err);
    return () => {};
  }
}
