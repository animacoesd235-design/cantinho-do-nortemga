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

-- 2. Criação da tabela de Pedidos (KDS & Checkout com Pix)
create table if not exists public.orders (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  dispatched_at timestamp with time zone,
  cliente jsonb not null default '{}'::jsonb,
  endereco jsonb not null default '{}'::jsonb,
  itens jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  taxa_entrega numeric not null default 0,
  total numeric not null default 0,
  pagamento jsonb not null default '{}'::jsonb,
  status text not null default 'novo',
  payment_status text not null default 'pendente',
  mp_payment_id text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita réplica completa para entregar todos os campos nos eventos em tempo real
alter table public.products replica identity full;
alter table public.orders replica identity full;

-- 3. Habilitação de Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- 4. Políticas de Leitura Pública
drop policy if exists "Cardápio público para todos" on public.products;
create policy "Cardápio público para todos"
  on public.products
  for select
  using (true);

drop policy if exists "Pedidos acessíveis para KDS e cliente" on public.orders;
create policy "Pedidos acessíveis para KDS e cliente"
  on public.orders
  for select
  using (true);

-- 5. Políticas de Gravação Pública / Anon
drop policy if exists "Permitir sincronização de produtos" on public.products;
create policy "Permitir sincronização de produtos"
  on public.products
  for all
  using (true)
  with check (true);

drop policy if exists "Permitir sincronização e atualização de pedidos" on public.orders;
create policy "Permitir sincronização e atualização de pedidos"
  on public.orders
  for all
  using (true)
  with check (true);

-- 6. Habilitação de Realtime para as tabelas
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
