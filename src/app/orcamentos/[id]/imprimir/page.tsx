"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, CompanySettings, Orcamento, PlanoPagamento, Vendedor } from "@/lib/supabase/types";
import { OrcamentoPrintable } from "@/components/app/orcamento-printable";
import { toast } from "sonner";

export default function ImprimirOrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [plano, setPlano] = useState<PlanoPagamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: o, error } = await supabase.from("orcamentos").select("*").eq("id", id).single();
      if (error || !o) { setLoading(false); return; }
      setOrcamento(o);

      const [{ data: c }, { data: v }, { data: s }, { data: pl }] = await Promise.all([
        o.cliente_id ? supabase.from("clientes").select("*").eq("id", o.cliente_id).single() : Promise.resolve({ data: null }),
        o.vendedor_id ? supabase.from("vendedores").select("*").eq("id", o.vendedor_id).single() : Promise.resolve({ data: null }),
        supabase.from("company_settings").select("*").limit(1).maybeSingle(),
        o.plano_id ? supabase.from("planos_pagamento").select("*").eq("id", o.plano_id).single() : Promise.resolve({ data: null }),
      ]);
      setCliente(c ?? null);
      setVendedor(v ?? null);
      setSettings(s ?? null);
      setPlano(pl ?? null);
      setLoading(false);
    })();
  }, [id, supabase]);

  const handleDownloadPdf = async () => {
    if (!printRef.current || !orcamento) return;
    setGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .from(printRef.current)
        .set({
          margin: 0,
          filename: `${orcamento.numero}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .save();
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted p-8">
        <Skeleton className="h-12 w-1/2 mb-8 mx-auto" />
        <Skeleton className="h-[1000px] w-full max-w-[800px] mx-auto" />
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Orçamento não encontrado</h1>
          <p className="text-muted-foreground">O orçamento solicitado não existe ou foi excluído.</p>
        </div>
        <Button onClick={() => router.push("/orcamentos")} variant="secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-screen p-4 md:p-8">
      <div className="flex justify-center items-center gap-4 mb-8">
        <Button onClick={() => router.push("/orcamentos")} variant="secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>
        <Button onClick={handleDownloadPdf} disabled={generating}>
          <Download className="mr-2 h-4 w-4" />{generating ? "Gerando…" : "Baixar PDF"}
        </Button>
      </div>

      <OrcamentoPrintable ref={printRef} orcamento={orcamento} cliente={cliente} vendedor={vendedor} settings={settings} plano={plano} />
    </div>
  );
}
