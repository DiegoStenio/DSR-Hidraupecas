"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Building2, User, Wrench, Pencil, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Prestador } from "@/lib/supabase/types";
import { toast } from "sonner";

type PrestadorForm = {
  id?: string;
  tipo: "PF" | "PJ";
  nome: string;
  nome_fantasia: string;
  documento: string;
  ie_rg: string;
  especialidade: string;
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

const emptyForm: PrestadorForm = {
  tipo: "PJ", nome: "", nome_fantasia: "", documento: "", ie_rg: "", especialidade: "",
  telefone: "", email: "", cep: "", logradouro: "", numero: "", bairro: "", cidade: "", estado: "", observacoes: "",
};

export default function PrestadoresPage() {
  const supabase = createClient();
  const [list, setList] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Prestador | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Prestador | null>(null);
  const [deleting, setDeleting] = useState<Prestador | null>(null);

  useEffect(() => {
    supabase
      .from("prestadores")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar prestadores", { description: error.message });
        else setList(data ?? []);
        setLoading(false);
      });
  }, [supabase]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return list.filter((p) =>
      p.nome.toLowerCase().includes(s) ||
      p.documento.toLowerCase().includes(s) ||
      (p.telefone ?? "").includes(s) ||
      (p.especialidade ?? "").toLowerCase().includes(s)
    );
  }, [list, q]);

  const handleSave = async (form: PrestadorForm) => {
    const payload = {
      tipo: form.tipo, nome: form.nome, nome_fantasia: form.nome_fantasia || null,
      documento: form.documento, ie_rg: form.ie_rg || null, especialidade: form.especialidade || null,
      telefone: form.telefone || null, email: form.email || null, cep: form.cep || null,
      logradouro: form.logradouro || null, numero: form.numero || null, bairro: form.bairro || null,
      cidade: form.cidade || null, estado: form.estado || null, observacoes: form.observacoes || null,
    };
    if (form.id) {
      const { data, error } = await supabase.from("prestadores").update(payload).eq("id", form.id).select().single();
      if (error) { toast.error("Erro ao atualizar", { description: error.message }); return; }
      setList((l) => l.map((x) => (x.id === form.id ? data : x)));
      toast.success("Prestador atualizado");
    } else {
      const { data, error } = await supabase.from("prestadores").insert(payload).select().single();
      if (error) { toast.error("Erro ao criar", { description: error.message }); return; }
      setList((l) => [data, ...l]);
      toast.success("Prestador criado");
    }
    setCreating(false); setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("prestadores").delete().eq("id", deleting.id);
    if (error) { toast.error("Erro ao excluir", { description: error.message }); setDeleting(null); return; }
    setList((l) => l.filter((p) => p.id !== deleting.id));
    toast.success("Prestador excluído");
    setDeleting(null);
  };

  return (
    <div className="space-y-6 max-w-[1300px]">
      <PageHeader
        title="Prestadores de serviço"
        subtitle={loading ? "Carregando…" : `${list.length} cadastrados · quem arruma a peça do cliente`}
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" /> Adicionar prestador
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <Input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar prestadores…"
          className="pl-10 bg-card border-border h-11"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setCreating(true)} />
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Prestador</th>
                  <th className="text-left px-5 py-3 font-medium">Especialidade</th>
                  <th className="text-left px-5 py-3 font-medium">Telefone</th>
                  <th className="text-left px-5 py-3 font-medium">Cidade</th>
                  <th className="text-right px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setViewing(p)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                          <Wrench className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{p.nome}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.nome_fantasia || p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground">{p.especialidade || "—"}</td>
                    <td className="px-5 py-4 text-foreground">{p.telefone}</td>
                    <td className="px-5 py-4 text-muted-foreground">{[p.cidade, p.estado].filter(Boolean).join("/") || "—"}</td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(p)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setViewing(p)} className="w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.especialidade || p.documento}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span className="text-foreground">{p.telefone}</span></div>
                  <div className="text-right">{[p.cidade, p.estado].filter(Boolean).join("/") || "—"}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <PrestadorFormDialog
        open={creating || editing !== null}
        prestador={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={handleSave}
      />

      <PrestadorViewDialog prestador={viewing} onClose={() => setViewing(null)} />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prestador?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.nome} será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
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
        <Wrench className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="mt-3 font-semibold text-foreground">Nenhum prestador por aqui</h3>
      <p className="mt-1 text-sm text-muted-foreground">Cadastre os parceiros que arrumam as peças dos seus clientes.</p>
      <Button onClick={onAdd} className="mt-4 gap-2"><Plus className="h-4 w-4" />Adicionar prestador</Button>
    </div>
  );
}

function PrestadorFormDialog({
  open, prestador, onClose, onSave,
}: { open: boolean; prestador: Prestador | null; onClose: () => void; onSave: (p: PrestadorForm) => void }) {
  const [form, setForm] = useState<PrestadorForm>(emptyForm);

  useEffect(() => {
    if (prestador) {
      setForm({
        id: prestador.id, tipo: prestador.tipo, nome: prestador.nome, nome_fantasia: prestador.nome_fantasia ?? "",
        documento: prestador.documento, ie_rg: prestador.ie_rg ?? "", especialidade: prestador.especialidade ?? "",
        telefone: prestador.telefone ?? "", email: prestador.email ?? "",
        cep: prestador.cep ?? "", logradouro: prestador.logradouro ?? "", numero: prestador.numero ?? "",
        bairro: prestador.bairro ?? "", cidade: prestador.cidade ?? "",
        estado: prestador.estado ?? "", observacoes: prestador.observacoes ?? "",
      });
    } else if (open) {
      setForm(emptyForm);
    }
  }, [prestador, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prestador ? "Editar prestador" : "Novo prestador"}</DialogTitle>
          <DialogDescription>Preencha os dados do parceiro e a especialidade dele.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex gap-2 p-1 rounded-xl bg-muted w-fit">
            {(["PJ", "PF"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, tipo: t }))}
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
            <div className="grid gap-1.5 md:col-span-2">
              <Label>Especialidade</Label>
              <Input
                placeholder="Ex: Reparo de cilindros hidráulicos, mangueiras, bombas…"
                value={form.especialidade}
                onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
              />
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

function PrestadorViewDialog({ prestador, onClose }: { prestador: Prestador | null; onClose: () => void }) {
  if (!prestador) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {prestador.tipo === "PJ" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {prestador.nome}
          </DialogTitle>
          <DialogDescription>{prestador.documento} · {[prestador.cidade, prestador.estado].filter(Boolean).join("/") || "—"}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-3 text-sm">
          {prestador.nome_fantasia && <Row k="Nome fantasia" v={prestador.nome_fantasia} />}
          {prestador.especialidade && <Row k="Especialidade" v={prestador.especialidade} />}
          <Row k={prestador.tipo === "PJ" ? "Inscrição estadual" : "RG"} v={prestador.ie_rg ?? "—"} />
          <Row k="Telefone" v={prestador.telefone ?? "—"} />
          <Row k="E-mail" v={prestador.email ?? "—"} />
          <Row k="Endereço" v={formatEndereco(prestador)} />
          {prestador.observacoes && <Row k="Observações" v={prestador.observacoes} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatEndereco(p: Prestador) {
  const parts = [p.logradouro, p.numero, p.bairro, p.cidade, p.estado, p.cep].filter(Boolean);
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
