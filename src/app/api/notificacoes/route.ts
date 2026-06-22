import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApifyUso } from "@/lib/apify-uso";

export type Notificacao = {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
  severidade: "info" | "atencao" | "urgente";
};

const DIAS_ORCAMENTO_PARADO = 7;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [orcRes, clientesRes, leadsRes, apify] = await Promise.all([
    supabase.from("orcamentos").select("status, data").eq("status", "pendente"),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("ia_risco", "alto"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("arquivado", false).is("score", null),
    getApifyUso(),
  ]);

  const notificacoes: Notificacao[] = [];

  const limiteData = new Date();
  limiteData.setDate(limiteData.getDate() - DIAS_ORCAMENTO_PARADO);
  const orcamentosParados = (orcRes.data ?? []).filter((o) => new Date(o.data) < limiteData);
  if (orcamentosParados.length > 0) {
    notificacoes.push({
      id: "orcamentos-parados",
      titulo: `${orcamentosParados.length} orçamento(s) pendente(s) há mais de ${DIAS_ORCAMENTO_PARADO} dias`,
      descricao: "Sem resposta há um tempo — vale dar um retorno pro cliente.",
      href: "/orcamentos",
      severidade: "atencao",
    });
  }

  if ((clientesRes.count ?? 0) > 0) {
    notificacoes.push({
      id: "clientes-risco-alto",
      titulo: `${clientesRes.count} cliente(s) com risco alto de perda`,
      descricao: "A análise de IA identificou risco de churn — considere uma ação de retenção.",
      href: "/clientes",
      severidade: "urgente",
    });
  }

  if ((leadsRes.count ?? 0) > 0) {
    notificacoes.push({
      id: "leads-sem-analise",
      titulo: `${leadsRes.count} lead(s) aguardando análise de IA`,
      descricao: "Gere a análise pra saber o potencial e a melhor abordagem.",
      href: "/crm",
      severidade: "info",
    });
  }

  if (apify.configured && apify.usageUsd != null && apify.limitUsd) {
    const pct = (apify.usageUsd / apify.limitUsd) * 100;
    if (pct >= 80) {
      notificacoes.push({
        id: "apify-limite",
        titulo: "Uso da Apify perto do limite mensal",
        descricao: `$${apify.usageUsd.toFixed(2)} de $${apify.limitUsd.toFixed(2)} usados — considere adicionar créditos.`,
        href: "/configuracoes",
        severidade: "urgente",
      });
    }
  }

  return NextResponse.json({ notificacoes });
}
