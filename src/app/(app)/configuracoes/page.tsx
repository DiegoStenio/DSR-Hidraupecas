"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Upload, Image as ImageIcon, Crown, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { CompanySettings } from "@/lib/supabase/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export default function ConfigPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar configurações", { description: error.message });
        else setSettings(data);
        setLoading(false);
      });
  }, [supabase]);

  const save = async (patch: Partial<CompanySettings>) => {
    if (!settings) return;
    const { data, error } = await supabase
      .from("company_settings").update(patch).eq("id", settings.id).select().single();
    if (error) { toast.error("Erro ao salvar", { description: error.message }); return; }
    setSettings(data);
    toast.success("Configurações salvas");
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6 max-w-[1100px]">
        <PageHeader title="Configurações" subtitle="Gerencie empresa, integrações e preferências." />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      <PageHeader title="Configurações" subtitle="Gerencie empresa, integrações e preferências." />

      <Tabs defaultValue="empresa">
        <TabsList className="bg-muted">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
          <TabsTrigger value="usuario">Usuário</TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-1.5">
            <Crown className="h-3.5 w-3.5 text-[var(--gold)]" />Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-5">
          <EmpresaForm settings={settings} onSave={save} />
        </TabsContent>

        <TabsContent value="pagamento" className="mt-5">
          <SectionCard title="QR Code Pix" subtitle="Imagem usada no rodapé do PDF de orçamento quando o plano de pagamento for Pix.">
            <UploadBox
              label="QR Code Pix"
              hint="PNG ou JPG · até 2MB"
              value={settings.pix_qrcode_url}
              onUploaded={(url) => save({ pix_qrcode_url: url })}
            />
            <div className="mt-4 grid gap-1.5 max-w-md">
              <Label>Chave Pix</Label>
              <Input defaultValue={settings.pix_chave ?? ""} onBlur={(e) => save({ pix_chave: e.target.value })} />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="usuario" className="mt-5">
          <PerfilForm />
        </TabsContent>

        <TabsContent value="integracoes" className="mt-5 space-y-5">
          <SectionCard
            title={<span className="flex items-center gap-2">Provedor de IA<span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">Premium</span></span>}
            subtitle="Modelo usado para scoring de leads, resumos e sugestões de mensagem."
          >
            <AiProviderToggle value={settings.ai_provider} onChange={(p) => save({ ai_provider: p })} />
          </SectionCard>

          <SectionCard
            title="Base de conhecimento da IA"
            subtitle="Descreva o seu negócio pra IA gerar termos de busca relevantes na prospecção de leads."
          >
            <Textarea
              defaultValue={settings.contexto_negocio ?? ""}
              onBlur={(e) => save({ contexto_negocio: e.target.value })}
              rows={8}
              className="text-sm"
              placeholder="Ex: a empresa atua como intermediária entre quem tem peça hidráulica quebrada e quem presta o serviço de reparo..."
            />
          </SectionCard>

          <SectionCard
            title="Token da API Apify"
            subtitle="Necessário para buscar novos leads automaticamente."
          >
            <ApifyToken />
          </SectionCard>

          <SectionCard
            title="Consumo de APIs"
            subtitle="Acompanhe o uso do mês pra saber quando vale adicionar créditos."
          >
            <ConsumoApis />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmpresaForm({ settings, onSave }: { settings: CompanySettings; onSave: (p: Partial<CompanySettings>) => void }) {
  const [form, setForm] = useState({
    nome: settings.nome ?? "", cnpj: settings.cnpj ?? "", email: settings.email ?? "",
    telefone: settings.telefone ?? "", endereco: settings.endereco ?? "",
  });

  return (
    <SectionCard
      title="Dados da empresa"
      subtitle="Aparecem no PDF de orçamento e no cabeçalho do app."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Razão social</Label>
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>CNPJ</Label>
          <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>E-mail</Label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Telefone</Label>
          <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </div>
        <div className="md:col-span-2 grid gap-1.5">
          <Label>Endereço</Label>
          <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => onSave(form)} className="bg-primary hover:bg-[var(--primary-hover)]">Salvar alterações</Button>
      </div>
    </SectionCard>
  );
}

function SectionCard({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function PerfilForm() {
  const { user, loading, refresh } = useCurrentUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) setNome(((user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined) ?? "");
  }, [user]);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = nome || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  const salvarNome = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: nome } });
    if (error) { toast.error("Erro ao salvar nome", { description: error.message }); return; }
    toast.success("Perfil atualizado");
    refresh();
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "O limite é 2MB." });
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `avatars/${user.id}.${ext}`;
    const { error: upError } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    if (upError) { setUploading(false); toast.error("Erro ao enviar imagem", { description: upError.message }); return; }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    const { error: updError } = await supabase.auth.updateUser({ data: { avatar_url: `${data.publicUrl}?v=${Date.now()}` } });
    setUploading(false);
    if (updError) { toast.error("Erro ao salvar foto", { description: updError.message }); return; }
    toast.success("Foto atualizada");
    refresh();
  };

  if (loading || !user) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  return (
    <SectionCard title="Meu perfil">
      <div className="flex items-center gap-4 mb-5">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-semibold">
            {initials}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <Button variant="outline" className="gap-2" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />{uploading ? "Enviando…" : "Alterar foto"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} onBlur={salvarNome} />
        </div>
        <div className="grid gap-1.5">
          <Label>E-mail</Label>
          <Input value={user.email ?? ""} disabled />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">O e-mail é o usado para login e não pode ser alterado aqui.</p>
    </SectionCard>
  );
}

