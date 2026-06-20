"use client";

import { useMemo, useState } from "react";
import { Plus, FileText, Send, Download, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  orcamentos as seed, clientes, vendedores, planos, type Orcamento,
} from "@/lib/mock-data";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function OrcamentosPage() {
  const [list, setList] = useState<Orcamento[]>(seed);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "pendente" | "realizado">("todos");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return list.filter(o => {
      const matchQ = !q || o.clienteNome.toLowerCase().includes(q.toLowerCase()) || o.numero.includes(q);
      const matchF = filter === "todos" || o.status === filter;
      return matchQ && matchF;
    });
  }, [list, q, filter]);

  return (
    <div className="space-y-6 max-w-[1300px]">
      <PageHeader
        title="Orçamentos"
        subtitle={`${list.length} orçamentos · ${list.filter(o => o.status === "pendente").length} pendentes`}
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" /> Novo orçamento
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente ou número…" className="pl-10 h-11" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {(["todos", "pendente", "realizado"] as const).map(s => (
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

      {filtered.length === 0 ? (
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
                    <td className="px-5 py-4 font-medium text-foreground">{o.clienteNome}</td>
                    <td className="px-5 py-4 text-muted-foreground">{o.vendedorNome}</td>
                    <td className="px-5 py-4 text-muted-foreground">{o.data}</td>
                    <td className="px-5 py-4 text-right font-display font-semibold tabular-nums">{fmt(o.total)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-medium border ${
                        o.status === "realizado"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button size="icon" variant="ghost" onClick={() => toast.success("PDF gerado")}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => toast.success("Enviado via WhatsApp")} className="text-emerald-600">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setList(l => l.filter(x => x.id !== o.id)); toast.success("Excluído"); }} className="text-destructive">
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
                    <div className="font-medium text-foreground truncate">{o.clienteNome}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.vendedorNome} · {o.data}</div>
                  </div>
                  <span className={`inline-flex text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-medium border ${
                    o.status === "realizado" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}>{o.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-display text-xl font-semibold">{fmt(o.total)}</div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toast.success("PDF gerado")}><Download className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => toast.success("Enviado")} className="text-emerald-600"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <NovoOrcamentoDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(o) => { setList(l => [o, ...l]); toast.success("Orçamento criado"); setCreating(false); }}
      />
    </div>
  );
}

function NovoOrcamentoDialog({
  open, onClose, onSave,
}: { open: boolean; onClose: () => void; onSave: (o: Orcamento) => void }) {
  const [clienteId, setClienteId] = useState(clientes[0].id);
  const [vendedorId, setVendedorId] = useState(vendedores[0].id);
  const [plano, setPlano] = useState(planos[0].nome);
  const [desconto, setDesconto] = useState(0);
  const [itens, setItens] = useState([{ descricao: "", qtd: 1, valor: 0 }]);

  const subtotal = itens.reduce((s, i) => s + i.qtd * i.valor, 0);
  const total = Math.max(0, subtotal - desconto);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo orçamento</DialogTitle>
          <DialogDescription>Adicione itens e configure as condições de pagamento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Vendedor</Label>
              <Select value={vendedorId} onValueChange={setVendedorId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Itens</Label>
            <div className="space-y-2">
              {itens.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_70px_110px_40px] gap-2 items-end">
                  <Input
                    placeholder="Descrição"
                    value={it.descricao}
                    onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, descricao: e.target.value } : x))}
                  />
                  <Input
                    type="number" placeholder="Qtd" value={it.qtd}
                    onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, qtd: Number(e.target.value) } : x))}
                  />
                  <Input
                    type="number" placeholder="Valor" value={it.valor}
                    onChange={(e) => setItens(itens.map((x, i) => i === idx ? { ...x, valor: Number(e.target.value) } : x))}
                  />
                  <Button size="icon" variant="ghost" onClick={() => setItens(itens.filter((_, i) => i !== idx))} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => setItens([...itens, { descricao: "", qtd: 1, valor: 0 }])}>
              <Plus className="h-3.5 w-3.5" /> Adicionar item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Plano de pagamento</Label>
              <Select value={plano} onValueChange={setPlano}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {planos.map(p => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Desconto (R$)</Label>
              <Input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-5 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
              <div className="text-xs text-muted-foreground mt-0.5">Subtotal {fmt(subtotal)} · desconto {fmt(desconto)}</div>
            </div>
            <div className="font-display text-4xl font-semibold tabular-nums text-foreground">
              {fmt(total)}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" className="gap-2" onClick={() => toast.success("PDF gerado")}>
            <Download className="h-4 w-4" />Gerar PDF
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              const cli = clientes.find(c => c.id === clienteId)!;
              const ven = vendedores.find(v => v.id === vendedorId)!;
              onSave({
                id: `o${Date.now()}`,
                numero: `ORC-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                clienteId, clienteNome: cli.nome,
                vendedorId, vendedorNome: ven.nome,
                total, status: "pendente",
                data: new Date().toISOString().slice(0, 10),
                plano, itens,
              });
            }}
          >
            <Send className="h-4 w-4" />Enviar WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
