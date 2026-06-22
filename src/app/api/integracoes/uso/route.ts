import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApifyUso } from "@/lib/apify-uso";

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
