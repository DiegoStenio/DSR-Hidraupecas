"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Send, Download, Pencil, Trash2, Search, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { Orcamento } from "@/lib/supabase/types";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_OPCOES = ["pendente", "aprovado", "realizado"] as const;

const STATUS_CLS: Record<Orcamento["status"], string> = {
  pendente: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  aprovado: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  realizado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

function StatusMenu({ status, onChange }: { status: Orcamento["status"]; onChange: (s: Orcamento["status"]) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-medium border transition-opacity hover:opacity-80 ${STATUS_CLS[status]}`}>
          {status}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {STATUS_OPCOES.map((s) => (
          <DropdownMenuItem key={s} disabled={s === status} onClick={() => onChange(s)} className="capitalize">
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function OrcamentosPage() {
  const supabase = createClient();
  const [list, setList] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | Orcamento["status"]>("todos");

  useEffect(() => {
    supabase
      .from("orcamentos")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar orçamentos", { description: error.message });
        else setList(data ?? []);
        setLoading(false);
      });
  }, [supabase]);

  const filtered = useMemo(() => {
    return list.filter(o => {
      const matchQ = !q || o.cliente_nome.toLowerCase().includes(q.toLowerCase()) || o.numero.includes(q);
      const matchF = filter === "todos" || o.status === filter;
      return matchQ && matchF;
    });
  }, [list, q, filter]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir", { description: error.message }); return; }
    setList(l => l.filter(x => x.id !== id));
    toast.success("Excluído");
  };

  const handleStatusChange = async (id: string, status: Orcamento["status"]) => {
    const { error } = await supabase.from("orcamentos").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status", { description: error.message }); return; }
    setList(l => l.map(o => o.id === id ? { ...o, status } : o));
    toast.success(`Status atualizado para "${status}"`);
  };

  const handleSendWhatsapp = async (o: Orcamento) => {
    if (!o.vendedor_id) { toast.error("Vendedor não vinculado a este orçamento."); return; }
    const { data: vendedor } = await supabase.from("vendedores").select("*").eq("id", o.vendedor_id).single();
    if (!vendedor?.whatsapp) {
      toast.error("Número do WhatsApp não encontrado", { description: "O vendedor selecionado não possui WhatsApp cadastrado." });
      return;
    }
    const message = encodeURIComponent(`Olá ${o.cliente_nome}, aqui está seu orçamento #${o.numero} com um total de ${fmt(o.total)}. Por favor me avise se tiver alguma dúvida.`);
    window.open(`https://wa.me/${vendedor.whatsapp.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-[1300px]">
      <PageHeader
        title="Orçamentos"
        subtitle={loading ? "Carregando…" : `${list.length} orçamentos · ${list.filter(o => o.status === "pendente").length} pendentes`}
        actions={
          <Button asChild className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Link href="/orcamentos/novo"><Plus className="h-4 w-4" /> Novo orçamento</Link>
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente ou número…" className="pl-10 h-11" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {(["todos", ...STATUS_OPCOES] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <h3 className="mt-3 font-semibold text-foreground">Nenhum orçamento encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou crie um novo.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Nº</th>
                  <th className="text-left px-5 py-3 font-medium">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium">Vendedor</th>
                  <th className="text-left px-5 py-3 font-medium">Data</th>
                  <th className="text-right px-5 py-3 font-medium">Valor</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{o.numero}</td>
                    <td className="px-5 py-4 font-medium text-foreground">{o.cliente_nome}</td>
                    <td className="px-5 py-4 text-muted-foreground">{o.vendedor_nome}</td>
                    <td className="px-5 py-4 text-muted-foreground">{o.data}</td>
                    <td className="px-5 py-4 text-right font-display font-semibold tabular-nums">{fmt(o.total)}</td>
                    <td className="px-5 py-4 text-center">
                      <StatusMenu status={o.status} onChange={(s) => handleStatusChange(o.id, s)} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button size="icon" variant="ghost" asChild>
                        <Link href={`/orcamentos/novo?id=${o.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" asChild>
                        <Link href={`/orcamentos/${o.id}/imprimir`}><Download className="h-4 w-4" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleSendWhatsapp(o)} className="text-emerald-600">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(o.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map(o => (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-muted-foreground">{o.numero}</div>
                    <div className="font-medium text-foreground truncate">{o.cliente_nome}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.vendedor_nome} · {o.data}</div>
                  </div>
                  <StatusMenu status={o.status} onChange={(s) => handleStatusChange(o.id, s)} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-display text-xl font-semibold">{fmt(o.total)}</div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/orcamentos/novo?id=${o.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/orcamentos/${o.id}/imprimir`}><Download className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleSendWhatsapp(o)} className="text-emerald-600"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
