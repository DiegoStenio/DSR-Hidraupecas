-- Titulo do orcamento (ex.: "ORCAMENTO PARA REVISAR COMANDO HIDRAULICO..."),
-- que o app antigo exibia em destaque no PDF, entre cliente e servicos.

alter table orcamentos
  add column if not exists titulo text;
