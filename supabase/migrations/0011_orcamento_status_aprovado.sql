-- Adiciona o status intermediario "aprovado" ao fluxo de orcamentos
-- (antes so existia pendente -> realizado, sem etapa de aprovacao).

alter table orcamentos drop constraint if exists orcamentos_status_check;
alter table orcamentos add constraint orcamentos_status_check
  check (status in ('pendente', 'aprovado', 'realizado'));
