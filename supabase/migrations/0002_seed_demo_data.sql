-- Dados de demonstracao (os mesmos do prototipo) para o app nao nascer vazio.
-- IDs fixos para permitir referencias entre tabelas dentro deste script.

insert into vendedores (id, nome, whatsapp) values
  ('11111111-1111-1111-1111-111111111101', 'Rafael Andrade', '+55 11 98765-1010'),
  ('11111111-1111-1111-1111-111111111102', 'Júlia Moreira', '+55 11 99812-3030'),
  ('11111111-1111-1111-1111-111111111103', 'Marcos Lima', '+55 21 99654-7878');

insert into planos_pagamento (nome, descricao, parcelas) values
  ('À vista', 'Pagamento integral via Pix com 5% de desconto', 1),
  ('30/60', 'Dois pagamentos iguais (30 e 60 dias)', 2),
  ('3x no boleto', 'Parcelado em 3x sem juros via boleto', 3),
  ('Cartão 6x', 'Parcelado em até 6x no cartão', 6);

insert into clientes (id, tipo, nome, documento, telefone, email, cidade, estado, ia_risco, ia_upsell, ia_resumo) values
  ('22222222-2222-2222-2222-222222222201', 'PJ', 'Metalúrgica Andrade Ltda.', '12.345.678/0001-90', '+55 11 3322-4455', 'compras@metalandrade.com.br', 'Guarulhos', 'SP', 'baixo',
    array['Mangueiras de alta pressão R2', 'Kit de vedação 5/8"'],
    'Cliente recorrente há 4 anos, 18 orçamentos fechados, ticket médio R$ 12.400. Compras regulares a cada 45 dias.'),
  ('22222222-2222-2222-2222-222222222202', 'PJ', 'Hidráulica Pampulha S/A', '98.765.432/0001-11', '+55 31 3214-7788', 'operacoes@pampulhahidr.com.br', 'Belo Horizonte', 'MG', 'medio',
    array['Bombas de pistão axial', 'Contrato de manutenção anual'],
    'Última compra há 92 dias — acima da média histórica de 60 dias. Possível abertura para concorrente.'),
  ('22222222-2222-2222-2222-222222222203', 'PF', 'Carlos Eduardo Tavares', '123.456.789-00', '+55 21 99888-1122', 'carlos.tavares@gmail.com', 'Rio de Janeiro', 'RJ', 'baixo',
    array['Cilindros telescópicos'],
    'Pessoa física, compras esporádicas para frota própria. Baixo volume, alta margem.'),
  ('22222222-2222-2222-2222-222222222204', 'PJ', 'TransAgro Implementos', '55.667.788/0001-22', '+55 62 3445-9090', 'suprimentos@transagro.com.br', 'Goiânia', 'GO', 'alto',
    array['Renegociação de condições', 'Plano de pagamento estendido'],
    'Atraso de 47 dias no último pagamento. Volume caiu 38% no trimestre. Atenção do comercial recomendada.'),
  ('22222222-2222-2222-2222-222222222205', 'PJ', 'Construtora Ferreira & Cia.', '11.222.333/0001-44', '+55 11 4002-8922', 'obras@ferreiracia.com.br', 'Campinas', 'SP', 'baixo',
    array['Conjuntos de cilindros 80mm', 'Pacote anual de reposição'],
    'Cliente em crescimento — pediu 3 orçamentos no último mês. Considerar oferta de volume.');

