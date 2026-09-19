import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { CustomProduct } from "./products-store";

// Variáveis de ambiente opcionais (Vite)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

/**
 * Retorna true apenas se a nuvem estiver configurada com credenciais válidas.
 */
export function isCloudConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("http") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY.length > 10
  );
}

/**
 * Retorna a instância do cliente Supabase de forma preguiçosa (lazy) e segura.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isCloudConfigured()) return null;
  if (!client && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (e) {
      console.warn("[CloudSync] Falha ao inicializar cliente Supabase, operando em modo local:", e);
      client = null;
    }
  }
  return client;
}

/**
 * Converte um registro do banco de dados para a interface CustomProduct
 */
function dbRowToProduct(row: any): CustomProduct {
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
function productToDbRow(p: CustomProduct): Record<string, any> {
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
      .abortSignal(AbortSignal.timeout(4000));

    if (error) {
      console.warn("[CloudSync] Consulta de produtos na nuvem falhou, mantendo dados locais:", error.message);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map(dbRowToProduct);
    }

    return null;
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
      .abortSignal(AbortSignal.timeout(5000));

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
      .abortSignal(AbortSignal.timeout(5000));

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
      .abortSignal(AbortSignal.timeout(4000));

    if (countError) return false;

    if (count === 0 && defaultProducts.length > 0) {
      console.log("[CloudSync] Banco na nuvem vazio. Enviando catálogo padrão oficial...");
      const rows = defaultProducts.map((p, idx) => ({
        ...productToDbRow(p),
        ordem: idx,
      }));

      const { error: insertError } = await supabase
        .from("products")
        .insert(rows)
        .abortSignal(AbortSignal.timeout(8000));

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
export function subscribeToCloudProducts(onUpdate: () => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel("public:products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          onUpdate();
        }
      )
      .subscribe();

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
