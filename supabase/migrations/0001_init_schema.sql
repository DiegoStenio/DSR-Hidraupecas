-- Schema inicial do DSR-Hidraupecas: clientes, vendedores, planos, orcamentos,
-- leads (CRM/Apify) e configuracoes da empresa.
-- App single-tenant (uma equipe interna): RLS exige apenas usuario autenticado.

create extension if not exists "pgcrypto";

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('PF', 'PJ')) default 'PJ',
  nome text not null,
  documento text not null,
  telefone text,
  email text,
  cidade text,
  estado text,
  observacoes text,
  ia_risco text check (ia_risco in ('baixo', 'medio', 'alto')) default 'baixo',
  ia_upsell text[] default '{}',
  ia_resumo text,
  created_at timestamptz not null default now()
);

create table if not exists vendedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text,
  created_at timestamptz not null default now()
);

create table if not exists planos_pagamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  parcelas int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists orcamentos (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  cliente_id uuid references clientes(id) on delete set null,
  cliente_nome text not null,
  vendedor_id uuid references vendedores(id) on delete set null,
  vendedor_nome text not null,
  total numeric(12, 2) not null default 0,
  desconto numeric(12, 2) not null default 0,
  status text not null check (status in ('pendente', 'realizado')) default 'pendente',
  data date not null default current_date,
  plano text,
  itens jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  contato text,
  telefone text,
  email text,
  endereco text,
  site text,
  avaliacao numeric(2, 1),
  categoria text,
  status text not null check (status in ('novo', 'contatado', 'qualificado', 'proposta', 'ganho', 'perdido')) default 'novo',
  score text check (score in ('alto', 'medio', 'baixo')),
  score_justificativa text,
  sugestao_whatsapp text,
  origem text not null check (origem in ('manual', 'apify')) default 'manual',
  converted_cliente_id uuid references clientes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists lead_atividades (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create table if not exists lead_searches (
  id uuid primary key default gen_random_uuid(),
  nicho text,
  cidade text,
  estado text,
  apify_run_id text,
  status text not null default 'pending',
  resultados_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists company_settings (
  id uuid primary key default gen_random_uuid(),
  nome text,
  cnpj text,
  email text,
  telefone text,
  endereco text,
  logo_url text,
  background_url text,
  pix_qrcode_url text,
  pix_chave text,
  ai_provider text not null check (ai_provider in ('gemini', 'claude')) default 'gemini',
  updated_at timestamptz not null default now()
);

-- RLS: app interno de uma unica empresa, qualquer usuario autenticado tem acesso total.
alter table clientes enable row level security;
alter table vendedores enable row level security;
alter table planos_pagamento enable row level security;
alter table orcamentos enable row level security;
alter table leads enable row level security;
alter table lead_atividades enable row level security;
alter table lead_searches enable row level security;
alter table company_settings enable row level security;

create policy "authenticated full access" on clientes for all to authenticated using (true) with check (true);
create policy "authenticated full access" on vendedores for all to authenticated using (true) with check (true);
create policy "authenticated full access" on planos_pagamento for all to authenticated using (true) with check (true);
create policy "authenticated full access" on orcamentos for all to authenticated using (true) with check (true);
create policy "authenticated full access" on leads for all to authenticated using (true) with check (true);
create policy "authenticated full access" on lead_atividades for all to authenticated using (true) with check (true);
create policy "authenticated full access" on lead_searches for all to authenticated using (true) with check (true);
create policy "authenticated full access" on company_settings for all to authenticated using (true) with check (true);
