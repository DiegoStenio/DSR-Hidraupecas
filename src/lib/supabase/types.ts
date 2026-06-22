export type Cliente = {
  id: string;
  tipo: "PF" | "PJ";
  nome: string;
  nome_fantasia: string | null;
  documento: string;
  ie_rg: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  ia_risco: "baixo" | "medio" | "alto";
  ia_upsell: string[];
  ia_resumo: string | null;
  created_at: string;
};

export type Prestador = {
  id: string;
  tipo: "PF" | "PJ";
  nome: string;
  nome_fantasia: string | null;
  documento: string;
  ie_rg: string | null;
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  vendedor_id: string | null;
  created_at: string;
};

export type Vendedor = {
  id: string;
  nome: string;
  whatsapp: string | null;
  created_at: string;
};

export type PlanoPagamento = {
  id: string;
  nome: string;
  descricao: string | null;
  parcelas: number;
  is_pix: boolean;
  created_at: string;
};

export type ItemOrcamento = { descricao: string; qtd: number; valor: number };

export type Orcamento = {
  id: string;
  numero: string;
  cliente_id: string | null;
  cliente_nome: string;
  vendedor_id: string | null;
  vendedor_nome: string;
  total: number;
  desconto: number;
  status: "pendente" | "aprovado" | "realizado";
  data: string;
  plano: string | null;
  plano_id: string | null;
  itens: ItemOrcamento[];
  budget_type: "items" | "group";
  group_unit_price: number | null;
  group_quantity: number | null;
  observacao: string | null;
  installments_count: number | null;
  created_at: string;
};

export type LeadEtapaCor = "blue" | "indigo" | "gold" | "purple" | "emerald" | "rose" | "slate";

export type LeadEtapa = {
  id: string;
  nome: string;
  ordem: number;
  cor: LeadEtapaCor;
  arquiva: boolean;
  created_at: string;
};

export type LeadScore = "alto" | "medio" | "baixo";

export type Lead = {
  id: string;
  empresa: string;
  contato: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  site: string | null;
  avaliacao: number | null;
  categoria: string | null;
  etapa_id: string;
  arquivado: boolean;
  score: LeadScore | null;
  score_justificativa: string | null;
  sugestao_whatsapp: string | null;
  origem: "manual" | "apify";
  tipo_negocio: "cliente" | "parceiro" | null;
  converted_cliente_id: string | null;
  converted_prestador_id: string | null;
  created_at: string;
};

export type LeadAtividade = {
  id: string;
  lead_id: string;
  texto: string;
  created_at: string;
};

export type LeadSearch = {
  id: string;
  nicho: string | null;
  cidade: string | null;
  estado: string | null;
  apify_run_id: string | null;
  status: string;
  resultados_count: number;
  created_at: string;
};

export type CompanySettings = {
  id: string;
  nome: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  logo_url: string | null;
  background_url: string | null;
  pix_qrcode_url: string | null;
  pix_chave: string | null;
  contexto_negocio: string | null;
  resumo_ia: string | null;
  resumo_ia_atualizado_em: string | null;
  ai_provider: "gemini" | "claude";
  updated_at: string;
};

