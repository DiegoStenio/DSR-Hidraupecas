import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analisarClienteEPersiste } from "@/lib/ai-analise";

export const maxDuration = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const cliente = await analisarClienteEPersiste(supabase, id);
    return NextResponse.json({ cliente });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar análise com IA." },
      { status: 502 },
    );
  }
}
