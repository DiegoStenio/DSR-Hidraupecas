-- Resumo executivo gerado por IA no Dashboard, cacheado pra nao
-- precisar chamar a IA toda vez que a pagina carrega.

alter table company_settings
  add column if not exists resumo_ia text,
  add column if not exists resumo_ia_atualizado_em timestamptz;
