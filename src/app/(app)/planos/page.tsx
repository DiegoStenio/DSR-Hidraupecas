"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { PlanoPagamento } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function PlanosPage() {
  const supabase = createClient();
  const [list, setList] = useState<PlanoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlanoPagamento | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PlanoPagamento | null>(null);

  useEffect(() => {
    supabase
      .from("planos_pagamento")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar planos", { description: error.message });
        else setList(data ?? []);
        setLoading(false);
      });
  }, [supabase]);

  const handleSave = async (p: { id?: string; nome: string; descricao: string; parcelas: number }) => {
    if (p.id) {
      const { data, error } = await supabase
        .from("planos_pagamento").update({ nome: p.nome, descricao: p.descricao, parcelas: p.parcelas }).eq("id", p.id).select().single();
      if (error) { toast.error("Erro ao atualizar", { description: error.message }); return; }
      setList(l => l.map(x => x.id === p.id ? data : x));
      toast.success("Atualizado");
    } else {
      const { data, error } = await supabase
        .from("planos_pagamento").insert({ nome: p.nome, descricao: p.descricao, parcelas: p.parcelas }).select().single();
      if (error) { toast.error("Erro ao adicionar", { description: error.message }); return; }
      setList(l => [data, ...l]);
      toast.success("Adicionado");
    }
    setCreating(false); setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("planos_pagamento").delete().eq("id", deleting.id);
    if (error) { toast.error("Erro ao excluir", { description: error.message }); setDeleting(null); return; }
    setList(l => l.filter(x => x.id !== deleting.id));
    toast.success("Excluído");
    setDeleting(null);
  };

  return (
    <div className="space-y-6 max-w-[1000px]">
      <PageHeader
        title="Planos de pagamento"
        subtitle="Defina as condições oferecidas nos orçamentos."
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" />Novo plano
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <CreditCard className="h-8 w-8 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <h3 className="mt-3 font-semibold text-foreground">Nenhum plano cadastrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crie a primeira condição de pagamento.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map(p => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]">
                    <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.parcelas}x</div>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(p)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.descricao}</p>
            </div>
          ))}
        </div>
      )}

      <PlanoForm
        open={creating || editing !== null}
        plano={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.nome}" será removido. Não pode ser desfeito.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PlanoForm({
  open, plano, onClose, onSave,
}: { open: boolean; plano: PlanoPagamento | null; onClose: () => void; onSave: (p: { id?: string; nome: string; descricao: string; parcelas: number }) => void }) {
  const [nome, setNome] = useState(plano?.nome ?? "");
  const [descricao, setDescricao] = useState(plano?.descricao ?? "");
  const [parcelas, setParcelas] = useState(plano?.parcelas ?? 1);

  useEffect(() => {
    setNome(plano?.nome ?? "");
    setDescricao(plano?.descricao ?? "");
    setParcelas(plano?.parcelas ?? 1);
  }, [plano, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{plano ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5"><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Descrição</Label><Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Parcelas</Label><Input type="number" min={1} value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ id: plano?.id, nome, descricao, parcelas })} className="bg-primary hover:bg-[var(--primary-hover)]">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
