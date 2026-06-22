"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Briefcase, Phone, Wrench } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Prestador, Vendedor } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function VendedoresPage() {
  const supabase = createClient();
  const [list, setList] = useState<Vendedor[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vendedor | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Vendedor | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("vendedores").select("*").order("created_at", { ascending: false }),
      supabase.from("prestadores").select("*").order("nome"),
    ]).then(([v, p]) => {
      if (v.error) toast.error("Erro ao carregar vendedores", { description: v.error.message });
      else setList(v.data ?? []);
      setPrestadores(p.data ?? []);
      setLoading(false);
    });
  }, [supabase]);

  const handleSave = async (v: { id?: string; nome: string; whatsapp: string; prestadorIds: string[] }) => {
    let vendedorId = v.id;
    if (v.id) {
      const { data, error } = await supabase
        .from("vendedores").update({ nome: v.nome, whatsapp: v.whatsapp }).eq("id", v.id).select().single();
      if (error) { toast.error("Erro ao atualizar", { description: error.message }); return; }
      setList(l => l.map(x => x.id === v.id ? data : x));
      toast.success("Atualizado");
    } else {
      const { data, error } = await supabase
        .from("vendedores").insert({ nome: v.nome, whatsapp: v.whatsapp }).select().single();
      if (error) { toast.error("Erro ao adicionar", { description: error.message }); return; }
      setList(l => [data, ...l]);
      vendedorId = data.id;
      toast.success("Adicionado");
    }

    const vinculadosAntes = prestadores.filter(p => p.vendedor_id === vendedorId).map(p => p.id);
    const paraVincular = v.prestadorIds.filter(id => !vinculadosAntes.includes(id));
    const paraDesvincular = vinculadosAntes.filter(id => !v.prestadorIds.includes(id));
    let vinculadosOk: string[] = [];
    let desvinculadosOk: string[] = [];

    if (paraVincular.length > 0) {
      const { error } = await supabase.from("prestadores").update({ vendedor_id: vendedorId }).in("id", paraVincular);
      if (error) toast.error("Erro ao vincular prestador(es)", { description: error.message });
      else vinculadosOk = paraVincular;
    }
    if (paraDesvincular.length > 0) {
      const { error } = await supabase.from("prestadores").update({ vendedor_id: null }).in("id", paraDesvincular);
      if (error) toast.error("Erro ao desvincular prestador(es)", { description: error.message });
      else desvinculadosOk = paraDesvincular;
    }
    if (vinculadosOk.length > 0 || desvinculadosOk.length > 0) {
      setPrestadores(ps => ps.map(p => {
        if (vinculadosOk.includes(p.id)) return { ...p, vendedor_id: vendedorId ?? null };
        if (desvinculadosOk.includes(p.id)) return { ...p, vendedor_id: null };
        return p;
      }));
    }

    setCreating(false); setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("vendedores").delete().eq("id", deleting.id);
    if (error) { toast.error("Erro ao excluir", { description: error.message }); setDeleting(null); return; }
    setList(l => l.filter(x => x.id !== deleting.id));
    toast.success("Excluído");
    setDeleting(null);
  };

  return (
    <div className="space-y-6 max-w-[1000px]">
      <PageHeader
        title="Vendedores"
        subtitle={loading ? "Carregando…" : `${list.length} vendedores ativos`}
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" />Adicionar vendedor
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
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
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Wrench className="h-3 w-3" />
                  {prestadores.filter(p => p.vendedor_id === v.id).length} prestador(es) vinculado(s)
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
        prestadores={prestadores}
        vendedores={list}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vendedor?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.nome} será removido. Não pode ser desfeito.</AlertDialogDescription>
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

function VendedorForm({
  open, vendedor, prestadores, vendedores, onClose, onSave,
}: {
  open: boolean;
  vendedor: Vendedor | null;
  prestadores: Prestador[];
  vendedores: Vendedor[];
  onClose: () => void;
  onSave: (v: { id?: string; nome: string; whatsapp: string; prestadorIds: string[] }) => void;
}) {
  const [nome, setNome] = useState(vendedor?.nome ?? "");
  const [whatsapp, setWhatsapp] = useState(vendedor?.whatsapp ?? "");
  const [prestadorIds, setPrestadorIds] = useState<string[]>([]);

  useEffect(() => {
    setNome(vendedor?.nome ?? "");
    setWhatsapp(vendedor?.whatsapp ?? "");
    setPrestadorIds(prestadores.filter(p => p.vendedor_id === vendedor?.id).map(p => p.id));
  }, [vendedor, open, prestadores]);

  const toggle = (id: string) => {
    setPrestadorIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vendedor ? "Editar vendedor" : "Novo vendedor"}</DialogTitle>
          <DialogDescription>Escolha os prestadores de serviço que atendem só este vendedor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
          <div className="grid gap-1.5">
            <Label>Prestadores vinculados</Label>
            {prestadores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prestador cadastrado ainda.</p>
            ) : (
              <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {prestadores.map(p => {
                  const outroVendedor = p.vendedor_id && p.vendedor_id !== vendedor?.id
                    ? vendedores.find(v => v.id === p.vendedor_id)?.nome
                    : null;
                  return (
                    <label key={p.id} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                      <Checkbox
                        checked={prestadorIds.includes(p.id)}
                        onCheckedChange={() => toggle(p.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="text-sm text-foreground truncate">{p.nome}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.especialidade || "—"}
                          {outroVendedor && <span className="text-amber-600"> · vinculado a {outroVendedor}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ id: vendedor?.id, nome, whatsapp, prestadorIds })} className="bg-primary hover:bg-[var(--primary-hover)]">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
