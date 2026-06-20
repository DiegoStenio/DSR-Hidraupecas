"use client";

import { useMemo, useState } from "react";
import {
  Search, Star, Phone, Mail, Globe, MapPin, Sparkles, Copy, UserPlus, X, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { leads as seedLeads, statusLeadConfig, type Lead, type LeadStatus } from "@/lib/mock-data";
import { toast } from "sonner";

const COLS: LeadStatus[] = ["novo", "contatado", "qualificado", "proposta", "ganho", "perdido"];

const scoreBadge = (s: Lead["score"]) => {
  if (s === "alto") return {
    label: "Alto potencial",
    cls: "bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/30",
    dot: true,
  };
  if (s === "medio") return { label: "Médio", cls: "bg-slate-500/10 text-slate-500 border-slate-500/20", dot: false };
  return { label: "Baixo", cls: "bg-slate-400/10 text-slate-400 border-slate-400/15", dot: false };
};

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [active, setActive] = useState<Lead | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const byCol = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = { novo: [], contatado: [], qualificado: [], proposta: [], ganho: [], perdido: [] };
    leads.forEach((l) => map[l.status].push(l));
    return map;
  }, [leads]);

  const onDrop = (status: LeadStatus, id: string) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    toast.success(`Lead movido para "${statusLeadConfig[status].label}"`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM · Leads"
        subtitle="Pipeline visual de prospecção com inteligência da Apify + IA."
        actions={
          <Button onClick={() => setSearchOpen(true)} className="gap-2 bg-primary hover:bg-[var(--primary-hover)]">
            <Sparkles className="h-4 w-4" />
            Buscar novos leads
          </Button>
        }
      />

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none">
        {COLS.map((status) => {
          const cfg = statusLeadConfig[status];
          const items = byCol[status];
          return (
            <KanbanColumn
              key={status}
              status={status}
              label={cfg.label}
              count={items.length}
              onDrop={(id) => onDrop(status, id)}
            >
              {items.length === 0 ? (
                <EmptyColumn status={status} onSearch={() => setSearchOpen(true)} />
              ) : (
                items.map((l) => <LeadCard key={l.id} lead={l} onOpen={() => setActive(l)} />)
              )}
            </KanbanColumn>
          );
        })}
      </div>

      <LeadDrawer lead={active} onClose={() => setActive(null)} />
      <SearchLeadsDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

function KanbanColumn({
  status, label, count, children, onDrop,
}: {
  status: LeadStatus;
  label: string;
  count: number;
  children: React.ReactNode;
  onDrop: (id: string) => void;
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
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${
            status === "ganho" ? "bg-emerald-500" :
            status === "perdido" ? "bg-rose-500" :
            status === "proposta" ? "bg-purple-500" :
            status === "qualificado" ? "bg-[var(--gold)]" :
            status === "contatado" ? "bg-indigo-500" : "bg-blue-500"
          }`} />
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
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
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
          {lead.categoria}
        </span>
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border font-medium ${badge.cls}`}>
          {badge.dot && <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />}
          {badge.label}
        </span>
      </div>
    </button>
  );
}

function EmptyColumn({ status, onSearch }: { status: LeadStatus; onSearch: () => void }) {
  const txt: Record<LeadStatus, string> = {
    novo: "Nenhum lead novo. Que tal buscar os primeiros?",
    contatado: "Nada por aqui — comece movendo um lead novo.",
    qualificado: "Qualifique leads contatados para vê-los aqui.",
    proposta: "Nenhuma proposta em aberto.",
    ganho: "Sem vitórias ainda esta semana.",
    perdido: "Nada perdido. Excelente.",
  };
  return (
    <div className="py-10 px-3 text-center">
      <p className="text-xs text-muted-foreground leading-relaxed">{txt[status]}</p>
      {status === "novo" && (
        <button onClick={onSearch} className="mt-3 text-xs font-medium text-[var(--gold)] hover:text-[var(--gold-soft)]">
          Buscar leads →
        </button>
      )}
    </div>
  );
}

function LeadDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  if (!lead) return null;
  const badge = scoreBadge(lead.score);
  const copy = () => {
    navigator.clipboard.writeText(lead.sugestaoWhatsapp);
    toast.success("Mensagem copiada!");
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
            <InfoCell icon={Phone} label="Telefone" value={lead.telefone} />
            <InfoCell icon={Mail} label="Email" value={lead.email ?? "—"} />
            <InfoCell icon={Globe} label="Site" value={lead.site ?? "—"} />
            <InfoCell icon={MapPin} label="Endereço" value={lead.endereco ?? "—"} />
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
              {lead.scoreJustificativa}
            </p>
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>Mensagem sugerida (WhatsApp)</span>
                <button onClick={copy} className="inline-flex items-center gap-1 text-foreground hover:text-[var(--gold)] transition-colors">
                  <Copy className="h-3 w-3" />Copiar
                </button>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{lead.sugestaoWhatsapp}</p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Histórico</h3>
            <ol className="space-y-3 border-l border-border ml-2">
              {lead.atividades.map((a, i) => (
                <li key={i} className="relative pl-5">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--gold)] ring-4 ring-card" />
                  <div className="text-xs text-muted-foreground">{a.data}</div>
                  <div className="text-sm text-foreground">{a.texto}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 gap-2 bg-primary hover:bg-[var(--primary-hover)]" onClick={() => toast.success("Convertido em cliente!")}>
              <UserPlus className="h-4 w-4" />
              Converter em cliente
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        <Icon className="h-3 w-3" strokeWidth={1.5} />
        {label}
      </div>
      <div className="text-sm text-foreground truncate">{value}</div>
    </div>
  );
}

function SearchLeadsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const [nicho, setNicho] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const search = () => {
    setLoading(true);
    setProgress(8);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + Math.random() * 12;
      });
    }, 280);
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setLoading(false);
      onOpenChange(false);
      toast.success("9 novos leads capturados via Apify");
    }, 3200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            Buscar novos leads
          </DialogTitle>
          <DialogDescription>
            Define os critérios para o robô da Apify capturar empresas relevantes.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--gold)]" />
              Buscando leads… isso pode levar alguns minutos.
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Varrendo Google Maps, validando contatos e calculando scores com IA.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="nicho">Nicho / palavra-chave</Label>
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
              <Button onClick={search} className="bg-primary hover:bg-[var(--primary-hover)] gap-2">
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
