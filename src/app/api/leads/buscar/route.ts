import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const ACTOR_ID = "compass~crawler-google-places";

type ApifyPlace = {
  title?: string;
  phone?: string;
  phoneUnformatted?: string;
  address?: string;
  website?: string;
  totalScore?: number;
  categoryName?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Token da Apify não configurado. Adicione APIFY_API_TOKEN nas variáveis de ambiente." },
      { status: 400 },
    );
  }

  const { nicho, cidade, estado } = (await request.json()) as { nicho?: string; cidade?: string; estado?: string };
  if (!nicho?.trim()) {
    return NextResponse.json({ error: "Informe um nicho ou palavra-chave." }, { status: 400 });
  }

  const localizacao = [cidade, estado].filter(Boolean).join(", ");
  const query = localizacao ? `${nicho} em ${localizacao}` : nicho;

  const apifyRes = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [query],
        maxCrawledPlacesPerSearch: 20,
        language: "pt-BR",
        skipClosedPlaces: true,
      }),
    },
  );

  if (!apifyRes.ok) {
    const text = await apifyRes.text();
    await supabase.from("lead_searches").insert({
      nicho, cidade: cidade || null, estado: estado || null, status: "erro", resultados_count: 0,
    });
    return NextResponse.json({ error: `Erro na Apify: ${text}` }, { status: 502 });
  }

  const places = (await apifyRes.json()) as ApifyPlace[];

  const leadsToInsert = places
    .filter((p) => p.title)
    .map((p) => ({
      empresa: p.title!,
      telefone: p.phone ?? p.phoneUnformatted ?? null,
      endereco: p.address ?? null,
      site: p.website ?? null,
      avaliacao: typeof p.totalScore === "number" ? p.totalScore : null,
      categoria: p.categoryName ?? null,
      status: "novo" as const,
      origem: "apify" as const,
    }));

  let inserted: unknown[] = [];
  if (leadsToInsert.length > 0) {
    const { data, error } = await supabase.from("leads").insert(leadsToInsert).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted = data ?? [];
  }

  await supabase.from("lead_searches").insert({
    nicho, cidade: cidade || null, estado: estado || null,
    status: "concluido", resultados_count: inserted.length,
  });

  return NextResponse.json({ count: inserted.length, leads: inserted });
}
