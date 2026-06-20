export type Cliente = {
  id: string;
  tipo: "PF" | "PJ";
  nome: string;
  documento: string;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  ia_risco: "baixo" | "medio" | "alto";
  ia_upsell: string[];
  ia_resumo: string | null;
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
  status: "pendente" | "realizado";
  data: string;
  plano: string | null;
  itens: ItemOrcamento[];
  budget_type: "items" | "group";
  group_unit_price: number | null;
  group_quantity: number | null;
  observacao: string | null;
  installments_count: number | null;
  created_at: string;
};

export type LeadStatus = "novo" | "contatado" | "qualificado" | "proposta" | "ganho" | "perdido";
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
  status: LeadStatus;
  score: LeadScore | null;
  score_justificativa: string | null;
  sugestao_whatsapp: string | null;
  origem: "manual" | "apify";
  converted_cliente_id: string | null;
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
  ai_provider: "gemini" | "claude";
  updated_at: string;
};

