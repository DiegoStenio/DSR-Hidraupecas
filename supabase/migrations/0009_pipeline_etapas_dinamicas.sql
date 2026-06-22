-- Pipeline de leads editavel: as etapas do Kanban deixam de ser um enum
-- fixo no codigo e passam a ser configuraveis (criar, renomear, excluir,
-- reordenar). Etapas marcadas com "arquiva" arquivam o lead automaticamente
-- quando ele e movido pra ela (ex: Ganho, Perdido).

create table lead_etapas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordem int not null,
  cor text not null default 'blue',
  arquiva boolean not null default false,
  created_at timestamptz not null default now()
);

alter table lead_etapas enable row level security;
create policy "authenticated full access" on lead_etapas for all to authenticated using (true) with check (true);

insert into lead_etapas (nome, ordem, cor, arquiva) values
  ('Novo', 1, 'blue', false),
  ('Contatado', 2, 'indigo', false),
  ('Qualificado', 3, 'gold', false),
  ('Proposta', 4, 'purple', false),
  ('Ganho', 5, 'emerald', true),
  ('Perdido', 6, 'rose', true);

alter table leads add column if not exists etapa_id uuid references lead_etapas(id);
alter table leads add column if not exists arquivado boolean not null default false;

update leads set etapa_id = (select id from lead_etapas where nome = 'Novo') where status = 'novo';
update leads set etapa_id = (select id from lead_etapas where nome = 'Contatado') where status = 'contatado';
update leads set etapa_id = (select id from lead_etapas where nome = 'Qualificado') where status = 'qualificado';
update leads set etapa_id = (select id from lead_etapas where nome = 'Proposta') where status = 'proposta';
update leads set etapa_id = (select id from lead_etapas where nome = 'Ganho') where status = 'ganho';
update leads set etapa_id = (select id from lead_etapas where nome = 'Perdido') where status = 'perdido';

update leads set arquivado = true where status in ('ganho', 'perdido');

alter table leads alter column etapa_id set not null;
alter table leads drop column status;
