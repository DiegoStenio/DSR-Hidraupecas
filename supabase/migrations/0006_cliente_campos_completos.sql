-- Campos adicionais do cadastro de cliente (nome fantasia, IE/RG e endereco
-- completo), trazidos do app original que tinha um cadastro mais completo.

alter table clientes
  add column if not exists nome_fantasia text,
  add column if not exists ie_rg text,
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists numero text,
  add column if not exists bairro text;
