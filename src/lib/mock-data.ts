// Mock data for the DSR-Hidraupecas prototype.
// Centralized so it's trivial to swap for live data later.

export type LeadStatus = "novo" | "contatado" | "qualificado" | "proposta" | "ganho" | "perdido";
export type LeadScore = "alto" | "medio" | "baixo";

export interface Lead {
  id: string;
  empresa: string;
  contato: string;
  telefone: string;
  email?: string;
  endereco?: string;
  site?: string;
  avaliacao?: number;
  categoria: string;
  status: LeadStatus;
  score: LeadScore;
  scoreJustificativa: string;
  sugestaoWhatsapp: string;
  atividades: { data: string; texto: string }[];
}

export interface Cliente {
  id: string;
  tipo: "PF" | "PJ";
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  observacoes?: string;
  iaRisco: "baixo" | "medio" | "alto";
  iaUpsell: string[];
  iaResumo: string;
}

export interface Vendedor {
  id: string;
  nome: string;
  whatsapp: string;
}

export interface PlanoPagamento {
  id: string;
  nome: string;
  descricao: string;
  parcelas: number;
}

export interface Orcamento {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  vendedorId: string;
  vendedorNome: string;
  total: number;
  status: "pendente" | "realizado";
  data: string;
  plano: string;
  itens: { descricao: string; qtd: number; valor: number }[];
}

export const vendedores: Vendedor[] = [
  { id: "v1", nome: "Rafael Andrade", whatsapp: "+55 11 98765-1010" },
  { id: "v2", nome: "Júlia Moreira", whatsapp: "+55 11 99812-3030" },
  { id: "v3", nome: "Marcos Lima", whatsapp: "+55 21 99654-7878" },
];

export const planos: PlanoPagamento[] = [
  { id: "p1", nome: "À vista", descricao: "Pagamento integral via Pix com 5% de desconto", parcelas: 1 },
  { id: "p2", nome: "30/60", descricao: "Dois pagamentos iguais (30 e 60 dias)", parcelas: 2 },
  { id: "p3", nome: "3x no boleto", descricao: "Parcelado em 3x sem juros via boleto", parcelas: 3 },
  { id: "p4", nome: "Cartão 6x", descricao: "Parcelado em até 6x no cartão", parcelas: 6 },
];

export const clientes: Cliente[] = [
  {
    id: "c1", tipo: "PJ", nome: "Metalúrgica Andrade Ltda.", documento: "12.345.678/0001-90",
    telefone: "+55 11 3322-4455", email: "compras@metalandrade.com.br", cidade: "Guarulhos", estado: "SP",
    iaRisco: "baixo", iaUpsell: ["Mangueiras de alta pressão R2", "Kit de vedação 5/8\""],
    iaResumo: "Cliente recorrente há 4 anos, 18 orçamentos fechados, ticket médio R$ 12.400. Compras regulares a cada 45 dias."
  },
  {
    id: "c2", tipo: "PJ", nome: "Hidráulica Pampulha S/A", documento: "98.765.432/0001-11",
    telefone: "+55 31 3214-7788", email: "operacoes@pampulhahidr.com.br", cidade: "Belo Horizonte", estado: "MG",
    iaRisco: "medio", iaUpsell: ["Bombas de pistão axial", "Contrato de manutenção anual"],
    iaResumo: "Última compra há 92 dias — acima da média histórica de 60 dias. Possível abertura para concorrente."
  },
  {
    id: "c3", tipo: "PF", nome: "Carlos Eduardo Tavares", documento: "123.456.789-00",
    telefone: "+55 21 99888-1122", email: "carlos.tavares@gmail.com", cidade: "Rio de Janeiro", estado: "RJ",
    iaRisco: "baixo", iaUpsell: ["Cilindros telescópicos"],
    iaResumo: "Pessoa física, compras esporádicas para frota própria. Baixo volume, alta margem."
  },
  {
    id: "c4", tipo: "PJ", nome: "TransAgro Implementos", documento: "55.667.788/0001-22",
    telefone: "+55 62 3445-9090", email: "suprimentos@transagro.com.br", cidade: "Goiânia", estado: "GO",
    iaRisco: "alto", iaUpsell: ["Renegociação de condições", "Plano de pagamento estendido"],
    iaResumo: "Atraso de 47 dias no último pagamento. Volume caiu 38% no trimestre. Atenção do comercial recomendada."
  },
  {
    id: "c5", tipo: "PJ", nome: "Construtora Ferreira & Cia.", documento: "11.222.333/0001-44",
    telefone: "+55 11 4002-8922", email: "obras@ferreiracia.com.br", cidade: "Campinas", estado: "SP",
    iaRisco: "baixo", iaUpsell: ["Conjuntos de cilindros 80mm", "Pacote anual de reposição"],
    iaResumo: "Cliente em crescimento — pediu 3 orçamentos no último mês. Considerar oferta de volume."
  },
];