insert into orcamentos (numero, cliente_id, cliente_nome, vendedor_id, vendedor_nome, total, status, data, plano, itens) values
  ('ORC-2025-0184', '22222222-2222-2222-2222-222222222201', 'Metalúrgica Andrade Ltda.', '11111111-1111-1111-1111-111111111101', 'Rafael Andrade', 14820, 'realizado', '2025-06-12', '30/60',
    '[{"descricao":"Mangueira R2 1/2\" — 50m","qtd":4,"valor":2150},{"descricao":"Conexão JIC 90°","qtd":12,"valor":185},{"descricao":"Cilindro hidráulico 80x500","qtd":2,"valor":1850}]'),
  ('ORC-2025-0185', '22222222-2222-2222-2222-222222222205', 'Construtora Ferreira & Cia.', '11111111-1111-1111-1111-111111111102', 'Júlia Moreira', 8430, 'pendente', '2025-06-14', '3x no boleto',
    '[{"descricao":"Bomba de engrenagem 25cc","qtd":1,"valor":5180},{"descricao":"Filtro de retorno 60L/min","qtd":2,"valor":1625}]'),
  ('ORC-2025-0186', '22222222-2222-2222-2222-222222222202', 'Hidráulica Pampulha S/A', '11111111-1111-1111-1111-111111111101', 'Rafael Andrade', 22150, 'pendente', '2025-06-15', 'Cartão 6x',
    '[{"descricao":"Bomba de pistão axial A10VSO","qtd":1,"valor":18900},{"descricao":"Kit vedação completo","qtd":5,"valor":650}]'),
  ('ORC-2025-0187', '22222222-2222-2222-2222-222222222203', 'Carlos Eduardo Tavares', '11111111-1111-1111-1111-111111111103', 'Marcos Lima', 3290, 'realizado', '2025-06-15', 'À vista',
    '[{"descricao":"Cilindro telescópico 4 estágios","qtd":1,"valor":3290}]'),
  ('ORC-2025-0188', '22222222-2222-2222-2222-222222222204', 'TransAgro Implementos', '11111111-1111-1111-1111-111111111102', 'Júlia Moreira', 6740, 'pendente', '2025-06-16', '30/60',
    '[{"descricao":"Válvula direcional D03","qtd":3,"valor":1480},{"descricao":"Mangueira R1 3/8\" — 30m","qtd":4,"valor":580}]');

