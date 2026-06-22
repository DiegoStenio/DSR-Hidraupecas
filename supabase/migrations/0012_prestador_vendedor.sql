-- Cada prestador pode estar vinculado a um vendedor especifico
-- (a rede de parceiros de cada vendedor e exclusiva dele).

alter table prestadores
  add column if not exists vendedor_id uuid references vendedores(id) on delete set null;