export const orcamentos: Orcamento[] = [
  {
    id: "o1", numero: "ORC-2025-0184", clienteId: "c1", clienteNome: "Metalúrgica Andrade Ltda.",
    vendedorId: "v1", vendedorNome: "Rafael Andrade", total: 14820, status: "realizado",
    data: "2025-06-12", plano: "30/60",
    itens: [
      { descricao: "Mangueira R2 1/2\" — 50m", qtd: 4, valor: 2150 },
      { descricao: "Conexão JIC 90°", qtd: 12, valor: 185 },
      { descricao: "Cilindro hidráulico 80x500", qtd: 2, valor: 1850 },
    ],
  },
  {
    id: "o2", numero: "ORC-2025-0185", clienteId: "c5", clienteNome: "Construtora Ferreira & Cia.",
    vendedorId: "v2", vendedorNome: "Júlia Moreira", total: 8430, status: "pendente",
    data: "2025-06-14", plano: "3x no boleto",
    itens: [
      { descricao: "Bomba de engrenagem 25cc", qtd: 1, valor: 5180 },
      { descricao: "Filtro de retorno 60L/min", qtd: 2, valor: 1625 },
    ],
  },
  {
    id: "o3", numero: "ORC-2025-0186", clienteId: "c2", clienteNome: "Hidráulica Pampulha S/A",
    vendedorId: "v1", vendedorNome: "Rafael Andrade", total: 22150, status: "pendente",
    data: "2025-06-15", plano: "Cartão 6x",
    itens: [
      { descricao: "Bomba de pistão axial A10VSO", qtd: 1, valor: 18900 },
      { descricao: "Kit vedação completo", qtd: 5, valor: 650 },
    ],
  },
  {
    id: "o4", numero: "ORC-2025-0187", clienteId: "c3", clienteNome: "Carlos Eduardo Tavares",
    vendedorId: "v3", vendedorNome: "Marcos Lima", total: 3290, status: "realizado",
    data: "2025-06-15", plano: "À vista",
    itens: [{ descricao: "Cilindro telescópico 4 estágios", qtd: 1, valor: 3290 }],
  },
  {
    id: "o5", numero: "ORC-2025-0188", clienteId: "c4", clienteNome: "TransAgro Implementos",
    vendedorId: "v2", vendedorNome: "Júlia Moreira", total: 6740, status: "pendente",
    data: "2025-06-16", plano: "30/60",
    itens: [
      { descricao: "Válvula direcional D03", qtd: 3, valor: 1480 },
      { descricao: "Mangueira R1 3/8\" — 30m", qtd: 4, valor: 580 },
    ],
  },
];