insert into leads (id, empresa, contato, telefone, email, site, endereco, avaliacao, categoria, status, score, score_justificativa, sugestao_whatsapp, origem) values
  ('33333333-3333-3333-3333-333333333301', 'Tractor Power Implementos', 'Eduardo Sampaio', '+55 16 99812-3344', 'ed@tractorpower.com.br', 'tractorpower.com.br', 'Av. Industrial 1240, Ribeirão Preto/SP', 4.7, 'Implementos agrícolas', 'novo', 'alto',
    'Empresa porte médio, 23 funcionários no LinkedIn, site recente, abertura para fornecedores.',
    'Olá Eduardo, tudo bem? Sou da DSR-Hidraupecas. Vi que a Tractor Power trabalha com implementos agrícolas — temos linha completa de mangueiras e cilindros com pronta entrega. Posso te enviar nosso catálogo?', 'apify'),
  ('33333333-3333-3333-3333-333333333302', 'Hidromec Reparos', 'Sandra Vieira', '+55 11 4456-7788', 'contato@hidromec.com.br', 'hidromec.com.br', 'R. dos Mecânicos 89, São Bernardo/SP', 4.2, 'Manutenção hidráulica', 'contatado', 'alto',
    'Especializada em reparos — alto consumo de peças de reposição. Compra recorrente provável.',
    'Sandra, boa tarde. Vi a Hidromec e sei que vocês fazem reparos hidráulicos pesados. Trabalhamos com vedações e kits de reparo para as principais marcas. Posso te mostrar nossos preços?', 'apify'),
  ('33333333-3333-3333-3333-333333333303', 'AgroSul Máquinas', 'Roberto Klein', '+55 51 3221-8899', 'roberto@agrosul.com.br', null, 'BR-116 km 234, Caxias do Sul/RS', 4.8, 'Revenda agrícola', 'qualificado', 'alto',
    'Revenda regional consolidada, 12 anos de mercado, sem fornecedor exclusivo de hidráulica.',
    'Roberto, conversamos na semana passada. Preparei uma proposta inicial considerando o volume que você mencionou. Posso te ligar amanhã 10h?', 'apify'),
  ('33333333-3333-3333-3333-333333333304', 'Caminhões Centro-Oeste', 'Patrícia Almeida', '+55 62 3551-2244', null, 'caminhoesco.com.br', 'Av. Anhanguera 4500, Goiânia/GO', 4.0, 'Transporte pesado', 'proposta', 'medio',
    'Frota grande mas centralizada em São Paulo. Decisão pode ser remota.',
    'Patrícia, segue a proposta revisada com o desconto que combinamos. Validade 7 dias.', 'apify'),
  ('33333333-3333-3333-3333-333333333305', 'Oficina São Jorge', 'José Carlos', '+55 11 2233-1010', null, null, 'R. das Oficinas 12, São Paulo/SP', 3.8, 'Oficina mecânica', 'perdido', 'baixo',
    'Pequeno porte, baixo volume de compra. Optou por fornecedor local.',
    'José, obrigado pela conversa. Quando precisar, estamos à disposição.', 'apify'),
  ('33333333-3333-3333-3333-333333333306', 'Florestal Norte Ltda.', 'Amanda Sousa', '+55 91 3344-5566', 'compras@florestaln.com.br', null, 'Distrito Industrial, Belém/PA', 4.5, 'Equipamentos florestais', 'ganho', 'alto',
    'Cliente fechado — pedido inicial R$ 32.000. Potencial de recorrência alta.',
    'Amanda, obrigado pela confiança! Pedido entra em produção amanhã. Te aviso quando despachar.', 'apify'),
  ('33333333-3333-3333-3333-333333333307', 'Mineradora Vale do Açu', 'Henrique Costa', '+55 84 3998-7711', null, 'mvaleacu.com.br', 'Mossoró/RN', 4.3, 'Mineração', 'novo', 'alto',
    'Operação grande, alto consumo de hidráulica pesada. Sem fornecedor preferencial mapeado.',
    'Henrique, sou da DSR-Hidraupecas. Atendemos mineradoras com linha de cilindros de alta pressão e suporte técnico em campo. Posso agendar 15min?', 'apify'),
  ('33333333-3333-3333-3333-333333333308', 'Frotas RS Locação', 'Mariana Goldemberg', '+55 51 99887-2211', 'mariana@frotasrs.com.br', null, 'Porto Alegre/RS', 4.1, 'Locação de equipamentos', 'contatado', 'medio',
    'Locadora — manutenção intensa, mas pode ter contrato com fornecedor único.',
    'Mariana, conforme conversamos, envio nosso portfólio. Aguardo seu retorno.', 'apify');

insert into lead_atividades (lead_id, texto, created_at) values
  ('33333333-3333-3333-3333-333333333301', 'Lead capturado via Apify (busca: ''hidráulica agrícola ribeirão preto'')', now() - interval '2 hours'),
  ('33333333-3333-3333-3333-333333333302', 'Lead capturado via Apify', now() - interval '2 days'),
  ('33333333-3333-3333-3333-333333333302', 'Mensagem enviada via WhatsApp', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333303', 'Primeiro contato via WhatsApp', now() - interval '5 days'),
  ('33333333-3333-3333-3333-333333333303', 'Resposta positiva — pediu proposta', now() - interval '3 days'),
  ('33333333-3333-3333-3333-333333333304', 'Reunião realizada', now() - interval '4 days'),
  ('33333333-3333-3333-3333-333333333304', 'Proposta enviada — R$ 18.400', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333305', 'Cliente optou por concorrente', now() - interval '7 days'),
  ('33333333-3333-3333-3333-333333333306', 'Proposta aceita', now() - interval '14 days'),
  ('33333333-3333-3333-3333-333333333306', 'Pedido confirmado — R$ 32.140', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333307', 'Lead capturado via Apify', now() - interval '3 hours'),
  ('33333333-3333-3333-3333-333333333308', 'Catálogo enviado', now() - interval '2 days');

insert into company_settings (nome, cnpj, email, telefone, endereco, ai_provider) values
  ('DSR-Hidraupecas Ltda.', '22.345.678/0001-90', 'contato@dsrhidraupecas.com.br', '+55 11 3344-5566', 'R. das Indústrias 1240, Guarulhos/SP, CEP 07020-100', 'gemini');
