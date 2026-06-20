import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarTermosBuscaFlow } from "@/ai/flows/gerar-termos-busca";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { nicho, cidade, estado } = (await request.json()) as { nicho?: string; cidade?: string; estado?: string };

  const { data: settings } = await supabase.from("company_settings").select("contexto_negocio").limit(1).maybeSingle();
  const contextoNegocio = settings?.contexto_negocio?.trim();
  if (!contextoNegocio) {
    return NextResponse.json(
      { error: "Defina o contexto do negócio em Configurações > Integrações antes de gerar sugestões." },
      { status: 400 },
    );
  }

  try {
    const result = await gerarTermosBuscaFlow({ contextoNegocio, nicho, cidade, estado });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar sugestões com IA." },
      { status: 502 },
    );
  }
}