export const leads: Lead[] = [
  {
    id: "l1", empresa: "Tractor Power Implementos", contato: "Eduardo Sampaio",
    telefone: "+55 16 99812-3344", email: "ed@tractorpower.com.br", site: "tractorpower.com.br",
    endereco: "Av. Industrial 1240, Ribeirão Preto/SP", avaliacao: 4.7,
    categoria: "Implementos agrícolas", status: "novo", score: "alto",
    scoreJustificativa: "Empresa porte médio, 23 funcionários no LinkedIn, site recente, abertura para fornecedores.",
    sugestaoWhatsapp: "Olá Eduardo, tudo bem? Sou da DSR-Hidraupecas. Vi que a Tractor Power trabalha com implementos agrícolas — temos linha completa de mangueiras e cilindros com pronta entrega. Posso te enviar nosso catálogo?",
    atividades: [{ data: "Hoje, 09:14", texto: "Lead capturado via Apify (busca: 'hidráulica agrícola ribeirão preto')" }],
  },
  {
    id: "l2", empresa: "Hidromec Reparos", contato: "Sandra Vieira",
    telefone: "+55 11 4456-7788", email: "contato@hidromec.com.br", site: "hidromec.com.br",
    endereco: "R. dos Mecânicos 89, São Bernardo/SP", avaliacao: 4.2,
    categoria: "Manutenção hidráulica", status: "contatado", score: "alto",
    scoreJustificativa: "Especializada em reparos — alto consumo de peças de reposição. Compra recorrente provável.",
    sugestaoWhatsapp: "Sandra, boa tarde. Vi a Hidromec e sei que vocês fazem reparos hidráulicos pesados. Trabalhamos com vedações e kits de reparo para as principais marcas. Posso te mostrar nossos preços?",
    atividades: [
      { data: "Ontem, 16:30", texto: "Mensagem enviada via WhatsApp" },
      { data: "Há 2 dias", texto: "Lead capturado via Apify" },
    ],
  },
  {
    id: "l3", empresa: "AgroSul Máquinas", contato: "Roberto Klein",
    telefone: "+55 51 3221-8899", email: "roberto@agrosul.com.br",
    endereco: "BR-116 km 234, Caxias do Sul/RS", avaliacao: 4.8,
    categoria: "Revenda agrícola", status: "qualificado", score: "alto",
    scoreJustificativa: "Revenda regional consolidada, 12 anos de mercado, sem fornecedor exclusivo de hidráulica.",
    sugestaoWhatsapp: "Roberto, conversamos na semana passada. Preparei uma proposta inicial considerando o volume que você mencionou. Posso te ligar amanhã 10h?",
    atividades: [
      { data: "Há 3 dias", texto: "Resposta positiva — pediu proposta" },
      { data: "Há 5 dias", texto: "Primeiro contato via WhatsApp" },
    ],
  },
  {
    id: "l4", empresa: "Caminhões Centro-Oeste", contato: "Patrícia Almeida",
    telefone: "+55 62 3551-2244", site: "caminhoesco.com.br",
    endereco: "Av. Anhanguera 4500, Goiânia/GO", avaliacao: 4.0,
    categoria: "Transporte pesado", status: "proposta", score: "medio",
    scoreJustificativa: "Frota grande mas centralizada em São Paulo. Decisão pode ser remota.",
    sugestaoWhatsapp: "Patrícia, segue a proposta revisada com o desconto que combinamos. Validade 7 dias.",
    atividades: [
      { data: "Há 1 dia", texto: "Proposta enviada — R$ 18.400" },
      { data: "Há 4 dias", texto: "Reunião realizada" },
    ],
  },
  {
    id: "l5", empresa: "Oficina São Jorge", contato: "José Carlos",
    telefone: "+55 11 2233-1010", endereco: "R. das Oficinas 12, São Paulo/SP", avaliacao: 3.8,
    categoria: "Oficina mecânica", status: "perdido", score: "baixo",
    scoreJustificativa: "Pequeno porte, baixo volume de compra. Optou por fornecedor local.",
    sugestaoWhatsapp: "José, obrigado pela conversa. Quando precisar, estamos à disposição.",
    atividades: [{ data: "Há 1 semana", texto: "Cliente optou por concorrente" }],
  },
  {
    id: "l6", empresa: "Florestal Norte Ltda.", contato: "Amanda Sousa",
    telefone: "+55 91 3344-5566", email: "compras@florestaln.com.br",
    endereco: "Distrito Industrial, Belém/PA", avaliacao: 4.5,
    categoria: "Equipamentos florestais", status: "ganho", score: "alto",
    scoreJustificativa: "Cliente fechado — pedido inicial R$ 32.000. Potencial de recorrência alta.",
    sugestaoWhatsapp: "Amanda, obrigado pela confiança! Pedido entra em produção amanhã. Te aviso quando despachar.",
    atividades: [
      { data: "Ontem", texto: "Pedido confirmado — R$ 32.140" },
      { data: "Há 2 semanas", texto: "Proposta aceita" },
    ],
  },
  {
    id: "l7", empresa: "Mineradora Vale do Açu", contato: "Henrique Costa",
    telefone: "+55 84 3998-7711", site: "mvaleacu.com.br",
    endereco: "Mossoró/RN", avaliacao: 4.3,
    categoria: "Mineração", status: "novo", score: "alto",
    scoreJustificativa: "Operação grande, alto consumo de hidráulica pesada. Sem fornecedor preferencial mapeado.",
    sugestaoWhatsapp: "Henrique, sou da DSR-Hidraupecas. Atendemos mineradoras com linha de cilindros de alta pressão e suporte técnico em campo. Posso agendar 15min?",
    atividades: [{ data: "Hoje, 11:02", texto: "Lead capturado via Apify" }],
  },
  {
    id: "l8", empresa: "Frotas RS Locação", contato: "Mariana Goldemberg",
    telefone: "+55 51 99887-2211", email: "mariana@frotasrs.com.br",
    endereco: "Porto Alegre/RS", avaliacao: 4.1,
    categoria: "Locação de equipamentos", status: "contatado", score: "medio",
    scoreJustificativa: "Locadora — manutenção intensa, mas pode ter contrato com fornecedor único.",
    sugestaoWhatsapp: "Mariana, conforme conversamos, envio nosso portfólio. Aguardo seu retorno.",
    atividades: [{ data: "Há 2 dias", texto: "Catálogo enviado" }],
  },
];

