# DSR-Hidraupecas — Prompt Lovable

## Contexto

Estou recriando o app de uma empresa de peças e equipamentos hidráulicos chamada **DSR-Hidraupecas**. É uma ferramenta interna de gestão usada pela equipe (administração + vendedores) tanto no computador do escritório quanto no celular em campo, várias vezes por dia. Os dois fluxos mais usados são: (1) criar e enviar orçamentos para clientes por WhatsApp, e (2) buscar e qualificar leads novos em um CRM.

Construa um **protótipo navegável em React + Tailwind**, com **dados mockados** (não precisa de backend real — isso será conectado depois a Supabase, API do Apify e IA). O objetivo aqui é só a camada visual e de interação, completa e polida, em todas as telas abaixo.

## Identidade visual

Sensação desejada: **sofisticação**. Nada de visual genérico de SaaS. Pense em algo entre um banco de investimentos moderno e um CRM premium — sóbrio, denso de informação mas nunca poluído, com um toque de luxo discreto.

**Paleta — modo claro (padrão ao abrir o app):**
- Fundo geral: `#F8F9FB`
- Fundo de cards/superfícies: `#FFFFFF`
- Primária (navy): `#0B1F3A`
- Primária hover/variante: `#14315C`
- Acento dourado: `#C9A227`
- Acento dourado claro (hover/destaque): `#E8C766`
- Texto principal: `#0F172A`
- Texto secundário: `#5B6472`
- Bordas: `#E5E8EC`
- Sucesso: `#1F9D55`
- Atenção: `#D97706`
- Erro/destrutivo: `#DC2626`

**Paleta — modo escuro:**
- Fundo geral: `#0B0F19`
- Fundo de cards: `#131826`
- Primária: `#1E3A66`
- Acento dourado (mais vibrante no escuro): `#D4AF37`
- Texto principal: `#F1F5F9`
- Texto secundário: `#94A3B8`
- Bordas: `#212838`

**Tipografia:**
- Fonte principal de UI e corpo de texto: **Inter** (todos os pesos, 400/500/600/700).
- Fonte de destaque (só para o nome da marca no login/sidebar e para os números grandes de KPI no dashboard): **Fraunces** (serifada, dá o toque sofisticado) — usar com peso 500-600, nunca em itálico exagerado, apenas para criar contraste com a Inter do resto.
- Hierarquia mínima: títulos de página 24px/Inter 700, títulos de card 16px/Inter 600, corpo 14px/Inter 400, texto auxiliar 12px/Inter 500 com `text-secondary`.

**Elemento de assinatura visual (use de forma consistente em todo o app):**
- Uma barra fina dourada (`#C9A227`, 2-3px) embaixo do item de navegação ativo na sidebar, e à esquerda do título de cada seção principal.
- Números de KPI no dashboard animam com contagem incremental ao carregar (de 0 até o valor final, ~800ms, easing suave).
- Badges de "score de IA" usam um ponto pulsante sutil (`animate-pulse` leve) ao lado do texto quando o score é "Alto potencial".

**Estilo geral:** cards com `rounded-2xl`, sombra suave (`shadow-sm`, nunca sombras pesadas), bastante respiro (padding generoso, `gap-6` entre elementos), bordas finas em vez de divisórias pesadas. Ícones: **lucide-react**, stroke fino (1.5px). Gráficos: estilo **recharts**, minimalista, sem grid pesado, com a cor primária navy para dados principais e dourado para destaques/metas.

## Estrutura e navegação

- **Sidebar lateral fixa** à esquerda (recolhível em um ícone, expandida por padrão), fundo navy escuro mesmo no modo claro (`#0B1F3A` com texto claro), para criar contraste premium com o resto claro do app. Itens: Dashboard, CRM (Leads), Clientes, Orçamentos, Vendedores, Planos de Pagamento, Configurações. Logo/wordmark "DSR-Hidraupecas" no topo em Fraunces.
- **Header superior**: campo de busca rápida (estilo command palette, atalho `⌘K`/`Ctrl+K`), toggle de tema claro/escuro, avatar do usuário com menu (perfil, sair).
- Funciona tanto em desktop quanto em mobile com a mesma qualidade: no mobile a sidebar colapsa para um menu inferior ou drawer lateral acionado por um ícone de menu no header.

## Telas

### 1. Login
Tela centralizada, fundo navy com um gradiente sutil para um navy mais claro no canto, card branco central com `rounded-2xl` e sombra. Logo "DSR-Hidraupecas" em Fraunces acima do formulário. Campos de email e senha, botão primário dourado sobre navy ("Entrar"), link "Esqueci minha senha". Sem opção de cadastro (acesso só para equipe interna).

### 2. Dashboard
- Linha de 4 cards de KPI: Orçamentos Totais, Clientes Cadastrados, Orçamentos Realizados (com valor faturado), Orçamentos Pendentes. Números grandes em Fraunces com animação de contagem, ícone lucide no canto superior direito de cada card.
- Gráfico de barras "Orçamentos nos Últimos 7 Dias".
- Novo: card de **funil de leads por status** (Novo → Contatado → Qualificado → Proposta → Ganho/Perdido) em formato de funil horizontal ou barras decrescentes, com taxa de conversão lead→cliente em destaque (%).
- Novo: card **"Resumo Inteligente"** com ícone de sparkles dourado, texto gerado por IA (mockado) resumindo a performance da semana em 2-3 frases, com timestamp "Atualizado há 2h" e botão "Atualizar análise".

