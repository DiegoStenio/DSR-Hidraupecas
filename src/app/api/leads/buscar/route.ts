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

async function runApifySearch(termos: string[], localizacao: string, token: string): Promise<ApifyPlace[]> {
  if (termos.length === 0) return [];
  const searchStringsArray = termos.map((t) => (localizacao ? `${t} em ${localizacao}` : t));

  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray,
        maxCrawledPlacesPerSearch: 8,
        language: "pt-BR",
        skipClosedPlaces: true,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Erro na Apify: ${await res.text()}`);
  }
  return (await res.json()) as ApifyPlace[];
}

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

  const { termosClientes = [], termosParceiros = [], cidade, estado } = (await request.json()) as {
    termosClientes?: string[];
    termosParceiros?: string[];
    cidade?: string;
    estado?: string;
  };

  if (termosClientes.length === 0 && termosParceiros.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um termo de busca." }, { status: 400 });
  }

  const localizacao = [cidade, estado].filter(Boolean).join(", ");

  const { data: primeiraEtapa } = await supabase
    .from("lead_etapas").select("id").order("ordem", { ascending: true }).limit(1).single();
  if (!primeiraEtapa) {
    return NextResponse.json({ error: "Nenhuma etapa de pipeline configurada no CRM." }, { status: 500 });
  }

  let clientesPlaces: ApifyPlace[] = [];
  let parceirosPlaces: ApifyPlace[] = [];
  try {
    [clientesPlaces, parceirosPlaces] = await Promise.all([
      runApifySearch(termosClientes, localizacao, token),
      runApifySearch(termosParceiros, localizacao, token),
    ]);
  } catch (err) {
    await supabase.from("lead_searches").insert({
      nicho: [...termosClientes, ...termosParceiros].join(", "), cidade: cidade || null, estado: estado || null,
      status: "erro", resultados_count: 0,
    });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro na Apify." }, { status: 502 });
  }

  const mapPlace = (p: ApifyPlace, tipo: "cliente" | "parceiro") => ({
    empresa: p.title!,
    telefone: p.phone ?? p.phoneUnformatted ?? null,
    endereco: p.address ?? null,
    site: p.website ?? null,
    avaliacao: typeof p.totalScore === "number" ? p.totalScore : null,
    categoria: p.categoryName ?? null,
    etapa_id: primeiraEtapa.id,
    arquivado: false,
    origem: "apify" as const,
    tipo_negocio: tipo,
  });

  const leadsToInsert = [
    ...clientesPlaces.filter((p) => p.title).map((p) => mapPlace(p, "cliente")),
    ...parceirosPlaces.filter((p) => p.title).map((p) => mapPlace(p, "parceiro")),
  ];

  let inserted: unknown[] = [];
  if (leadsToInsert.length > 0) {
    const { data, error } = await supabase.from("leads").insert(leadsToInsert).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted = data ?? [];
  }

  await supabase.from("lead_searches").insert({
    nicho: [...termosClientes, ...termosParceiros].join(", "), cidade: cidade || null, estado: estado || null,
    status: "concluido", resultados_count: inserted.length,
  });

  return NextResponse.json({ count: inserted.length, leads: inserted });
}
