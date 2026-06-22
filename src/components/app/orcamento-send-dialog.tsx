"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, Loader2, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, CompanySettings, Orcamento, PlanoPagamento, Vendedor } from "@/lib/supabase/types";
import { OrcamentoPrintable, fmtMoeda } from "@/components/app/orcamento-printable";
import { gerarOrcamentoPdfBlob, uploadOrcamentoPdf, urlWhatsapp } from "@/lib/orcamento-pdf";
import { toast } from "sonner";

type Props = {
  orcamentoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrcamentoSendDialog({ orcamentoId, open, onOpenChange }: Props) {
  const supabase = createClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [plano, setPlano] = useState<PlanoPagamento | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingPara, setSendingPara] = useState<"cliente" | "vendedor" | null>(null);

  useEffect(() => {
    if (!open || !orcamentoId) { setOrcamento(null); return; }
    setLoading(true);
    (async () => {
      const { data: o, error } = await supabase.from("orcamentos").select("*").eq("id", orcamentoId).single();
      if (error || !o) { toast.error("Erro ao carregar orçamento"); setLoading(false); return; }
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
  }, [open, orcamentoId, supabase]);

  const handleEnviar = (destino: "cliente" | "vendedor") => {
    if (!orcamento) return;
    const telefone = destino === "cliente" ? cliente?.telefone : vendedor?.whatsapp;
    if (!telefone) {
      toast.error(destino === "cliente" ? "Cliente sem telefone cadastrado." : "Vendedor sem WhatsApp cadastrado.");
      return;
    }
    if (!printRef.current) return;

    // Precisa abrir a janela aqui, de forma síncrona dentro do clique, senão
    // navegadores mobile (Safari/Chrome iOS) bloqueiam o popup já que o PDF
    // é gerado de forma assíncrona (await) antes do window.open.
    const janela = window.open("", "_blank");

    setSendingPara(destino);
    (async () => {
      try {
        const blob = await gerarOrcamentoPdfBlob(printRef.current!);
        const url = await uploadOrcamentoPdf(supabase, orcamento.numero, blob);
        const mensagem = destino === "cliente"
          ? `Olá ${orcamento.cliente_nome}, aqui está seu orçamento #${orcamento.numero} com total de ${fmtMoeda(orcamento.total)}. Baixe o PDF: ${url}`
          : `Orçamento #${orcamento.numero} (${orcamento.cliente_nome}) — total de ${fmtMoeda(orcamento.total)}. PDF: ${url}`;
        const waUrl = urlWhatsapp(telefone, mensagem);
        if (janela) janela.location.href = waUrl;
        else window.open(waUrl, "_blank");
        onOpenChange(false);
      } catch (err) {
        janela?.close();
        toast.error("Erro ao gerar/enviar PDF", { description: err instanceof Error ? err.message : undefined });
      } finally {
        setSendingPara(null);
      }
    })();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar orçamento por WhatsApp</DialogTitle>
            <DialogDescription>
              {orcamento ? `Orçamento ${orcamento.numero} · ${orcamento.cliente_nome}` : "Carregando…"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              disabled={loading || sendingPara !== null}
              onClick={() => handleEnviar("vendedor")}
            >
              {sendingPara === "vendedor" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Briefcase className="h-5 w-5 shrink-0" />}
              <div className="text-left">
                <div className="font-medium">Enviar para o vendedor</div>
                <div className="text-xs text-muted-foreground">
                  {orcamento?.vendedor_nome}{vendedor?.whatsapp ? ` · ${vendedor.whatsapp}` : " · sem WhatsApp cadastrado"}
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              disabled={loading || sendingPara !== null}
              onClick={() => handleEnviar("cliente")}
            >
              {sendingPara === "cliente" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <User className="h-5 w-5 shrink-0" />}
              <div className="text-left">
                <div className="font-medium">Enviar para o cliente</div>
                <div className="text-xs text-muted-foreground">
                  {orcamento?.cliente_nome}{cliente?.telefone ? ` · ${cliente.telefone}` : " · sem telefone cadastrado"}
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {orcamento && (
        <div style={{ position: "fixed", top: 0, left: "-9999px" }} aria-hidden>
          <OrcamentoPrintable ref={printRef} orcamento={orcamento} cliente={cliente} vendedor={vendedor} settings={settings} plano={plano} />
        </div>
      )}
    </>
  );
}
