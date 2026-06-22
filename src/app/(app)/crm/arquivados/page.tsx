"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Archive, RotateCcw, Wrench, Phone, Mail } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadEtapa } from "@/lib/supabase/types";
import { toast } from "sonner";

type FiltroTipo = "todos" | "cliente" | "parceiro";

export default function LeadsArquivadosPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [etapas, setEtapas] = useState<LeadEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");

  useEffect(() => {
    Promise.all([
      supabase.from("leads").select("*").eq("arquivado", true).order("created_at", { ascending: false }),
      supabase.from("lead_etapas").select("*").order("ordem", { ascending: true }),
    ]).then(([ld, et]) => {
      if (ld.error) toast.error("Erro ao carregar leads arquivados", { description: ld.error.message });
      if (et.error) toast.error("Erro ao carregar etapas", { description: et.error.message });
      setLeads(ld.data ?? []);
      setEtapas(et.data ?? []);
      setLoading(false);
    });
  }, [supabase]);

  const etapasArquivantes = useMemo(() => etapas.filter((e) => e.arquiva), [etapas]);
  const etapaNome = (id: string) => etapas.find((e) => e.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    const s = q.toLowerCase();
    return leads.filter((l) => {
      const matchQ = !s || l.empresa.toLowerCase().includes(s) || (l.contato ?? "").toLowerCase().includes(s) || (l.telefone ?? "").includes(s);
      const matchTipo = filtroTipo === "todos" || l.tipo_negocio === filtroTipo;
      const matchEtapa = filtroEtapa === "todas" || l.etapa_id === filtroEtapa;
      return matchQ && matchTipo && matchEtapa;
    });
  }, [leads, q, filtroTipo, filtroEtapa]);

  const reabrir = async (lead: Lead) => {
    const { error } = await supabase.from("leads").update({ arquivado: false }).eq("id", lead.id);
    if (error) { toast.error("Erro ao reabrir lead", { description: error.message }); return; }
    setLeads((ls) => ls.filter((l) => l.id !== lead.id));
    toast.success(`"${lead.empresa}" reaberto no pipeline ativo.`);
  };

  return (
    <div className="space-y-6 max-w-[1300px]">
      <div>
        <Link href="/crm" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Voltar pro CRM
        </Link>
        <PageHeader
          title="Leads arquivados"
          subtitle={loading ? "Carregando…" : `${filtrados.length} de ${leads.length} atendimento(s) finalizado(s)`}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por empresa, contato ou telefone…"
            className="pl-10 bg-card border-border h-11"
          />
        </div>
        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
        >
          <option value="todas">Todas as etapas</option>
          {etapasArquivantes.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-muted w-fit">
        {([
          { v: "todos" as const, label: "Todos" },
          { v: "cliente" as const, label: "Clientes" },
          { v: "parceiro" as const, label: "Parceiros" },
        ]).map((opt) => (
          <button
            key={opt.v}
            onClick={() => setFiltroTipo(opt.v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroTipo === opt.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted">
            <Archive className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">Nenhum lead arquivado por aqui</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length === 0 ? "Atendimentos finalizados no CRM aparecem aqui." : "Nenhum resultado para os filtros aplicados."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Empresa</th>
                  <th className="text-left px-5 py-3 font-medium">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium">Etapa</th>
                  <th className="text-left px-5 py-3 font-medium">Contato</th>
                  <th className="text-right px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => (
                  <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground truncate">{l.empresa}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.categoria}</div>
                    </td>
                    <td className="px-5 py-4">
                      {l.tipo_negocio ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                          l.tipo_negocio === "parceiro"
                            ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                            : "bg-sky-500/10 text-sky-600 border-sky-500/20"
                        }`}>
                          {l.tipo_negocio === "parceiro" && <Wrench className="h-2.5 w-2.5" />}
                          {l.tipo_negocio === "parceiro" ? "Parceiro" : "Cliente"}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-4 text-foreground">{etapaNome(l.etapa_id)}</td>
                    <td className="px-5 py-4">
                      <div className="text-foreground">{l.contato ?? "—"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                        {l.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{l.telefone}</span>}
                        {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => reabrir(l)}>
                        <RotateCcw className="h-3.5 w-3.5" />Reabrir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtrados.map((l) => (
              <div key={l.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{l.empresa}</div>
                    <div className="text-xs text-muted-foreground">{etapaNome(l.etapa_id)} · {l.categoria}</div>
                  </div>
                  {l.tipo_negocio && (
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                      l.tipo_negocio === "parceiro"
                        ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                        : "bg-sky-500/10 text-sky-600 border-sky-500/20"
                    }`}>
                      {l.tipo_negocio === "parceiro" ? "Parceiro" : "Cliente"}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{l.telefone}</div>
                <Button size="sm" variant="outline" className="mt-3 w-full gap-1.5" onClick={() => reabrir(l)}>
                  <RotateCcw className="h-3.5 w-3.5" />Reabrir
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
