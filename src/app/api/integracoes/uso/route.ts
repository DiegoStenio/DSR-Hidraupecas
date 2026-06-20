import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ApifyUso = {
  configured: boolean;
  usageUsd?: number;
  limitUsd?: number;
  cycleEndsAt?: string;
  error?: string;
};

async function getApifyUso(): Promise<ApifyUso> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return { configured: false };

  try {
    const res = await fetch(`https://api.apify.com/v2/users/me/limits?token=${token}`);
    if (!res.ok) return { configured: true, error: `Erro ${res.status} ao consultar uso na Apify.` };
    const json = await res.json();
    return {
      configured: true,
      usageUsd: json.data?.current?.monthlyUsageUsd,
      limitUsd: json.data?.limits?.maxMonthlyUsageUsd,
      cycleEndsAt: json.data?.monthlyUsageCycle?.endAt,
    };
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.message : "Erro ao consultar uso na Apify." };
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const apify = await getApifyUso();
  const gemini = { configured: Boolean(process.env.GEMINI_API_KEY) };

  return NextResponse.json({ apify, gemini });
}