### 3. CRM / Leads
- Quadro **Kanban** com 6 colunas: Novo, Contatado, Qualificado, Proposta, Ganho, Perdido. Colunas com contador de leads no topo. Cards de lead com: nome da empresa, nome do contato, telefone, categoria/nicho, e um **badge de score de IA** (Alto potencial = dourado com ponto pulsante, Médio = cinza-azulado, Baixo = cinza claro).
- Botão destacado no topo da tela, estilo navy+dourado: **"Buscar novos leads"** — abre modal com campos: nicho/palavra-chave, cidade, estado, e botão "Buscar via Apify" (mockar um estado de loading com barra de progresso "Buscando leads... isso pode levar alguns minutos").
- Clicar em um card de lead abre um **drawer lateral** (da direita) com: todos os dados extraídos (empresa, contato, telefone, email, endereço, site, avaliação), histórico de atividades/notas (timeline vertical), seção "Análise de IA" com score + justificativa em texto + sugestão de mensagem de abordagem via WhatsApp (com botão de copiar), e botão primário "Converter em Cliente".
- Drag and drop dos cards entre colunas (visual apenas, com feedback de drop zone destacado em dourado).

### 4. Clientes
- Listagem com campo de busca no topo (por nome, telefone, CPF/CNPJ). Linhas/cards mostrando: ícone (pessoa física/jurídica), nome, CPF/CNPJ, telefone, email, cidade. Botão "Adicionar Novo Cliente".
- Modal/dialog de criar/editar com seções: tipo de pessoa (toggle física/jurídica), dados principais, endereço, observações.
- Ao abrir um cliente, mostrar abas: "Dados", "Orçamentos" (histórico) e **"Análise de IA"** (nova) com: risco de perda (badge baixo/médio/alto), oportunidades de upsell sugeridas (lista), resumo do histórico de compras em texto.

### 5. Orçamentos
- Listagem com filtro por status (Pendente/Realizado), busca por cliente. Cada linha mostra cliente, vendedor, valor total, status (badge colorido), data.
- Tela de criação: seleção de cliente e vendedor, modo de itens (lista de descrição/quantidade/valor com soma automática) ou modo "grupo" (preço único + quantidade), seleção de plano de pagamento, campo de desconto, total calculado em destaque (Fraunces, grande). Botões "Gerar PDF" e "Enviar via WhatsApp" (ícone do WhatsApp, verde).

### 6. Vendedores
CRUD simples em lista/cards: nome e WhatsApp, com modal de adicionar/editar.

### 7. Planos de Pagamento
CRUD simples: nome, descrição, número de parcelas, com modal de adicionar/editar.

### 8. Configurações
Seções organizadas em abas ou acordeão:
- **Empresa**: nome, CNPJ, endereço, email, upload de logo/imagem de cabeçalho do PDF, upload de imagem de fundo do app.
- **Pagamento**: upload/preview do QR code Pix.
- **Usuário**: nome, email, avatar.
- **Integrações** (nova, com destaque visual de "premium/avançado"): toggle para escolher provedor de IA ativo (Gemini ou Claude/Anthropic, com logos/ícones de cada), campo de token de API do Apify (input tipo senha com botão de mostrar/ocultar), estado "Não configurado" com texto explicativo quando o token estiver vazio.

## Interações

- Todo botão e link tem estado de hover explícito com transição `duration-200` (escurecer levemente o navy, ou clarear o dourado).
- Modais e drawers entram com animação de fade + slight scale/slide (200-250ms), nunca aparecem abruptamente.
- Mudança de tema (claro/escuro) é suave (`transition-colors duration-300` no body).
- Drag and drop no Kanban tem feedback visual claro na coluna de destino.

## Estados obrigatórios

- **Loading**: skeletons (blocos cinza pulsantes) no formato real do conteúdo — nunca um spinner genérico solto na tela.
- **Vazio**: toda lista/kanban/tabela sem dados mostra um ícone simples, uma frase com personalidade (ex: no CRM: "Nenhum lead por aqui ainda. Que tal buscar os primeiros?") e um botão de ação principal.
- **Erro**: mensagem clara e específica (nunca "Algo deu errado"), com ação de tentar novamente quando fizer sentido.
- Toda ação destrutiva (excluir cliente, vendedor, plano, lead) abre confirmação antes de executar.

## Mobile

- Sidebar colapsa em drawer acionado por ícone de menu no header.
- Kanban de leads em mobile vira colunas com scroll horizontal (uma coluna visível por vez, com indicador de quantas colunas existem).
- Tabelas/listas (clientes, orçamentos) em mobile viram cards verticais em vez de linhas de tabela.
- Modais em mobile ocupam a tela quase inteira (`fullscreen-ish`), drawers vêm de baixo em vez da direita.

## Restrições — não fazer

- Não usar a sidebar genérica cinza-clara padrão de templates — a sidebar é navy escura mesmo no modo claro, conforme especificado.
- Não usar azul "royal blue" genérico de SaaS como cor primária — usar exatamente o navy `#0B1F3A` especificado.
- Não usar spinners genéricos de loading.
- Não empilhar todos os campos de formulário verticalmente sem agrupamento — usar grids de 2 colunas em desktop para campos relacionados (ex: nome + telefone), conforme os formulários atuais de Cliente e Orçamento.
- Não remover a fonte Fraunces dos números de KPI e do wordmark — é o elemento de assinatura visual do produto.
- Esta é uma camada de protótipo/UI: pode (e deve) usar dados mockados realistas, mas a estrutura de componentes deve ser organizada de forma que dê para plugar dados reais depois (props claras, sem lógica de negócio hardcoded misturada com o visual).
