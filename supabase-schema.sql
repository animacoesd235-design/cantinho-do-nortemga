-- ==========================================================
-- CANTINHO DO NORTE - SCHEMA SQL PARA SUPABASE
-- Execute este script no SQL Editor do seu painel Supabase
-- ==========================================================

-- 1. Criação da tabela de Produtos
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

-- Habilita réplica completa para entregar todos os campos nos eventos em tempo real
alter table public.products replica identity full;

-- 2. Habilitação de Row Level Security (RLS)
alter table public.products enable row level security;

-- 3. Política de Leitura Pública (Qualquer cliente pode consultar o cardápio)
drop policy if exists "Cardápio público para todos" on public.products;
create policy "Cardápio público para todos"
  on public.products
  for select
  using (true);

-- 4. Política de Gravação Pública/Anon (Permite ao Admin sincronizar)
drop policy if exists "Permitir sincronização de produtos" on public.products;
create policy "Permitir sincronização de produtos"
  on public.products
  for all
  using (true)
  with check (true);

-- 5. Habilitação de Realtime para a tabela de produtos
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;
