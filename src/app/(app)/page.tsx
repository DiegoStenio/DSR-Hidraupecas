"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { useCountUp } from "@/hooks/use-theme";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { LeadEtapa, Orcamento } from "@/lib/supabase/types";
import { toast } from "sonner";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatRelativo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function KpiCard({
  label, value, icon: Icon, hint, money,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  hint?: string;
  money?: boolean;
}) {
  const v = useCountUp(value);
  return (
    <div className="rounded-2xl border border-border/85 bg-card p-5 shadow-premium hover:border-[var(--gold)]/50 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/5 text-primary dark:bg-primary/20 dark:text-primary-foreground transition-colors group-hover:bg-primary/10">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-4 font-display text-3xl font-bold text-foreground tabular-nums tracking-tight">
        {money ? formatBRL(v) : v.toLocaleString("pt-BR")}
      </div>
      {hint && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/40 w-fit px-2 py-0.5 rounded-md">
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientesCount, setClientesCount] = useState(0);
  const [etapas, setEtapas] = useState<LeadEtapa[]>([]);
  const [leadEtapaCounts, setLeadEtapaCounts] = useState<Record<string, number>>({});
  const [leadsArquivadosCount, setLeadsArquivadosCount] = useState(0);
  const [resumoIa, setResumoIa] = useState<string | null>(null);
  const [resumoAtualizadoEm, setResumoAtualizadoEm] = useState<string | null>(null);
  const [gerandoResumo, setGerandoResumo] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("orcamentos").select("*"),
      supabase.from("clientes").select("*", { count: "exact", head: true }),
      supabase.from("lead_etapas").select("*").order("ordem", { ascending: true }),
      supabase.from("leads").select("etapa_id, arquivado"),
      supabase.from("company_settings").select("resumo_ia, resumo_ia_atualizado_em").limit(1).maybeSingle(),
    ]).then(([orc, cli, et, leads, settings]) => {
      if (orc.error) toast.error("Erro ao carregar orçamentos", { description: orc.error.message });
      if (leads.error) toast.error("Erro ao carregar leads", { description: leads.error.message });
      setOrcamentos(orc.data ?? []);
      setClientesCount(cli.count ?? 0);
      setEtapas(et.data ?? []);
      const counts: Record<string, number> = {};
      let arquivados = 0;
      (leads.data ?? []).forEach((l) => {
        counts[l.etapa_id] = (counts[l.etapa_id] ?? 0) + 1;
        if (l.arquivado) arquivados += 1;
      });
      setLeadEtapaCounts(counts);
      setLeadsArquivadosCount(arquivados);
      setResumoIa(settings.data?.resumo_ia ?? null);
      setResumoAtualizadoEm(settings.data?.resumo_ia_atualizado_em ?? null);
      setLoading(false);
    });
  }, [supabase]);

  const gerarResumo = async () => {
    setGerandoResumo(true);
    try {
      const res = await fetch("/api/dashboard/resumo", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Erro ao gerar resumo", { description: json.error });
        return;
      }
      setResumoIa(json.resumo);
      setResumoAtualizadoEm(json.atualizadoEm);
    } catch (err) {
      toast.error("Erro ao gerar resumo", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setGerandoResumo(false);
    }
  };

  const {
    orcamentosTotais, orcamentosPendentes, orcamentosRealizadosQtd, orcamentosRealizadosValor,
  } = useMemo(() => {
    const realizados = orcamentos.filter(o => o.status === "realizado");
    return {
      orcamentosTotais: orcamentos.length,
      orcamentosPendentes: orcamentos.filter(o => o.status === "pendente").length,
      orcamentosRealizadosQtd: realizados.length,
      orcamentosRealizadosValor: realizados.reduce((s, o) => s + o.total, 0),
    };
  }, [orcamentos]);

  const ultimos7Dias = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });
    return days.map((d) => {
      const iso = d.toISOString().slice(0, 10);
      const quantidade = orcamentos.filter(o => o.data === iso).length;
      return { dia: DIAS[d.getDay()], quantidade };
    });
  }, [orcamentos]);

  const funilLeads = useMemo(() => {
    const ativas = etapas.filter((e) => !e.arquiva).sort((a, b) => a.ordem - b.ordem);
    return [
      ...ativas.map((e) => ({ label: e.nome, qtd: leadEtapaCounts[e.id] ?? 0 })),
      { label: "Finalizados", qtd: leadsArquivadosCount },
    ];
  }, [etapas, leadEtapaCounts, leadsArquivadosCount]);
  const maxFunil = Math.max(1, ...funilLeads.map((f) => f.qtd));
  const conversao = funilLeads[0] && funilLeads[0].qtd > 0
    ? (funilLeads[funilLeads.length - 1].qtd / funilLeads[0].qtd) * 100
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <PageHeader title="Dashboard" subtitle="Resumo operacional da semana — atualizado em tempo real." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <PageHeader
        title="Dashboard"
        subtitle="Resumo operacional da semana — atualizado em tempo real."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Orçamentos Totais" value={orcamentosTotais} icon={FileText} />
        <KpiCard label="Clientes Cadastrados" value={clientesCount} icon={Users} />
        <KpiCard label="Realizados (R$)" value={orcamentosRealizadosValor} icon={CheckCircle2} hint={`${orcamentosRealizadosQtd} fechados`} money />
        <KpiCard label="Pendentes" value={orcamentosPendentes} icon={Clock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-6 shadow-premium">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-semibold text-foreground">Orçamentos nos últimos 7 dias</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Volume diário de orçamentos criados</p>
            </div>
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--success)]" />
              Últimos 7 dias
            </div>
          </div>
          <div className="h-64 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ultimos7Dias} barCategoryGap={20}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold-soft)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="quantidade" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumo IA */}
        <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-b from-card to-[var(--gold)]/5 p-6 shadow-premium flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-[var(--gold)]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-start justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold)]/20 shadow-sm">
                <Sparkles className="h-4.5 w-4.5 text-[var(--gold)]" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Resumo inteligente</h2>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {resumoAtualizadoEm ? `Atualizado ${formatRelativo(resumoAtualizadoEm)}` : "Ainda não gerado"}
                </p>
              </div>
            </div>
            <button
              onClick={gerarResumo}
              disabled={gerandoResumo}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50 shadow-sm"
              aria-label="Gerar resumo"
            >
              <RefreshCw className={`h-4 w-4 ${gerandoResumo ? "animate-spin" : ""}`} strokeWidth={1.75} />
            </button>
          </div>
          <div className="mt-4 flex-1 z-10">
            {resumoIa ? (
              <div className="border-l-2 border-[var(--gold)]/50 pl-4 py-1 text-sm leading-relaxed text-foreground/90 font-medium italic">
                {resumoIa}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {gerandoResumo ? "Gerando resumo com IA…" : "Clique no ícone de atualizar para a IA analisar seus dados e gerar um resumo executivo."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Funil */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-premium">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Funil de leads</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Distribuição atual por estágio</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-semibold text-foreground tabular-nums">
              {conversao.toFixed(1)}%
            </div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Conversão lead → cliente</div>
          </div>
        </div>
        <div className="space-y-2.5">
          {funilLeads.map((f, i) => {
            const pct = (f.qtd / maxFunil) * 100;
            const isGold = i === funilLeads.length - 1;
            return (
              <div key={f.label} className="grid grid-cols-[120px_1fr_60px] items-center gap-4">
                <div className="text-sm font-medium text-foreground">{f.label}</div>
                <div className="h-9 rounded-lg bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-700 flex items-center px-3"
                    style={{
                      width: `${Math.max(pct, f.qtd > 0 ? 8 : 0)}%`,
                      background: isGold
                        ? "linear-gradient(90deg, var(--gold) 0%, var(--gold-soft) 100%)"
                        : "linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 100%)",
                    }}
                  >
                    {f.qtd > 0 && (
                      <span className={`text-[11px] font-semibold ${isGold ? "text-[var(--gold-foreground)]" : "text-primary-foreground"}`}>
                        {funilLeads[0].qtd > 0 ? ((f.qtd / funilLeads[0].qtd) * 100).toFixed(0) : 0}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-foreground text-right">{f.qtd}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
