"use client";

import { useState } from "react";
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
import { planos as seed, type PlanoPagamento } from "@/lib/mock-data";
import { toast } from "sonner";

export default function PlanosPage() {
  const [list, setList] = useState<PlanoPagamento[]>(seed);
  const [editing, setEditing] = useState<PlanoPagamento | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PlanoPagamento | null>(null);

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

      <PlanoForm
        open={creating || editing !== null}
        plano={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={(p) => {
          if (editing) setList(l => l.map(x => x.id === editing.id ? p : x));
          else setList(l => [{ ...p, id: `p${Date.now()}` }, ...l]);
          toast.success(editing ? "Atualizado" : "Adicionado");
          setCreating(false); setEditing(null);
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.nome}" será removido. Não pode ser desfeito.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => {
              if (deleting) { setList(l => l.filter(x => x.id !== deleting.id)); toast.success("Excluído"); }
              setDeleting(null);
            }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PlanoForm({
  open, plano, onClose, onSave,
}: { open: boolean; plano: PlanoPagamento | null; onClose: () => void; onSave: (p: PlanoPagamento) => void }) {
  const [nome, setNome] = useState(plano?.nome ?? "");
  const [descricao, setDescricao] = useState(plano?.descricao ?? "");
  const [parcelas, setParcelas] = useState(plano?.parcelas ?? 1);

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
          <Button onClick={() => onSave({ id: plano?.id ?? "", nome, descricao, parcelas })} className="bg-primary hover:bg-[var(--primary-hover)]">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
