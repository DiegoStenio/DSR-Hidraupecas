"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Briefcase, Phone } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { vendedores as seed, type Vendedor } from "@/lib/mock-data";
import { toast } from "sonner";

export default function VendedoresPage() {
  const [list, setList] = useState<Vendedor[]>(seed);
  const [editing, setEditing] = useState<Vendedor | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Vendedor | null>(null);

  return (
    <div className="space-y-6 max-w-[1000px]">
      <PageHeader
        title="Vendedores"
        subtitle={`${list.length} vendedores ativos`}
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" />Adicionar vendedor
          </Button>
        }
      />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <h3 className="mt-3 font-semibold text-foreground">Nenhum vendedor cadastrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro membro da equipe comercial.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map(v => (
            <div key={v.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-semibold">
                {v.nome.split(" ").map(p => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground truncate">{v.nome}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3 w-3" />{v.whatsapp}
                </div>
              </div>
              <div className="flex shrink-0">
                <Button size="icon" variant="ghost" onClick={() => setEditing(v)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleting(v)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <VendedorForm
        open={creating || editing !== null}
        vendedor={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={(v) => {
          if (editing) setList(l => l.map(x => x.id === editing.id ? v : x));
          else setList(l => [{ ...v, id: `v${Date.now()}` }, ...l]);
          toast.success(editing ? "Atualizado" : "Adicionado");
          setCreating(false); setEditing(null);
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vendedor?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.nome} será removido. Não pode ser desfeito.</AlertDialogDescription>
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

function VendedorForm({
  open, vendedor, onClose, onSave,
}: { open: boolean; vendedor: Vendedor | null; onClose: () => void; onSave: (v: Vendedor) => void }) {
  const [nome, setNome] = useState(vendedor?.nome ?? "");
  const [whatsapp, setWhatsapp] = useState(vendedor?.whatsapp ?? "");
  useState(() => { if (vendedor) { setNome(vendedor.nome); setWhatsapp(vendedor.whatsapp); } });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{vendedor ? "Editar vendedor" : "Novo vendedor"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ id: vendedor?.id ?? "", nome, whatsapp })} className="bg-primary hover:bg-[var(--primary-hover)]">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