export const kpis = {
  orcamentosTotais: 184,
  clientesCadastrados: 67,
  orcamentosRealizados: { qtd: 112, valor: 487400 },
  orcamentosPendentes: 23,
};

export const orcamentosUltimos7Dias = [
  { dia: "Qua", quantidade: 4 },
  { dia: "Qui", quantidade: 7 },
  { dia: "Sex", quantidade: 5 },
  { dia: "Sáb", quantidade: 2 },
  { dia: "Dom", quantidade: 1 },
  { dia: "Seg", quantidade: 9 },
  { dia: "Ter", quantidade: 6 },
];

export const funilLeads: { status: LeadStatus; label: string; qtd: number }[] = [
  { status: "novo", label: "Novo", qtd: 42 },
  { status: "contatado", label: "Contatado", qtd: 28 },
  { status: "qualificado", label: "Qualificado", qtd: 17 },
  { status: "proposta", label: "Proposta", qtd: 9 },
  { status: "ganho", label: "Ganho", qtd: 4 },
];

export const resumoIA =
  "A semana fechou 14% acima da média mensal em volume de orçamentos, puxada por hidráulica pesada (54% do total). A taxa de conversão lead→cliente subiu para 9,5% — o melhor número desde março. Atenção: 3 clientes recorrentes (TransAgro, Pampulha, Oficinas BH) reduziram pedidos no trimestre.";

export const statusLeadConfig: Record<LeadStatus, { label: string; color: string }> = {
  novo:         { label: "Novo",        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  contatado:    { label: "Contatado",   color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  qualificado:  { label: "Qualificado", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  proposta:     { label: "Proposta",    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  ganho:        { label: "Ganho",       color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  perdido:      { label: "Perdido",     color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};
