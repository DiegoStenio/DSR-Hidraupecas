import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function buscarLeadsApify(
  supabase: SupabaseClient,
  params: { termosClientes?: string[]; termosParceiros?: string[]; cidade?: string; estado?: string },
) {
  const { termosClientes = [], termosParceiros = [], cidade, estado } = params;

  if (termosClientes.length === 0 && termosParceiros.length === 0) {
    throw new Error("Selecione ao menos um termo de busca.");
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("Token da Apify não configurado. Adicione APIFY_API_TOKEN nas variáveis de ambiente.");
  }

  const localizacao = [cidade, estado].filter(Boolean).join(", ");

  const { data: primeiraEtapa } = await supabase
    .from("lead_etapas").select("id").order("ordem", { ascending: true }).limit(1).single();
  if (!primeiraEtapa) {
    throw new Error("Nenhuma etapa de pipeline configurada no CRM.");
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
    throw err;
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

  let inserted: Record<string, unknown>[] = [];
  if (leadsToInsert.length > 0) {
    const { data, error } = await supabase.from("leads").insert(leadsToInsert).select();
    if (error) throw new Error(error.message);
    inserted = data ?? [];
  }

  await supabase.from("lead_searches").insert({
    nicho: [...termosClientes, ...termosParceiros].join(", "), cidade: cidade || null, estado: estado || null,
    status: "concluido", resultados_count: inserted.length,
  });

  return { count: inserted.length, leads: inserted };
}
