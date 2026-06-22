"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, CompanySettings, Orcamento, PlanoPagamento, Vendedor } from "@/lib/supabase/types";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");

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

  const subtotal = orcamento.budget_type === "group"
    ? (orcamento.group_unit_price ?? 0) * (orcamento.group_quantity ?? 1)
    : orcamento.itens.reduce((sum, item) => sum + item.valor, 0);

  const isPix = plano ? plano.is_pix : (orcamento.plano ?? "").toLowerCase().includes("pix");

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

      <div ref={printRef} className="relative w-[210mm] mx-auto overflow-hidden bg-white text-black shadow-lg font-sans text-xs">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.06]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dsr-dark.png" alt="" className="h-[140mm] w-[140mm] object-contain" />
        </div>

        <header className="relative z-10 bg-[#0B1F3A] text-white p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dsr-dark.png" alt="Logo" className="h-14 w-14 object-contain shrink-0" />
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold uppercase">{settings?.nome || "Empresa"}</h1>
              {settings?.cnpj && <p className="text-xs">CNPJ: {settings.cnpj}</p>}
              {settings?.endereco && <p className="text-xs">{settings.endereco}</p>}
              <p className="text-xs">{[settings?.telefone, settings?.email].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <h2 className="text-lg font-bold" style={{ color: "#C9A227" }}>ORÇAMENTO</h2>
            <p className="text-xs"><span className="font-bold">Nº:</span> {orcamento.numero}</p>
            <p className="text-xs"><span className="font-bold">Data:</span> {fmtDate(orcamento.data)}</p>
          </div>
        </header>

        <section className="relative z-10 px-8 pt-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border p-3 rounded-md">
              <h3 className="font-bold mb-1 uppercase">Cliente:</h3>
              <p className="font-semibold">{orcamento.cliente_nome}</p>
              {cliente && (
                <>
                  {cliente.nome_fantasia && <p>{cliente.nome_fantasia}</p>}
                  <p>{cliente.tipo === "PJ" ? "CNPJ" : "CPF"}: {cliente.documento}</p>
                  {cliente.ie_rg && <p>{cliente.tipo === "PJ" ? "IE" : "RG"}: {cliente.ie_rg}</p>}
                  {cliente.telefone && <p>Tel: {cliente.telefone}</p>}
                  {cliente.email && <p>Email: {cliente.email}</p>}
                  {[cliente.logradouro, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado, cliente.cep].some(Boolean) && (
                    <p>End: {[cliente.logradouro, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado, cliente.cep].filter(Boolean).join(", ")}</p>
                  )}
                </>
              )}
            </div>
            <div className="border p-3 rounded-md">
              <h3 className="font-bold mb-1 uppercase">Vendedor:</h3>
              <p>{orcamento.vendedor_nome}</p>
              {vendedor?.whatsapp && <p>WhatsApp: {vendedor.whatsapp}</p>}
            </div>
          </div>

          <section className="mb-4">
            <h3 className="text-sm font-bold mb-2 border-b pb-1">SERVIÇOS</h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-1 font-bold uppercase">DESCRIÇÃO</th>
                  <th className="text-center py-1 font-bold uppercase w-20">QTD.</th>
                  <th className="text-right py-1 font-bold uppercase w-32">VLR. UNIT.</th>
                  <th className="text-right py-1 font-bold uppercase w-32">VLR. TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.budget_type === "items" && orcamento.itens.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1.5 pr-2 whitespace-pre-wrap align-top">{item.descricao}</td>
                    <td className="text-center py-1.5 align-top">{item.qtd}</td>
                    <td className="text-right py-1.5 align-top">{fmt(item.valor / item.qtd)}</td>
                    <td className="text-right py-1.5 align-top">{fmt(item.valor)}</td>
                  </tr>
                ))}
                {orcamento.budget_type === "group" && (
                  <>
                    {orcamento.itens.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-1.5 pr-2 whitespace-pre-wrap align-top" colSpan={4}>{item.descricao}</td>
                      </tr>
                    ))}
                    <tr className="border-b">
                      <td className="py-1.5 pr-2 whitespace-pre-wrap align-top font-bold italic">Valor total referente ao grupo de serviços descritos acima.</td>
                      <td className="text-center py-1.5 align-top font-bold">{orcamento.group_quantity}</td>
                      <td className="text-right py-1.5 align-top font-bold">{fmt(orcamento.group_unit_price ?? 0)}</td>
                      <td className="text-right py-1.5 align-top font-bold">{fmt(subtotal)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </section>

          {orcamento.observacao && (
            <section className="mb-4 text-xs">
              <h3 className="font-bold">OBSERVAÇÕES:</h3>
              <p className="whitespace-pre-wrap">{orcamento.observacao}</p>
            </section>
          )}

          <div className="flex justify-end mb-6">
            <div className="w-2/5 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span><span>{fmt(subtotal)}</span>
              </div>
              {orcamento.desconto > 0 && (
                <div className="flex justify-between">
                  <span>Desconto:</span><span className="text-red-600">-{fmt(orcamento.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
                <span>TOTAL:</span><span>{fmt(orcamento.total)}</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t-2 border-black pt-4 px-8 pb-8 grid grid-cols-2 gap-8">
          <div>
            {orcamento.plano && (
              <>
                <h3 className="font-bold mb-2 uppercase">Condições de Pagamento:</h3>
                <p className="font-semibold">{orcamento.plano}</p>
                {orcamento.installments_count && orcamento.installments_count > 1 && (
                  <p className="mt-1">{orcamento.installments_count}x de {fmt(orcamento.total / orcamento.installments_count)}</p>
                )}
              </>
            )}
          </div>
          {isPix && settings?.pix_qrcode_url && (
            <div className="flex flex-col items-center">
              <h3 className="font-bold mb-2">Pague com PIX</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.pix_qrcode_url} alt="QR Code PIX" className="h-24 w-24 object-contain" crossOrigin="anonymous" />
              {settings.pix_chave && <p className="mt-1 text-[10px]">Chave: {settings.pix_chave}</p>}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
