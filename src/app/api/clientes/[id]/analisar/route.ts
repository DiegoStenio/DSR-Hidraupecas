import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analisarClienteFlow } from "@/ai/flows/analisar-cliente";

export const maxDuration = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [clienteRes, orcRes, settingsRes] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).single(),
    supabase.from("orcamentos").select("status, total, data").eq("cliente_id", id).order("data", { ascending: false }),
    supabase.from("company_settings").select("contexto_negocio").limit(1).maybeSingle(),
  ]);

  if (clienteRes.error || !clienteRes.data) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }
  const cliente = clienteRes.data;
  const orcamentos = orcRes.data ?? [];
  const realizados = orcamentos.filter((o) => o.status === "realizado");
  const diasDesdeUltimoOrcamento = orcamentos.length > 0
    ? Math.floor((Date.now() - new Date(orcamentos[0].data).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  try {
    const result = await analisarClienteFlow({
      contextoNegocio: settingsRes.data?.contexto_negocio ?? undefined,
      nome: cliente.nome,
      tipo: cliente.tipo,
      cidade: cliente.cidade,
      observacoes: cliente.observacoes,
      totalOrcamentos: orcamentos.length,
      orcamentosRealizados: realizados.length,
      orcamentosPendentes: orcamentos.length - realizados.length,
      valorTotalRealizado: realizados.reduce((s, o) => s + o.total, 0),
      diasDesdeUltimoOrcamento,
    });

    const { data: updated, error } = await supabase
      .from("clientes")
      .update({
        ia_risco: result.risco,
        ia_resumo: result.resumo,
        ia_upsell: result.upsell,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message ?? "Erro ao salvar análise." }, { status: 500 });
    }

    return NextResponse.json({ cliente: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar análise com IA." },
      { status: 502 },
    );
  }
}
