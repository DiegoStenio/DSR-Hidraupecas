-- Traz de volta a flexibilidade do orcamento original: modo "item a item" vs
-- "grupo de servicos", parcelas selecionadas e observacoes do orcamento.

alter table orcamentos
  add column if not exists budget_type text not null default 'items' check (budget_type in ('items', 'group')),
  add column if not exists group_unit_price numeric(12, 2),
  add column if not exists group_quantity integer,
  add column if not exists observacao text,
  add column if not exists installments_count integer;
