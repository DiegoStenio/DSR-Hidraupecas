import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarLeadsApify } from "@/lib/apify-leads";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    termosClientes?: string[];
    termosParceiros?: string[];
    cidade?: string;
    estado?: string;
  };

  try {
    const result = await buscarLeadsApify(supabase, body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro na Apify." },
      { status: 502 },
    );
  }
}
