import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resumoDashboardFlow } from "@/ai/flows/resumo-dashboard";

export const maxDuration = 30;

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [orcRes, cliRes, presRes, etapasRes, leadsRes, settingsRes] = await Promise.all([
    supabase.from("orcamentos").select("status, total"),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("prestadores").select("*", { count: "exact", head: true }),
    supabase.from("lead_etapas").select("*").order("ordem", { ascending: true }),
    supabase.from("leads").select("etapa_id, arquivado"),
    supabase.from("company_settings").select("id, contexto_negocio").limit(1).maybeSingle(),
  ]);

  const orcamentos = orcRes.data ?? [];
  const realizados = orcamentos.filter((o) => o.status === "realizado");
  const etapas = etapasRes.data ?? [];
  const leads = leadsRes.data ?? [];

  const leadEtapaCounts: Record<string, number> = {};
  let leadsArquivadosCount = 0;
  leads.forEach((l) => {
    leadEtapaCounts[l.etapa_id] = (leadEtapaCounts[l.etapa_id] ?? 0) + 1;
    if (l.arquivado) leadsArquivadosCount += 1;
  });
  const funilLeads = etapas
    .filter((e) => !e.arquiva)
    .map((e) => ({ label: e.nome, qtd: leadEtapaCounts[e.id] ?? 0 }));

  try {
    const result = await resumoDashboardFlow({
      contextoNegocio: settingsRes.data?.contexto_negocio ?? undefined,
      orcamentosTotais: orcamentos.length,
      orcamentosPendentes: orcamentos.filter((o) => o.status === "pendente").length,
      orcamentosRealizadosQtd: realizados.length,
      orcamentosRealizadosValor: realizados.reduce((s, o) => s + o.total, 0),
      clientesCount: cliRes.count ?? 0,
      prestadoresCount: presRes.count ?? 0,
      funilLeads,
      leadsArquivadosCount,
    });

    const atualizadoEm = new Date().toISOString();
    if (settingsRes.data?.id) {
      await supabase.from("company_settings")
        .update({ resumo_ia: result.resumo, resumo_ia_atualizado_em: atualizadoEm })
        .eq("id", settingsRes.data.id);
    }

    return NextResponse.json({ resumo: result.resumo, atualizadoEm });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar resumo com IA." },
      { status: 502 },
    );
  }
}
