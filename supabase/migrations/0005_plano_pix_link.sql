-- Liga o orcamento ao plano de pagamento de fato (nao so pelo nome em texto)
-- e marca qual plano representa Pix, pra mostrar o QR code configurado em
-- Configuracoes sem depender de adivinhar pelo nome do plano.

alter table planos_pagamento
  add column if not exists is_pix boolean not null default false;

alter table orcamentos
  add column if not exists plano_id uuid references planos_pagamento(id);
