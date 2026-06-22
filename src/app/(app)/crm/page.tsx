"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Star, Phone, Mail, Globe, MapPin, Sparkles, Copy, UserPlus, Wrench, X, Loader2, Send,
  Pencil, Plus, Trash2, ChevronLeft, ChevronRight, Archive, Check,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadAtividade, LeadEtapa, LeadEtapaCor } from "@/lib/supabase/types";
import { toast } from "sonner";

const CORES: Record<LeadEtapaCor, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  gold: "bg-[var(--gold)]",
  purple: "bg-purple-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
};

const scoreBadge = (s: Lead["score"]) => {
  if (s === "alto") return {
    label: "Alto potencial",
    cls: "bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/30",
    dot: true,
  };
  if (s === "medio") return { label: "Médio", cls: "bg-slate-500/10 text-slate-500 border-slate-500/20", dot: false };
  return { label: "Baixo", cls: "bg-slate-400/10 text-slate-400 border-slate-400/15", dot: false };
};

type FiltroTipo = "todos" | "cliente" | "parceiro";

export default function CrmPage() {
  const supabase = createClient();
  const [etapas, setEtapas] = useState<LeadEtapa[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Lead | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [editingEtapa, setEditingEtapa] = useState<LeadEtapa | null>(null);
  const [addingEtapa, setAddingEtapa] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("lead_etapas").select("*").order("ordem", { ascending: true }),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
    ]).then(([et, ld]) => {
      if (et.error) toast.error("Erro ao carregar etapas", { description: et.error.message });
      if (ld.error) toast.error("Erro ao carregar leads", { description: ld.error.message });
      setEtapas(et.data ?? []);
      setLeads(ld.data ?? []);
      setLoading(false);
    });
  }, [supabase]);

  const etapasOrdenadas = useMemo(() => [...etapas].sort((a, b) => a.ordem - b.ordem), [etapas]);
  const leadsAtivos = useMemo(() => leads.filter((l) => !l.arquivado), [leads]);
  const leadsArquivados = useMemo(() => leads.filter((l) => l.arquivado), [leads]);

  const leadsFiltrados = useMemo(
    () => (filtroTipo === "todos" ? leadsAtivos : leadsAtivos.filter((l) => l.tipo_negocio === filtroTipo)),
    [leadsAtivos, filtroTipo],
  );

  const byCol = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    etapasOrdenadas.forEach((e) => { map[e.id] = []; });
    leadsFiltrados.forEach((l) => { (map[l.etapa_id] ??= []).push(l); });
    return map;
  }, [leadsFiltrados, etapasOrdenadas]);

  const contagem = useMemo(
    () => ({
      todos: leadsAtivos.length,
      cliente: leadsAtivos.filter((l) => l.tipo_negocio === "cliente").length,
      parceiro: leadsAtivos.filter((l) => l.tipo_negocio === "parceiro").length,
    }),
    [leadsAtivos],
  );

  const onDrop = async (etapa: LeadEtapa, id: string) => {
    const arquivar = etapa.arquiva;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, etapa_id: etapa.id, arquivado: arquivar } : l)));
    const { error } = await supabase.from("leads").update({ etapa_id: etapa.id, arquivado: arquivar }).eq("id", id);
    if (error) { toast.error("Erro ao mover lead", { description: error.message }); return; }
    await supabase.from("lead_atividades").insert({
      lead_id: id, texto: `Etapa alterada para "${etapa.nome}"${arquivar ? " — atendimento finalizado, lead arquivado" : ""}`,
    });
    toast.success(arquivar ? `Atendimento finalizado — lead arquivado.` : `Lead movido para "${etapa.nome}".`);
  };

  const addEtapa = async (nome: string) => {
    const ordem = etapasOrdenadas.length > 0 ? etapasOrdenadas[etapasOrdenadas.length - 1].ordem + 1 : 1;
    const { data, error } = await supabase.from("lead_etapas").insert({ nome, ordem, cor: "slate", arquiva: false }).select().single();
    if (error || !data) { toast.error("Erro ao criar etapa", { description: error?.message }); return; }
    setEtapas((es) => [...es, data]);
    toast.success("Etapa criada");
    setAddingEtapa(false);
  };

  const saveEtapa = async (id: string, patch: Partial<Pick<LeadEtapa, "nome" | "cor" | "arquiva">>) => {
    const { error } = await supabase.from("lead_etapas").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao salvar etapa", { description: error.message }); return; }
    setEtapas((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    toast.success("Etapa atualizada");
    setEditingEtapa(null);
  };

  const deleteEtapa = async (etapa: LeadEtapa) => {
    if (leads.some((l) => l.etapa_id === etapa.id)) {
      toast.error("Não é possível excluir", { description: "Mova os leads desta etapa antes de excluir." });
      return;
    }
    const { error } = await supabase.from("lead_etapas").delete().eq("id", etapa.id);
    if (error) { toast.error("Erro ao excluir etapa", { description: error.message }); return; }
    setEtapas((es) => es.filter((e) => e.id !== etapa.id));
    toast.success("Etapa excluída");
    setEditingEtapa(null);
  };

  const moveEtapa = async (etapa: LeadEtapa, dir: -1 | 1) => {
    const idx = etapasOrdenadas.findIndex((e) => e.id === etapa.id);
    const other = etapasOrdenadas[idx + dir];
    if (!other) return;
    await Promise.all([
      supabase.from("lead_etapas").update({ ordem: other.ordem }).eq("id", etapa.id),
      supabase.from("lead_etapas").update({ ordem: etapa.ordem }).eq("id", other.id),
    ]);
    setEtapas((es) => es.map((e) => {
      if (e.id === etapa.id) return { ...e, ordem: other.ordem };
      if (e.id === other.id) return { ...e, ordem: etapa.ordem };
      return e;
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM · Leads"
        subtitle="Pipeline visual de prospecção com inteligência da Apify + IA."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/crm/arquivados">
                <Archive className="h-4 w-4" />
                Arquivados
                <span className="text-xs tabular-nums opacity-70">{leadsArquivados.length}</span>
              </Link>
            </Button>
            <Button onClick={() => setSearchOpen(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
              <Sparkles className="h-4 w-4" />
              Buscar novos leads
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 p-1 rounded-xl bg-muted w-fit">
        {([
          { v: "todos" as const, label: "Todos" },
          { v: "cliente" as const, label: "Clientes" },
          { v: "parceiro" as const, label: "Parceiros" },
        ]).map((opt) => (
          <button
            key={opt.v}
            onClick={() => setFiltroTipo(opt.v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filtroTipo === opt.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {opt.label}
            <span className="text-xs tabular-nums opacity-70">{contagem[opt.v]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[0, 1, 2, 3].map((c) => <Skeleton key={c} className="w-[300px] h-[420px] rounded-2xl shrink-0" />)}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none items-start">
          {etapasOrdenadas.map((etapa, i) => {
            const items = byCol[etapa.id] ?? [];
            return (
              <KanbanColumn
                key={etapa.id}
                etapa={etapa}
                count={items.length}
                onDrop={(id) => onDrop(etapa, id)}
                onEdit={() => setEditingEtapa(etapa)}
                canMoveLeft={i > 0}
                canMoveRight={i < etapasOrdenadas.length - 1}
                onMoveLeft={() => moveEtapa(etapa, -1)}
                onMoveRight={() => moveEtapa(etapa, 1)}
              >
                {items.length === 0 ? (
                  <EmptyColumn isFirst={i === 0} onSearch={() => setSearchOpen(true)} />
                ) : (
                  items.map((l) => <LeadCard key={l.id} lead={l} onOpen={() => setActive(l)} />)
                )}
              </KanbanColumn>
            );
          })}
          <button
            onClick={() => setAddingEtapa(true)}
            className="w-[220px] shrink-0 snap-start rounded-2xl border-2 border-dashed border-border hover:border-[var(--gold)]/40 text-muted-foreground hover:text-foreground transition-colors min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Nova etapa</span>
          </button>
        </div>
      )}

      <LeadDrawer
        lead={active}
        onClose={() => setActive(null)}
        onConverted={(field, id) => {
          setLeads((ls) => ls.map((l) => (l.id === active?.id ? { ...l, [field]: id } : l)));
        }}
      />
      <SearchLeadsDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onLeadsAdded={(novos) => setLeads((ls) => [...novos, ...ls])}
      />
      <EtapaEditDialog
        etapa={editingEtapa}
        temLeads={editingEtapa ? leads.some((l) => l.etapa_id === editingEtapa.id) : false}
        onClose={() => setEditingEtapa(null)}
        onSave={saveEtapa}
        onDelete={deleteEtapa}
      />
      <AddEtapaDialog open={addingEtapa} onClose={() => setAddingEtapa(false)} onAdd={addEtapa} />
    </div>
  );
}

function KanbanColumn({
  etapa, count, children, onDrop, onEdit, canMoveLeft, canMoveRight, onMoveLeft, onMoveRight,
}: {
  etapa: LeadEtapa;
  count: number;
  children: React.ReactNode;
  onDrop: (id: string) => void;
  onEdit: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      className="w-[300px] shrink-0 snap-start"
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const id = e.dataTransfer.getData("text/lead-id");
        if (id) onDrop(id);
      }}
    >
      <div className="group flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${CORES[etapa.cor]}`} />
          <h3 className="text-sm font-semibold text-foreground truncate">{etapa.nome}</h3>
          <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
          {etapa.arquiva && <Archive className="h-3 w-3 text-muted-foreground shrink-0" />}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button disabled={!canMoveLeft} onClick={onMoveLeft} className="grid h-6 w-6 place-items-center rounded-md hover:bg-muted disabled:opacity-30 text-muted-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button disabled={!canMoveRight} onClick={onMoveRight} className="grid h-6 w-6 place-items-center rounded-md hover:bg-muted disabled:opacity-30 text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={onEdit} className="grid h-6 w-6 place-items-center rounded-md hover:bg-muted text-muted-foreground">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className={`rounded-2xl p-2 min-h-[400px] transition-colors ${
        over ? "bg-[var(--gold)]/10 ring-2 ring-[var(--gold)]/40" : "bg-muted/40"
      }`}>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const badge = scoreBadge(lead.score);
  return (
    <button
      onClick={onOpen}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/lead-id", lead.id)}
      className="w-full text-left rounded-xl border border-border bg-card p-3.5 shadow-sm hover:border-[var(--gold)]/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground truncate">{lead.empresa}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">{lead.contato}</div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone className="h-3 w-3" strokeWidth={1.5} />
        <span className="truncate">{lead.telefone}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
          {lead.categoria}
        </span>
        {lead.tipo_negocio && (
          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-medium ${
            lead.tipo_negocio === "parceiro"
              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
              : "bg-sky-500/10 text-sky-600 border-sky-500/20"
          }`}>
            {lead.tipo_negocio === "parceiro" ? <Wrench className="h-2.5 w-2.5" /> : null}
            {lead.tipo_negocio === "parceiro" ? "Parceiro" : "Cliente"}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-end">
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border font-medium ${badge.cls}`}>
          {badge.dot && <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />}
          {badge.label}
        </span>
      </div>
    </button>
  );
}

function EmptyColumn({ isFirst, onSearch }: { isFirst: boolean; onSearch: () => void }) {
  return (
    <div className="py-10 px-3 text-center">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isFirst ? "Nenhum lead aqui. Que tal buscar os primeiros?" : "Nenhum lead nesta etapa."}
      </p>
      {isFirst && (
        <button onClick={onSearch} className="mt-3 text-xs font-medium text-[var(--gold)] hover:text-[var(--gold-soft)]">
          Buscar leads →
        </button>
      )}
    </div>
  );
}

function EtapaEditDialog({
  etapa, temLeads, onClose, onSave, onDelete,
}: {
  etapa: LeadEtapa | null;
  temLeads: boolean;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Pick<LeadEtapa, "nome" | "cor" | "arquiva">>) => void;
  onDelete: (etapa: LeadEtapa) => void;
}) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState<LeadEtapaCor>("blue");
  const [arquiva, setArquiva] = useState(false);

  useEffect(() => {
    if (etapa) { setNome(etapa.nome); setCor(etapa.cor); setArquiva(etapa.arquiva); }
  }, [etapa]);

  if (!etapa) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar etapa</DialogTitle>
          <DialogDescription>Personalize o nome, a cor e o comportamento desta etapa do pipeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {(Object.keys(CORES) as LeadEtapaCor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  className={`h-7 w-7 rounded-full ${CORES[c]} flex items-center justify-center ring-offset-2 ${
                    cor === c ? "ring-2 ring-foreground" : ""
                  }`}
                >
                  {cor === c && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 cursor-pointer">
            <Checkbox checked={arquiva} onCheckedChange={(v) => setArquiva(Boolean(v))} className="mt-0.5" />
            <span>
              <span className="text-sm text-foreground font-medium block">Arquivar automaticamente</span>
              <span className="text-xs text-muted-foreground">Ao finalizar o atendimento e mover um lead pra esta etapa, ele some do pipeline ativo (ex: Ganho, Perdido).</span>
            </span>
          </label>
          {temLeads && (
            <p className="text-xs text-muted-foreground">Esta etapa tem leads — mova-os antes de excluir.</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive gap-2"
            disabled={temLeads}
            onClick={() => onDelete(etapa)}
          >
            <Trash2 className="h-4 w-4" />Excluir
          </Button>
          <Button
            className="bg-primary hover:bg-[var(--primary-hover)]"
            onClick={() => onSave(etapa.id, { nome, cor, arquiva })}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddEtapaDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (nome: string) => void }) {
  const [nome, setNome] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setNome(""); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova etapa</DialogTitle>
          <DialogDescription>Adiciona uma coluna ao pipeline do CRM.</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Em negociação"
            onKeyDown={(e) => { if (e.key === "Enter" && nome.trim()) { onAdd(nome.trim()); setNome(""); } }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!nome.trim()}
            className="bg-primary hover:bg-[var(--primary-hover)]"
            onClick={() => { onAdd(nome.trim()); setNome(""); }}
          >
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadDrawer({
  lead, onClose, onConverted,
}: {
  lead: Lead | null;
  onClose: () => void;
  onConverted: (field: "converted_cliente_id" | "converted_prestador_id", id: string) => void;
}) {
  const supabase = createClient();
  const [atividades, setAtividades] = useState<LeadAtividade[]>([]);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!lead) return;
    supabase
      .from("lead_atividades")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar histórico", { description: error.message });
        else setAtividades(data ?? []);
      });
  }, [lead, supabase]);

  if (!lead) return null;
  const badge = scoreBadge(lead.score);
  const copy = () => {
    navigator.clipboard.writeText(lead.sugestao_whatsapp ?? "");
    toast.success("Mensagem copiada!");
  };

  const cadastrarComoCliente = async () => {
    setConverting(true);
    const { data: cliente, error } = await supabase.from("clientes").insert({
      tipo: "PJ",
      nome: lead.empresa,
      documento: "",
      telefone: lead.telefone,
      email: lead.email,
      cidade: null,
      estado: null,
      ia_risco: "baixo",
      ia_upsell: [],
      ia_resumo: null,
    }).select().single();
    setConverting(false);
    if (error || !cliente) {
      toast.error("Erro ao cadastrar cliente", { description: error?.message });
      return;
    }
    await supabase.from("leads").update({ converted_cliente_id: cliente.id }).eq("id", lead.id);
    await supabase.from("lead_atividades").insert({ lead_id: lead.id, texto: `Cadastrado como cliente: ${cliente.nome}` });
    toast.success("Cadastrado como cliente!");
    onConverted("converted_cliente_id", cliente.id);
  };

  const cadastrarComoParceiro = async () => {
    setConverting(true);
    const { data: prestador, error } = await supabase.from("prestadores").insert({
      tipo: "PJ",
      nome: lead.empresa,
      documento: "",
      especialidade: lead.categoria,
      telefone: lead.telefone,
      email: lead.email,
      cidade: null,
      estado: null,
    }).select().single();
    setConverting(false);
    if (error || !prestador) {
      toast.error("Erro ao cadastrar prestador", { description: error?.message });
      return;
    }
    await supabase.from("leads").update({ converted_prestador_id: prestador.id }).eq("id", lead.id);
    await supabase.from("lead_atividades").insert({ lead_id: lead.id, texto: `Cadastrado como prestador: ${prestador.nome}` });
    toast.success("Cadastrado como prestador!");
    onConverted("converted_prestador_id", prestador.id);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card border-l border-border shadow-2xl drawer-in overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{lead.categoria}</div>
            <h2 className="font-display text-xl font-semibold text-foreground truncate">{lead.empresa}</h2>
            <div className="text-sm text-muted-foreground">{lead.contato}</div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <InfoCell
              icon={Phone} label="Telefone" value={lead.telefone ?? "—"}
              actions={lead.telefone ? [
                { icon: Phone, label: "Ligar", href: `tel:${lead.telefone.replace(/[^\d+]/g, "")}` },
                {
                  icon: Send, label: "WhatsApp", cls: "text-emerald-600",
                  href: `https://wa.me/${lead.telefone.replace(/\D/g, "")}${
                    lead.sugestao_whatsapp ? `?text=${encodeURIComponent(lead.sugestao_whatsapp)}` : ""
                  }`,
                },
              ] : undefined}
            />
            <InfoCell
              icon={Mail} label="Email" value={lead.email ?? "—"}
              href={lead.email ? `mailto:${lead.email}` : undefined}
            />
            <InfoCell
              icon={Globe} label="Site" value={lead.site ?? "—"}
              href={lead.site ? (lead.site.startsWith("http") ? lead.site : `https://${lead.site}`) : undefined}
            />
            <InfoCell
              icon={MapPin} label="Endereço" value={lead.endereco ?? "—"}
              href={lead.endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.endereco)}` : undefined}
            />
            {lead.avaliacao && (
              <InfoCell icon={Star} label="Avaliação" value={`${lead.avaliacao.toFixed(1)} / 5`} />
            )}
          </div>

          {/* AI section */}
          <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[var(--gold)]" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-foreground">Análise de IA</h3>
              <span className={`ml-auto inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border font-medium ${badge.cls}`}>
                {badge.dot && <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />}
                {badge.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 mb-4">
              {lead.score_justificativa ?? "Ainda sem análise de IA gerada para este lead."}
            </p>
            {lead.sugestao_whatsapp && (
              <div className="rounded-xl bg-card border border-border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                  <span>Mensagem sugerida (WhatsApp)</span>
                  <button onClick={copy} className="inline-flex items-center gap-1 text-foreground hover:text-[var(--gold)] transition-colors">
                    <Copy className="h-3 w-3" />Copiar
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-foreground">{lead.sugestao_whatsapp}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Histórico</h3>
            {atividades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividades registradas ainda.</p>
            ) : (
              <ol className="space-y-3 border-l border-border ml-2">
                {atividades.map((a) => (
                  <li key={a.id} className="relative pl-5">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--gold)] ring-4 ring-card" />
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                    <div className="text-sm text-foreground">{a.texto}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant={lead.converted_cliente_id ? "outline" : "default"}
              className={`flex-1 gap-2 ${lead.converted_cliente_id ? "" : "bg-primary hover:bg-[var(--primary-hover)]"}`}
              disabled={converting || !!lead.converted_cliente_id}
              onClick={cadastrarComoCliente}
            >
              <UserPlus className="h-4 w-4" />
              {lead.converted_cliente_id ? "Já é cliente" : converting ? "Cadastrando…" : "Cadastrar como cliente"}
            </Button>
            <Button
              variant={lead.converted_prestador_id ? "outline" : "default"}
              className={`flex-1 gap-2 ${lead.converted_prestador_id ? "" : "bg-primary hover:bg-[var(--primary-hover)]"}`}
              disabled={converting || !!lead.converted_prestador_id}
              onClick={cadastrarComoParceiro}
            >
              <Wrench className="h-4 w-4" />
              {lead.converted_prestador_id ? "Já é parceiro" : converting ? "Cadastrando…" : "Cadastrar como parceiro"}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function InfoCell({
  icon: Icon, label, value, href, actions,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
  actions?: { icon: typeof Phone; label: string; href: string; cls?: string }[];
}) {
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        <Icon className="h-3 w-3" strokeWidth={1.5} />
        {label}
      </div>
      <div className={`text-sm truncate ${href ? "text-[var(--gold)]" : "text-foreground"} ${actions ? "pr-14" : ""}`}>{value}</div>
    </>
  );

  return (
    <div className="relative rounded-xl border border-border bg-background p-3 min-w-0">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
          {body}
        </a>
      ) : body}
      {actions && actions.length > 0 && (
        <div className="absolute right-2 top-2 flex gap-1">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              title={a.label}
              className={`grid h-6 w-6 place-items-center rounded-md hover:bg-muted transition-colors ${a.cls ?? "text-muted-foreground"}`}
            >
              <a.icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchLeadsDialog({
  open, onOpenChange, onLeadsAdded,
}: { open: boolean; onOpenChange: (b: boolean) => void; onLeadsAdded: (leads: Lead[]) => void }) {
  const [step, setStep] = useState<"form" | "sugestoes">("form");
  const [nicho, setNicho] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [gerando, setGerando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [progress, setProgress] = useState(0);

  const [termosClientes, setTermosClientes] = useState<string[]>([]);
  const [termosParceiros, setTermosParceiros] = useState<string[]>([]);
  const [selClientes, setSelClientes] = useState<Set<string>>(new Set());
  const [selParceiros, setSelParceiros] = useState<Set<string>>(new Set());
  const [novoCliente, setNovoCliente] = useState("");
  const [novoParceiro, setNovoParceiro] = useState("");

  const reset = () => {
    setStep("form"); setNicho(""); setCidade(""); setEstado("");
    setTermosClientes([]); setTermosParceiros([]);
    setSelClientes(new Set()); setSelParceiros(new Set());
  };

  const gerarSugestoes = async () => {
    setGerando(true);
    try {
      const res = await fetch("/api/leads/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nicho, cidade, estado }),
      });
      const json = await res.json();
      setGerando(false);
      if (!res.ok) { toast.error("Erro ao gerar sugestões", { description: json.error }); return; }
      setTermosClientes(json.termosClientes ?? []);
      setTermosParceiros(json.termosParceiros ?? []);
      setSelClientes(new Set(json.termosClientes ?? []));
      setSelParceiros(new Set(json.termosParceiros ?? []));
      setStep("sugestoes");
    } catch (err) {
      setGerando(false);
      toast.error("Erro ao gerar sugestões", { description: err instanceof Error ? err.message : "Tente novamente." });
    }
  };

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, termo: string) => {
    const next = new Set(set);
    next.has(termo) ? next.delete(termo) : next.add(termo);
    setFn(next);
  };

  const addCustom = (
    valor: string, lista: string[], setLista: (l: string[]) => void,
    sel: Set<string>, setSel: (s: Set<string>) => void, clear: () => void,
  ) => {
    const v = valor.trim();
    if (!v || lista.includes(v)) return;
    setLista([...lista, v]);
    setSel(new Set([...sel, v]));
    clear();
  };

  const buscar = async () => {
    const termosClientesSel = termosClientes.filter((t) => selClientes.has(t));
    const termosParceirosSel = termosParceiros.filter((t) => selParceiros.has(t));
    if (termosClientesSel.length === 0 && termosParceirosSel.length === 0) {
      toast.error("Selecione ao menos um termo de busca.");
      return;
    }
    setBuscando(true);
    setProgress(8);
    const interval = setInterval(() => setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 10)), 600);

    try {
      const res = await fetch("/api/leads/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termosClientes: termosClientesSel, termosParceiros: termosParceirosSel, cidade, estado }),
      });
      const json = await res.json();
      clearInterval(interval);
      setProgress(100);
      setBuscando(false);

      if (!res.ok) {
        toast.error("Erro ao buscar leads", { description: json.error });
        return;
      }

      onOpenChange(false);
      reset();
      onLeadsAdded(json.leads ?? []);
      toast.success(`${json.count} lead(s) encontrado(s)`, { description: "Adicionados na coluna \"Novo\"." });
    } catch (err) {
      clearInterval(interval);
      setBuscando(false);
      toast.error("Erro ao buscar leads", { description: err instanceof Error ? err.message : "Tente novamente." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            Buscar novos leads
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "A IA sugere termos de busca pros dois lados do negócio: quem tem peça pra arrumar e quem arruma."
              : "Revise os termos sugeridos pela IA — desmarque o que não interessa ou adicione os seus."}
          </DialogDescription>
        </DialogHeader>

        {buscando ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--gold)]" />
              Buscando leads… isso pode levar alguns minutos.
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">Varrendo Google Maps para cada termo selecionado.</p>
          </div>
        ) : step === "form" ? (
          <>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="nicho">Nicho / palavra-chave (opcional)</Label>
                <Input id="nicho" placeholder="Ex: hidráulica industrial" value={nicho} onChange={(e) => setNicho(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" placeholder="São Paulo" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" placeholder="SP" value={estado} onChange={(e) => setEstado(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={gerarSugestoes} disabled={gerando} className="bg-primary hover:bg-[var(--primary-hover)] gap-2">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {gerando ? "Gerando…" : "Gerar sugestões com IA"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid gap-5 py-2 max-h-[55vh] overflow-y-auto pr-1">
              <TermosGroup
                label="Clientes — têm peça pra arrumar"
                termos={termosClientes}
                selecionados={selClientes}
                onToggle={(t) => toggle(selClientes, setSelClientes, t)}
                novoValor={novoCliente}
                onNovoChange={setNovoCliente}
                onAdd={() => addCustom(novoCliente, termosClientes, setTermosClientes, selClientes, setSelClientes, () => setNovoCliente(""))}
              />
              <TermosGroup
                label="Parceiros — arrumam peça"
                termos={termosParceiros}
                selecionados={selParceiros}
                onToggle={(t) => toggle(selParceiros, setSelParceiros, t)}
                novoValor={novoParceiro}
                onNovoChange={setNovoParceiro}
                onAdd={() => addCustom(novoParceiro, termosParceiros, setTermosParceiros, selParceiros, setSelParceiros, () => setNovoParceiro(""))}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("form")}>Voltar</Button>
              <Button onClick={buscar} className="bg-primary hover:bg-[var(--primary-hover)] gap-2">
                <Sparkles className="h-4 w-4" />
                Buscar via Apify
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TermosGroup({
  label, termos, selecionados, onToggle, novoValor, onNovoChange, onAdd,
}: {
  label: string; termos: string[]; selecionados: Set<string>; onToggle: (t: string) => void;
  novoValor: string; onNovoChange: (v: string) => void; onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="space-y-1.5">
        {termos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum termo sugerido.</p>}
        {termos.map((t) => (
          <label key={t} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
            <Checkbox checked={selecionados.has(t)} onCheckedChange={() => onToggle(t)} />
            <span className="flex-1 text-foreground">{t}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={novoValor}
          onChange={(e) => onNovoChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder="Adicionar termo…"
          className="h-8 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>Adicionar</Button>
      </div>
    </div>
  );
}
