"use client";

import { useState } from "react";
import { Eye, EyeOff, Sparkles, Upload, Image as ImageIcon, Crown, Check } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ConfigPage() {
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
          <SectionCard
            title="Dados da empresa"
            subtitle="Aparecem no PDF de orçamento e no cabeçalho do app."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Razão social" defaultValue="DSR-Hidraupecas Ltda." />
              <Field label="CNPJ" defaultValue="22.345.678/0001-90" />
              <Field label="E-mail" defaultValue="contato@dsrhidraupecas.com.br" />
              <Field label="Telefone" defaultValue="+55 11 3344-5566" />
              <div className="md:col-span-2">
                <Field label="Endereço" defaultValue="R. das Indústrias 1240, Guarulhos/SP, CEP 07020-100" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <UploadBox label="Logo / cabeçalho do PDF" />
              <UploadBox label="Imagem de fundo do app" />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="pagamento" className="mt-5">
          <SectionCard title="QR Code Pix" subtitle="Imagem usada no rodapé do PDF de orçamento.">
            <UploadBox label="QR Code Pix" hint="PNG ou JPG · até 2MB" />
            <div className="mt-4 grid gap-1.5 max-w-md">
              <Label>Chave Pix</Label>
              <Input defaultValue="22.345.678/0001-90" />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="usuario" className="mt-5">
          <SectionCard title="Meu perfil">
            <div className="flex items-center gap-4 mb-5">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-semibold">AS</div>
              <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" />Alterar foto</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome" defaultValue="Ana Silva" />
              <Field label="E-mail" defaultValue="ana.silva@dsrhidraupecas.com.br" />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="integracoes" className="mt-5 space-y-5">
          <SectionCard
            title={<span className="flex items-center gap-2">Provedor de IA<span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">Premium</span></span>}
            subtitle="Modelo usado para scoring de leads, resumos e sugestões de mensagem."
          >
            <AiProviderToggle />
          </SectionCard>

          <SectionCard
            title="Token da API Apify"
            subtitle="Necessário para buscar novos leads automaticamente."
          >
            <ApifyToken />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
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

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}

function UploadBox({ label, hint }: { label: string; hint?: string }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-[var(--gold)]/40 transition-colors p-6 text-center cursor-pointer">
        <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" strokeWidth={1.5} />
        <p className="text-xs mt-2 text-foreground font-medium">Clique para enviar</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{hint ?? "PNG, JPG ou SVG"}</p>
      </div>
    </div>
  );
}

function AiProviderToggle() {
  const [provider, setProvider] = useState<"gemini" | "claude">("gemini");
  const providers = [
    { id: "gemini" as const, name: "Google Gemini", desc: "1.5 Pro · Multimodal · Custo-benefício" },
    { id: "claude" as const, name: "Anthropic Claude", desc: "3.5 Sonnet · Raciocínio profundo" },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {providers.map(p => {
        const active = provider === p.id;
        return (
          <button
            key={p.id}
            onClick={() => { setProvider(p.id); toast.success(`${p.name} ativado`); }}
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
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const isEmpty = !token.trim();

  return (
    <div className="space-y-3 max-w-xl">
      <div className="grid gap-1.5">
        <Label>API Token</Label>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="apify_api_..."
            className="pr-11 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {isEmpty ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-1">Não configurado</div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Sem o token, a busca de leads no CRM ficará indisponível.
            Gere um token em <span className="font-medium">apify.com → Settings → Integrations</span> e cole aqui.
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
