import { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  Check,
  Copy,
  ExternalLink,
  QrCode,
  RefreshCw,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Database,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCloudConfig,
  setCloudConfig,
  clearCloudConfig,
  isCloudConfigured,
  testCloudConnection,
  type CloudConfig,
} from "@/lib/cloud-sync";
import {
  syncWithCloud,
  syncAllLocalProductsToCloud,
} from "@/lib/products-store";

interface ModalConfigNuvemProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange?: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- ==========================================================
-- CANTINHO DO NORTE - SCHEMA SQL PARA SUPABASE
-- Execute este script no SQL Editor do seu painel Supabase
-- ==========================================================

create table if not exists public.products (
  id text primary key,
  nome text not null,
  descricao text default '',
  preco numeric not null,
  preco_original numeric,
  economia numeric,
  imagem text not null,
  destaque text default '',
  categoria text not null default 'avulsos',
  ativo boolean not null default true,
  ordem int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products replica identity full;
alter table public.products enable row level security;

drop policy if exists "Cardápio público para todos" on public.products;
create policy "Cardápio público para todos" on public.products for select using (true);

drop policy if exists "Permitir sincronização de produtos" on public.products;
create policy "Permitir sincronização de produtos" on public.products for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;`;

export function ModalConfigNuvem({ isOpen, onClose, onConfigChange }: ModalConfigNuvemProps) {
  const [config, setConfig] = useState<CloudConfig | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [testando, setTestando] = useState(false);
  const [statusTeste, setStatusTeste] = useState<{
    tipo: "sucesso" | "erro" | null;
    mensagem: string;
  }>({ tipo: null, mensagem: "" });
  const [sincronizandoTudo, setSincronizandoTudo] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [sqlCopiado, setSqlCopiado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"conexao" | "emparelhar" | "ajuda">("conexao");

  useEffect(() => {
    if (isOpen) {
      const cfg = getCloudConfig();
      setConfig(cfg);
      if (cfg) {
        setUrlInput(cfg.url);
        setKeyInput(cfg.anonKey);
      } else {
        setUrlInput("");
        setKeyInput("");
      }
      setStatusTeste({ tipo: null, mensagem: "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestarConexao = async () => {
    const url = urlInput.trim();
    const key = keyInput.trim();
    if (!url || !key) {
      setStatusTeste({
        tipo: "erro",
        mensagem: "Preencha a URL e a Anon Key do Supabase antes de testar.",
      });
      return;
    }

    setTestando(true);
    setStatusTeste({ tipo: null, mensagem: "" });
    try {
      const res = await testCloudConnection(url, key);
      if (res.success) {
        setStatusTeste({
          tipo: "sucesso",
          mensagem: res.message,
        });
        toast.success("Conexão com a nuvem bem-sucedida!");
      } else {
        setStatusTeste({
          tipo: "erro",
          mensagem: res.message,
        });
        toast.error("Falha ao conectar com o Supabase.");
      }
    } catch (e: any) {
      setStatusTeste({
        tipo: "erro",
        mensagem: e?.message || "Erro inesperado ao testar conexão.",
      });
    } finally {
      setTestando(false);
    }
  };

  const handleSalvarConexao = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    const key = keyInput.trim();
    if (!url || !key) {
      toast.error("Preencha a URL e a Anon Key do Supabase.");
      return;
    }

    setTestando(true);
    try {
      const res = await testCloudConnection(url, key);
      if (!res.success) {
        setStatusTeste({ tipo: "erro", mensagem: res.message });
        toast.error("Não foi possível conectar. Verifique as credenciais e o banco de dados.");
        setTestando(false);
        return;
      }

      setCloudConfig(url, key);
      setConfig(getCloudConfig());
      toast.success("Nuvem Supabase configurada com sucesso!");

      // Sincroniza imediatamente
      await syncWithCloud(true);
      onConfigChange?.();
      setAbaAtiva("emparelhar");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar conexão.");
    } finally {
      setTestando(false);
    }
  };

  const handleDesconectar = () => {
    if (confirm("Deseja desconectar a nuvem neste dispositivo? O cardápio continuará funcionando no modo local com fallback de fábrica.")) {
      clearCloudConfig();
      setConfig(null);
      setUrlInput("");
      setKeyInput("");
      setStatusTeste({ tipo: null, mensagem: "" });
      toast.info("Nuvem desconectada. Operando em modo local seguro.");
      onConfigChange?.();
    }
  };

  const handleEnviarTudo = async () => {
    try {
      setSincronizandoTudo(true);
      toast.loading("Enviando todos os produtos locais para a nuvem...", { id: "sync-all" });
      const ok = await syncAllLocalProductsToCloud();
      if (ok) {
        toast.success("Todos os produtos foram gravados na nuvem!", { id: "sync-all" });
      } else {
        toast.error("Houve falha ao enviar alguns produtos para a nuvem.", { id: "sync-all" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro na sincronização.", { id: "sync-all" });
    } finally {
      setSincronizandoTudo(false);
    }
  };

  // URL de emparelhamento que grava as credenciais no outro dispositivo automaticamente
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pairUrl = config
    ? `${origin}/admin?cloud_url=${encodeURIComponent(config.url)}&cloud_key=${encodeURIComponent(config.anonKey)}`
    : "";

  const handleCopiarLinkEmparelhamento = () => {
    if (!pairUrl) return;
    navigator.clipboard.writeText(pairUrl).then(() => {
      setLinkCopiado(true);
      toast.success("Link copiado! Abra ou envie pelo WhatsApp para o seu telemóvel.");
      setTimeout(() => setLinkCopiado(false), 3000);
    });
  };

  const handleCopiarSQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL).then(() => {
      setSqlCopiado(true);
      toast.success("Script SQL copiado com sucesso!");
      setTimeout(() => setSqlCopiado(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 bg-[#121c15] text-[#f4efe6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#0e1710]">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-2xl ${
                isCloudConfigured()
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Sincronização em Tempo Real (Nuvem)
              </h3>
              <p className="text-xs text-white/60">
                Sincronização instantânea bidirecional entre Computador e Telemóvel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-white/10 bg-white/5 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAbaAtiva("conexao")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors ${
              abaAtiva === "conexao"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Conexão Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("emparelhar")}
            disabled={!isCloudConfigured()}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors ${
              !isCloudConfigured()
                ? "opacity-40 cursor-not-allowed border-transparent text-white/40"
                : abaAtiva === "emparelhar"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Conectar Telemóvel (QR Code)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("ajuda")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2.5 transition-colors ${
              abaAtiva === "ajuda"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Como Criar Banco (Grátis)</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Status Geral Banner */}
          <div
            className={`flex items-center justify-between rounded-2xl p-3.5 border ${
              isCloudConfigured()
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isCloudConfigured() ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <CloudOff className="h-5 w-5 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="font-extrabold text-sm block">
                  {isCloudConfigured()
                    ? "Nuvem Conectada e Ativa"
                    : "Operando em Modo Local / Fábrica"}
                </span>
                <span className="text-[11px] opacity-80">
                  {isCloudConfigured()
                    ? `Sincronização bidirecional em tempo real ativada (${config?.source === "env" ? "Variável de Ambiente" : "Configuração Local"}).`
                    : "Alterações ficam salvas no navegador atual. Configure o Supabase para sincronizar com telemóveis."}
                </span>
              </div>
            </div>

            {isCloudConfigured() && config?.source === "local" && (
              <button
                type="button"
                onClick={handleDesconectar}
                className="tap shrink-0 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 px-3 py-1.5 text-[11px] font-bold transition-colors"
              >
                Desconectar
              </button>
            )}
          </div>

          {/* ABA 1: CONEXÃO */}
          {abaAtiva === "conexao" && (
            <form onSubmit={handleSalvarConexao} className="space-y-4">
              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Project URL do Supabase:
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.supabase.co"
                  disabled={config?.source === "env"}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-amber-400 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Project API Anon / Public Key:
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  disabled={config?.source === "env"}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-amber-400 disabled:opacity-50"
                  required
                />
              </div>

              {config?.source === "env" && (
                <p className="text-[11px] text-emerald-400/90 italic">
                  * As credenciais estão fixadas através das variáveis de ambiente Vercel/Vite.
                </p>
              )}

              {/* Status do Teste */}
              {statusTeste.tipo && (
                <div
                  className={`flex items-start gap-2 rounded-xl p-3 border ${
                    statusTeste.tipo === "sucesso"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {statusTeste.tipo === "sucesso" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <span className="text-[11px] leading-relaxed">{statusTeste.mensagem}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestarConexao}
                  disabled={testando}
                  className="tap flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 font-bold transition-colors disabled:opacity-50"
                >
                  {testando ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                  )}
                  <span>Testar Conexão</span>
                </button>

                {config?.source !== "env" && (
                  <button
                    type="submit"
                    disabled={testando}
                    className="tap flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 font-black shadow-lg transition-all disabled:opacity-50"
                  >
                    <span>Salvar e Ativar Conexão</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {isCloudConfigured() && (
                  <button
                    type="button"
                    onClick={handleEnviarTudo}
                    disabled={sincronizandoTudo}
                    title="Forçar envio de todos os produtos cadastrados localmente para a base de dados na nuvem"
                    className="tap flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-4 py-2.5 font-bold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${sincronizandoTudo ? "animate-spin" : ""}`} />
                    <span>Subir Catálogo Completo</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ABA 2: EMPARELHAR TELEMÓVEL */}
          {abaAtiva === "emparelhar" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
                <span className="font-black text-amber-300 block text-xs uppercase tracking-wide">
                  Como Conectar o Telemóvel em 5 Segundos:
                </span>
                <p className="text-white/80 text-[11px] leading-relaxed">
                  1. Aponte a câmara do seu telemóvel para o QR Code abaixo.<br />
                  2. Ao tocar no link gerado, o telemóvel recebe automaticamente as chaves de sincronização em nuvem.<br />
                  3. A partir deste momento, qualquer foto ou produto alterado no PC reflete no telemóvel e vice-versa instantaneamente!
                </p>
              </div>

              {pairUrl && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 rounded-2xl bg-[#0e1710] border border-white/10 p-6">
                  <div className="rounded-2xl bg-white p-3 shadow-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(pairUrl)}`}
                      alt="QR Code de Conexão com a Nuvem"
                      className="h-44 w-44 object-contain"
                    />
                  </div>

                  <div className="space-y-3 text-center sm:text-left max-w-xs">
                    <div>
                      <span className="block font-bold text-white text-sm">
                        Conexão Instantânea via QR Code
                      </span>
                      <span className="block text-[11px] text-white/50">
                        Não precisa digitar credenciais nem senhas no telemóvel.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopiarLinkEmparelhamento}
                      className="tap w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 font-bold shadow-md transition-all"
                    >
                      {linkCopiado ? <Check className="h-4 w-4 text-emerald-900" /> : <Copy className="h-4 w-4" />}
                      <span>{linkCopiado ? "Link Copiado!" : "Copiar Link de Conexão"}</span>
                    </button>
                    <p className="text-[10px] text-white/40">
                      Você também pode colar esse link no WhatsApp e clicar nele no seu telemóvel.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: GUIA SUPABASE */}
          {abaAtiva === "ajuda" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0e1710] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">
                    1. Criar Projeto no Supabase (100% Gratuito)
                  </span>
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="tap inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline"
                  >
                    <span>Abrir supabase.com</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-white/70 text-[11px]">
                  Crie sua conta no Supabase e clique em <strong>"New project"</strong>. Escolha um nome (ex: <em>cantinho-do-norte</em>) e a região <em>São Paulo (sa-east-1)</em>.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e1710] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">
                    2. Executar o Script SQL do Banco
                  </span>
                  <button
                    type="button"
                    onClick={handleCopiarSQL}
                    className="tap inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition-colors"
                  >
                    {sqlCopiado ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{sqlCopiado ? "Copiado!" : "Copiar Script SQL"}</span>
                  </button>
                </div>
                <p className="text-white/70 text-[11px]">
                  No painel do Supabase, clique em <strong>SQL Editor</strong> na barra lateral esquerda, clique em <strong>New query</strong>, cole o script copiado e clique no botão verde <strong>Run</strong>.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e1710] p-4 space-y-2">
                <span className="font-extrabold text-white text-sm block">
                  3. Copiar as Chaves de Acesso
                </span>
                <p className="text-white/70 text-[11px]">
                  Vá em <strong>Project Settings &gt; Data API</strong> (ou API). Copie a <strong>Project URL</strong> e a <strong>Project API key (anon/public)</strong> e cole na aba <em>Conexão Supabase</em> acima!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
