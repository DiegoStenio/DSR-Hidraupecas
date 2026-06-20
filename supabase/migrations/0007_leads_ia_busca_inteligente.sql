-- Suporte a busca inteligente de leads via IA: classifica cada lead como
-- "cliente" (tem peca quebrada) ou "parceiro" (presta servico de reparo),
-- e guarda o contexto de negocio usado pela IA pra gerar os termos de busca.

alter table leads
  add column if not exists tipo_negocio text check (tipo_negocio in ('cliente', 'parceiro'));

alter table company_settings
  add column if not exists contexto_negocio text;

update company_settings set contexto_negocio = $$A DSR Hidraupeças atua como intermediária entre dois tipos de empresa:

1. CLIENTES: empresas que possuem máquinas e equipamentos com sistemas hidráulicos que quebram e precisam de reparo — construtoras, mineradoras, empresas de agronegócio, transportadoras, usinas, indústrias com equipamentos pesados (escavadeiras, pás-carregadeiras, guindastes, tratores, caminhões, prensas hidráulicas, etc.).

2. PARCEIROS: prestadores de serviço especializados em reparo hidráulico — oficinas de cilindros hidráulicos, retífica de bombas e válvulas, troca de mangueiras e conexões, manutenção de sistemas hidráulicos em geral.

A busca de leads deve encontrar OS DOIS perfis: empresas que têm peça pra arrumar (clientes) e empresas que arrumam peça (parceiros).$$
where contexto_negocio is null;
