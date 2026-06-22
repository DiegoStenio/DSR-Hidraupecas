import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analisarLeadFlow } from "@/ai/flows/analisar-lead";

export const maxDuration = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [leadRes, settingsRes] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase.from("company_settings").select("contexto_negocio").limit(1).maybeSingle(),
  ]);

  if (leadRes.error || !leadRes.data) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }
  const lead = leadRes.data;

  try {
    const result = await analisarLeadFlow({
      contextoNegocio: settingsRes.data?.contexto_negocio ?? undefined,
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
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message ?? "Erro ao salvar análise." }, { status: 500 });
    }

    return NextResponse.json({ lead: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar análise com IA." },
      { status: 502 },
    );
  }
}