function UploadBox({
  label, hint, value, onUploaded,
}: { label: string; hint?: string; value?: string | null; onUploaded: (url: string) => void }) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "O limite é 2MB." });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { toast.error("Erro ao enviar imagem", { description: error.message }); return; }
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    onUploaded(data.publicUrl);
    toast.success("Imagem enviada");
  };

  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-[var(--gold)]/40 transition-colors p-6 text-center cursor-pointer"
      >
        {value ? (
          <img src={value} alt={label} className="mx-auto h-16 object-contain" />
        ) : (
          <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" strokeWidth={1.5} />
        )}
        <p className="text-xs mt-2 text-foreground font-medium">
          {uploading ? "Enviando…" : value ? "Clique para substituir" : "Clique para enviar"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{hint ?? "PNG, JPG ou SVG"}</p>
      </div>
    </div>
  );
}

function AiProviderToggle({ value, onChange }: { value: "gemini" | "claude"; onChange: (p: "gemini" | "claude") => void }) {
  const providers = [
    { id: "gemini" as const, name: "Google Gemini", desc: "2.5 Flash · Multimodal · Custo-benefício" },
    { id: "claude" as const, name: "Anthropic Claude", desc: "Sonnet · Raciocínio profundo" },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {providers.map(p => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`relative rounded-xl border p-4 text-left transition-all ${
              active ? "border-[var(--gold)] bg-[var(--gold)]/5 shadow-sm" : "border-border bg-background hover:border-foreground/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 ${active ? "text-[var(--gold)]" : "text-muted-foreground"}`} strokeWidth={1.5} />
                  {p.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
              </div>
              {active && (
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gold)] text-[var(--gold-foreground)]">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ApifyToken() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/leads/status").then(r => r.json()).then(d => setConfigured(d.configured)).catch(() => setConfigured(false));
  }, []);

  return (
    <div className="space-y-3 max-w-xl">
      {configured === null ? (
        <Skeleton className="h-16 rounded-xl" />
      ) : !configured ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-1">Não configurado</div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Sem o token, a busca de leads no CRM ficará indisponível. O token fica configurado
            como variável de ambiente no servidor (<code className="font-mono text-xs">APIFY_API_TOKEN</code>),
            não nesta tela — fale com quem administra o deploy pra adicionar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm text-foreground">Conectado · busca de leads ativa.</p>
        </div>
      )}
    </div>
  );
}

type UsoApi = {
  configured: boolean;
  usageUsd?: number;
  limitUsd?: number;
  cycleEndsAt?: string;
  error?: string;
};

function ConsumoApis() {
  const [data, setData] = useState<{ apify: UsoApi; gemini: { configured: boolean } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/integracoes/uso")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ apify: { configured: false }, gemini: { configured: false } }))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <UsoCard
        nome="Apify"
        desc="Busca de leads (Google Maps Scraper)"
        configured={data.apify.configured}
        error={data.apify.error}
        usageUsd={data.apify.usageUsd}
        limitUsd={data.apify.limitUsd}
        cycleEndsAt={data.apify.cycleEndsAt}
        rechargeUrl="https://console.apify.com/billing"
        rechargeLabel="Adicionar créditos"
      />
      <UsoCard
        nome="Google Gemini"
        desc="Geração de termos de busca e análises de IA"
        configured={data.gemini.configured}
        rechargeUrl="https://aistudio.google.com/usage"
        rechargeLabel="Ver uso e cobrança"
        note="O consumo detalhado não é exposto pela chave de API — confira direto no painel do Google."
      />
    </div>
  );
}

function UsoCard({
  nome, desc, configured, error, usageUsd, limitUsd, cycleEndsAt, rechargeUrl, rechargeLabel, note,
}: {
  nome: string;
  desc: string;
  configured: boolean;
  error?: string;
  usageUsd?: number;
  limitUsd?: number;
  cycleEndsAt?: string;
  rechargeUrl: string;
  rechargeLabel: string;
  note?: string;
}) {
  const pct = usageUsd != null && limitUsd ? Math.min(100, (usageUsd / limitUsd) * 100) : null;
  const proximoLimite = pct !== null && pct >= 80;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-medium text-foreground text-sm flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
            {nome}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </div>
        <a href={rechargeUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />{rechargeLabel}
          </Button>
        </a>
      </div>

      {!configured ? (
        <p className="text-xs text-muted-foreground">Não configurado.</p>
      ) : error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : pct !== null ? (
        <>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${proximoLimite ? "bg-rose-500" : "bg-[var(--gold)]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>${usageUsd!.toFixed(2)} de ${limitUsd!.toFixed(2)} usados neste ciclo</span>
            {cycleEndsAt && <span>Renova em {new Date(cycleEndsAt).toLocaleDateString("pt-BR")}</span>}
          </div>
          {proximoLimite && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Perto do limite do mês — considere adicionar créditos.
            </p>
          )}
        </>
      ) : note ? (
        <p className="text-xs text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}
