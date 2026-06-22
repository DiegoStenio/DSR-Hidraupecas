import type { SupabaseClient } from "@supabase/supabase-js";
import { analisarLeadFlow } from "@/ai/flows/analisar-lead";
import { analisarClienteFlow } from "@/ai/flows/analisar-cliente";
import type { ItemOrcamento } from "@/lib/supabase/types";

async function getContextoNegocio(supabase: SupabaseClient) {
  const { data } = await supabase.from("company_settings").select("contexto_negocio").limit(1).maybeSingle();
  return data?.contexto_negocio ?? undefined;
}

export async function analisarLeadEPersiste(supabase: SupabaseClient, leadId: string) {
  const [leadRes, contextoNegocio] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).single(),
    getContextoNegocio(supabase),
  ]);
  if (leadRes.error || !leadRes.data) {
    throw new Error("Lead não encontrado.");
  }
  const lead = leadRes.data;

  const result = await analisarLeadFlow({
    contextoNegocio,
    empresa: lead.empresa,
    categoria: lead.categoria ?? undefined,
    tipoNegocio: lead.tipo_negocio,
    temTelefone: !!lead.telefone,
    temSite: !!lead.site,
    temEndereco: !!lead.endereco,
    avaliacao: lead.avaliacao,
  });

  const { data: updated, error } = await supabase
    .from("leads")
    .update({
      score: result.score,
      score_justificativa: result.justificativa,
      sugestao_whatsapp: result.sugestaoWhatsapp,
    })
    .eq("id", leadId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Erro ao salvar análise.");
  }
  return updated;
}

export async function analisarClienteEPersiste(supabase: SupabaseClient, clienteId: string) {
  const [clienteRes, orcRes, contextoNegocio] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", clienteId).single(),
    supabase.from("orcamentos").select("status, total, data, itens, observacao").eq("cliente_id", clienteId).order("data", { ascending: false }),
    getContextoNegocio(supabase),
  ]);

  if (clienteRes.error || !clienteRes.data) {
    throw new Error("Cliente não encontrado.");
  }
  const cliente = clienteRes.data;
  const orcamentos = orcRes.data ?? [];
  const realizados = orcamentos.filter((o) => o.status === "realizado");
  const diasDesdeUltimoOrcamento = orcamentos.length > 0
    ? Math.floor((Date.now() - new Date(orcamentos[0].data).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const itensOrcados = orcamentos.flatMap((o) =>
    ((o.itens ?? []) as ItemOrcamento[]).map((it) => `${it.descricao} (qtd ${it.qtd}) — orçamento ${o.status}`),
  );
  const observacoesOrcamentos = orcamentos.map((o) => o.observacao).filter((o): o is string => !!o);

  const result = await analisarClienteFlow({
    contextoNegocio,
    nome: cliente.nome,
    tipo: cliente.tipo,
    cidade: cliente.cidade,
    observacoes: cliente.observacoes,
    totalOrcamentos: orcamentos.length,
    orcamentosRealizados: realizados.length,
    orcamentosPendentes: orcamentos.length - realizados.length,
    valorTotalRealizado: realizados.reduce((s, o) => s + o.total, 0),
    diasDesdeUltimoOrcamento,
    itensOrcados,
    observacoesOrcamentos,
  });

  const { data: updated, error } = await supabase
    .from("clientes")
    .update({
      ia_risco: result.risco,
      ia_resumo: result.resumo,
      ia_upsell: result.upsell,
    })
    .eq("id", clienteId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Erro ao salvar análise.");
  }
  return updated;
}
