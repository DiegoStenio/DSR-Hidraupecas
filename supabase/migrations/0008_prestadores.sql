-- Cadastro de prestadores de servico (parceiros que arrumam peca),
-- separado do cadastro de clientes (quem tem peca pra arrumar).

create table prestadores (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('PF', 'PJ')),
  nome text not null,
  nome_fantasia text,
  documento text not null,
  ie_rg text,
  especialidade text,
  telefone text,
  email text,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table prestadores enable row level security;
create policy "authenticated full access" on prestadores for all to authenticated using (true) with check (true);

alter table leads
  add column if not exists converted_prestador_id uuid references prestadores(id);
