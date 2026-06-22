"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Building2, User, Sparkles, AlertTriangle, TrendingUp, FileText, Pencil, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Orcamento } from "@/lib/supabase/types";
import { toast } from "sonner";

type ClienteForm = {
  id?: string;
  tipo: "PF" | "PJ";
  nome: string;
  nome_fantasia: string;
  documento: string;
  ie_rg: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
};

const emptyForm: ClienteForm = {
  tipo: "PJ", nome: "", nome_fantasia: "", documento: "", ie_rg: "", telefone: "", email: "",
  cep: "", logradouro: "", numero: "", bairro: "", cidade: "", estado: "", observacoes: "",
};

export default function ClientesPage() {
  const supabase = createClient();
  const [list, setList] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);

  useEffect(() => {
    supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar clientes", { description: error.message });
        else setList(data ?? []);
        setLoading(false);
      });
  }, [supabase]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return list.filter(c =>
      c.nome.toLowerCase().includes(s) ||
      c.documento.toLowerCase().includes(s) ||
      (c.telefone ?? "").includes(s)
    );
  }, [list, q]);

  const handleSave = async (form: ClienteForm) => {
    const payload = {
      tipo: form.tipo, nome: form.nome, nome_fantasia: form.nome_fantasia || null,
      documento: form.documento, ie_rg: form.ie_rg || null, telefone: form.telefone,
      email: form.email, cep: form.cep || null, logradouro: form.logradouro || null,
      numero: form.numero || null, bairro: form.bairro || null, cidade: form.cidade, estado: form.estado,
      observacoes: form.observacoes,
    };
    if (form.id) {
      const { data, error } = await supabase.from("clientes").update(payload).eq("id", form.id).select().single();
      if (error) { toast.error("Erro ao atualizar", { description: error.message }); return; }
      setList(l => l.map(x => x.id === form.id ? data : x));
      toast.success("Cliente atualizado");
    } else {
      const { data, error } = await supabase.from("clientes").insert(payload).select().single();
      if (error) { toast.error("Erro ao criar", { description: error.message }); return; }
      setList(l => [data, ...l]);
      toast.success("Cliente criado");
    }
    setCreating(false); setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("clientes").delete().eq("id", deleting.id);
    if (error) { toast.error("Erro ao excluir", { description: error.message }); setDeleting(null); return; }
    setList(l => l.filter(c => c.id !== deleting.id));
    toast.success("Cliente excluído");
    setDeleting(null);
  };

  return (
    <div className="space-y-6 max-w-[1300px]">
      <PageHeader
        title="Clientes"
        subtitle={loading ? "Carregando…" : `${list.length} cadastrados · busque por nome, CPF/CNPJ ou telefone`}
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" /> Adicionar cliente
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <Input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar clientes…"
          className="pl-10 bg-card border-border h-11"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setCreating(true)} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium">Documento</th>
                  <th className="text-left px-5 py-3 font-medium">Telefone</th>
                  <th className="text-left px-5 py-3 font-medium">Cidade</th>
                  <th className="text-right px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setViewing(c)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                          {c.tipo === "PJ" ? <Building2 className="h-4 w-4" strokeWidth={1.5}/> : <User className="h-4 w-4" strokeWidth={1.5}/>}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{c.nome}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.nome_fantasia || c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground">{c.documento}</td>
                    <td className="px-5 py-4 text-foreground">{c.telefone}</td>
                    <td className="px-5 py-4 text-muted-foreground">{c.cidade}/{c.estado}</td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(c)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setViewing(c)} className="w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
                    {c.tipo === "PJ" ? <Building2 className="h-4 w-4"/> : <User className="h-4 w-4"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">{c.documento}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span className="text-foreground">{c.telefone}</span></div>
                  <div className="text-right">{c.cidade}/{c.estado}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <ClienteFormDialog
        open={creating || editing !== null}
        cliente={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={handleSave}
      />

      <ClienteViewDialog
        cliente={viewing}
        onClose={() => setViewing(null)}
        onAnalisado={(updated) => {
          setList((l) => l.map((c) => (c.id === updated.id ? updated : c)));
          setViewing(updated);
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.nome} será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted">
        <User className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="mt-3 font-semibold text-foreground">Nenhum cliente por aqui</h3>
      <p className="mt-1 text-sm text-muted-foreground">Comece cadastrando seu primeiro cliente.</p>
      <Button onClick={onAdd} className="mt-4 gap-2"><Plus className="h-4 w-4" />Adicionar cliente</Button>
    </div>
  );
}

function ClienteFormDialog({
  open, cliente, onClose, onSave,
}: { open: boolean; cliente: Cliente | null; onClose: () => void; onSave: (c: ClienteForm) => void }) {
  const [form, setForm] = useState<ClienteForm>(emptyForm);

  useEffect(() => {
    if (cliente) {
      setForm({
        id: cliente.id, tipo: cliente.tipo, nome: cliente.nome, nome_fantasia: cliente.nome_fantasia ?? "",
        documento: cliente.documento, ie_rg: cliente.ie_rg ?? "",
        telefone: cliente.telefone ?? "", email: cliente.email ?? "",
        cep: cliente.cep ?? "", logradouro: cliente.logradouro ?? "", numero: cliente.numero ?? "",
        bairro: cliente.bairro ?? "", cidade: cliente.cidade ?? "",
        estado: cliente.estado ?? "", observacoes: cliente.observacoes ?? "",
      });
    } else if (open) {
      setForm(emptyForm);
    }
  }, [cliente, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>Preencha os dados principais e o endereço.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex gap-2 p-1 rounded-xl bg-muted w-fit">
            {(["PJ", "PF"] as const).map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, tipo: t }))}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  form.tipo === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>{form.tipo === "PJ" ? "Razão social" : "Nome completo"}</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Nome fantasia</Label>
              <Input
                value={form.nome_fantasia}
                onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                disabled={form.tipo === "PF"}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{form.tipo === "PJ" ? "CNPJ" : "CPF"}</Label>
              <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>{form.tipo === "PJ" ? "Inscrição estadual" : "RG"}</Label>
              <Input value={form.ie_rg} onChange={(e) => setForm({ ...form, ie_rg: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-semibold text-foreground">Endereço</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Logradouro</Label>
                <Input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label>Número</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Estado</Label>
                <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Observações</Label>
            <Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(form)} className="bg-primary hover:bg-[var(--primary-hover)]">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClienteViewDialog({
  cliente, onClose, onAnalisado,
}: { cliente: Cliente | null; onClose: () => void; onAnalisado: (cliente: Cliente) => void }) {
  const supabase = createClient();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loadingOrc, setLoadingOrc] = useState(false);
  const [analisando, setAnalisando] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    setLoadingOrc(true);
    supabase
      .from("orcamentos")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("data", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar orçamentos do cliente", { description: error.message });
        else setOrcamentos(data ?? []);
        setLoadingOrc(false);
      });
  }, [cliente, supabase]);

  const gerarAnalise = async () => {
    if (!cliente) return;
    setAnalisando(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/analisar`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error("Erro ao gerar análise", { description: json.error }); return; }
      onAnalisado(json.cliente);
      toast.success("Análise gerada");
    } catch (err) {
      toast.error("Erro ao gerar análise", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setAnalisando(false);
    }
  };

  if (!cliente) return null;
  const risco = {
    baixo: { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Baixo risco" },
    medio: { cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Risco médio" },
    alto:  { cls: "bg-rose-500/10 text-rose-600 border-rose-500/20", label: "Alto risco" },
  }[cliente.ia_risco];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {cliente.tipo === "PJ" ? <Building2 className="h-4 w-4"/> : <User className="h-4 w-4"/>}
            {cliente.nome}
          </DialogTitle>
          <DialogDescription>{cliente.documento} · {cliente.cidade}/{cliente.estado}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="dados" className="mt-2">
          <TabsList className="bg-muted">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="orcamentos">Orçamentos ({orcamentos.length})</TabsTrigger>
            <TabsTrigger value="ia" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />Análise de IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4 space-y-3 text-sm">
            {cliente.nome_fantasia && <Row k="Nome fantasia" v={cliente.nome_fantasia} />}
            <Row k={cliente.tipo === "PJ" ? "Inscrição estadual" : "RG"} v={cliente.ie_rg ?? "—"} />
            <Row k="Telefone" v={cliente.telefone ?? "—"} />
            <Row k="E-mail" v={cliente.email ?? "—"} />
            <Row k="Endereço" v={formatEndereco(cliente)} />
            {cliente.observacoes && <Row k="Observações" v={cliente.observacoes} />}
          </TabsContent>

          <TabsContent value="orcamentos" className="mt-4">
            {loadingOrc ? (
              <div className="space-y-2">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            ) : orcamentos.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <FileText className="h-6 w-6 mx-auto mb-2 opacity-60" />
                Nenhum orçamento ainda para este cliente.
              </div>
            ) : (
              <div className="space-y-2">
                {orcamentos.map(o => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{o.numero}</div>
                      <div className="text-xs text-muted-foreground">{o.data} · {o.vendedor_nome}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-semibold tabular-nums">
                        {o.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                      <div className={`text-[10px] uppercase tracking-wider ${
                        o.status === "realizado" ? "text-emerald-600" : o.status === "aprovado" ? "text-sky-600" : "text-amber-600"
                      }`}>
                        {o.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ia" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              {cliente.ia_resumo ? (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${risco.cls}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {risco.label} de perda
                </div>
              ) : <div />}
              <Button size="sm" variant="outline" className="gap-2" disabled={analisando} onClick={gerarAnalise}>
                {analisando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {cliente.ia_resumo ? "Atualizar análise" : "Gerar análise"}
              </Button>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Resumo do histórico</h4>
              <p className="text-sm text-foreground leading-relaxed">
                {cliente.ia_resumo ?? (analisando ? "Gerando análise com IA…" : "Ainda sem análise de IA gerada para este cliente.")}
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--gold)]" />Oportunidades de upsell
              </h4>
              {cliente.ia_upsell.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma sugestão gerada ainda.</p>
              ) : (
                <ul className="space-y-1.5">
                  {cliente.ia_upsell.map((u, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)] shrink-0" />
                      {u}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function formatEndereco(c: Cliente) {
  const parts = [c.logradouro, c.numero, c.bairro, c.cidade, c.estado, c.cep].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-border last:border-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="text-foreground">{v}</div>
    </div>
  );
}
