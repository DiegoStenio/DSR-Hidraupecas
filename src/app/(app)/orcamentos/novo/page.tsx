"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, Trash2, FileText, Share2, TicketPercent, DollarSign, NotebookText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, ItemOrcamento, PlanoPagamento, Vendedor } from "@/lib/supabase/types";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const parseBRL = (v: string) => parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;
const formatBRL = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type ItemRow = ItemOrcamento & { id: string };
type BudgetType = "items" | "group";

export default function NovoOrcamentoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <NovoOrcamentoForm />
    </Suspense>
  );
}

function NovoOrcamentoForm() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const orcamentoId = searchParams.get("id");
  const isEdit = Boolean(orcamentoId);
  const [numero, setNumero] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [planos, setPlanos] = useState<PlanoPagamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [clienteId, setClienteId] = useState("");
  const [vendedorId, setVendedorId] = useState("");

  const [budgetType, setBudgetType] = useState<BudgetType>("items");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [newDesc, setNewDesc] = useState("");
  const [newQtdInput, setNewQtdInput] = useState("1");
  const [newValorInput, setNewValorInput] = useState("");

  const [groupQuantityInput, setGroupQuantityInput] = useState("1");
  const groupQuantity = parseInt(groupQuantityInput, 10) || 0;
  const [groupUnitPrice, setGroupUnitPrice] = useState(0);
  const [groupUnitPriceInput, setGroupUnitPriceInput] = useState("");

  const [descontoInput, setDescontoInput] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [observacao, setObservacao] = useState("");

  const [planoId, setPlanoId] = useState<string>("");
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("vendedores").select("*").order("nome"),
      supabase.from("planos_pagamento").select("*").order("nome"),
      orcamentoId
        ? supabase.from("orcamentos").select("*").eq("id", orcamentoId).single()
        : Promise.resolve({ data: null }),
    ]).then(([c, v, p, o]) => {
      setClientes(c.data ?? []);
      setVendedores(v.data ?? []);
      setPlanos(p.data ?? []);

      if (o.data) {
        const orc = o.data;
        setNumero(orc.numero);
        setClienteId(orc.cliente_id ?? "");
        setVendedorId(orc.vendedor_id ?? "");
        setBudgetType(orc.budget_type);
        setItems((orc.itens ?? []).map((it: ItemOrcamento) => ({ ...it, id: crypto.randomUUID() })));
        setGroupQuantityInput(String(orc.group_quantity ?? 1));
        setGroupUnitPrice(orc.group_unit_price ?? 0);
        setGroupUnitPriceInput(orc.group_unit_price ? formatBRL(orc.group_unit_price) : "");
        setDesconto(orc.desconto);
        setDescontoInput(orc.desconto > 0 ? formatBRL(orc.desconto) : "");
        setObservacao(orc.observacao ?? "");
        const plano = orc.plano_id
          ? p.data?.find(pl => pl.id === orc.plano_id)
          : p.data?.find(pl => pl.nome === orc.plano);
        setPlanoId(plano?.id ?? "");
        setInstallmentsCount(orc.installments_count ?? 1);
      } else {
        setClienteId(c.data?.[0]?.id ?? "");
        setVendedorId(v.data?.[0]?.id ?? "");
      }
      setLoading(false);
    });
  }, [supabase, orcamentoId]);

  const planoSelecionado = useMemo(() => planos.find(p => p.id === planoId), [planos, planoId]);

  useEffect(() => {
    if (!planoSelecionado || planoSelecionado.parcelas <= 1) setInstallmentsCount(1);
  }, [planoSelecionado]);

  const subtotal = budgetType === "group" ? groupUnitPrice * groupQuantity : items.reduce((s, i) => s + i.valor, 0);
  const total = Math.max(0, subtotal - desconto);

  const handleValorChange = (raw: string, setVal: (n: number) => void, setInput: (s: string) => void) => {
    const sanitized = raw.replace(/[^0-9,]/g, "");
    const parts = sanitized.split(",");
    const final = parts.length > 2 ? `${parts[0]},${parts.slice(1).join("")}` : sanitized;
    setInput(final);
    setVal(parseBRL(final));
  };

  const handleAddItem = () => {
    if (!newDesc.trim()) { toast.error("Forneça uma descrição para o serviço."); return; }
    if (budgetType === "items") {
      const valorUnit = parseBRL(newValorInput);
      const newQtd = parseInt(newQtdInput, 10) || 0;
      if (valorUnit <= 0) { toast.error("Forneça um valor unitário positivo."); return; }
      if (newQtd <= 0) { toast.error("Forneça uma quantidade positiva."); return; }
      setItems([...items, { id: crypto.randomUUID(), descricao: newDesc.trim(), qtd: newQtd, valor: newQtd * valorUnit }]);
    } else {
      setItems([...items, { id: crypto.randomUUID(), descricao: newDesc.trim(), qtd: 1, valor: 0 }]);
    }
    setNewDesc(""); setNewValorInput(""); setNewQtdInput("1");
  };

  const handleSave = async (after?: "pdf" | "whatsapp") => {
    const cliente = clientes.find(c => c.id === clienteId);
    const vendedor = vendedores.find(v => v.id === vendedorId);
    if (!cliente || !vendedor || (budgetType === "group" && groupUnitPrice <= 0) || (budgetType === "items" && items.length === 0)) {
      toast.error("Informações incompletas", {
        description: budgetType === "group" && groupUnitPrice <= 0
          ? "Insira um valor unitário para o grupo de serviços."
          : "Selecione cliente, vendedor e adicione pelo menos um item.",
      });
      return;
    }

    setSaving(true);
    const payload = {
      cliente_id: cliente.id, cliente_nome: cliente.nome,
      vendedor_id: vendedor.id, vendedor_nome: vendedor.nome,
      total, desconto, status: "pendente" as const,
      plano: planoSelecionado?.nome ?? null,
      plano_id: planoSelecionado?.id ?? null,
      itens: items.map(({ descricao, qtd, valor }) => ({ descricao, qtd, valor })),
      budget_type: budgetType,
      group_unit_price: budgetType === "group" ? groupUnitPrice : null,
      group_quantity: budgetType === "group" ? groupQuantity : null,
      observacao: observacao || null,
      installments_count: planoSelecionado && planoSelecionado.parcelas > 1 ? installmentsCount : null,
    };

    const { data, error } = isEdit
      ? await supabase.from("orcamentos").update(payload).eq("id", orcamentoId!).select().single()
      : await supabase.from("orcamentos").insert({
          ...payload,
          numero: `ORC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          data: new Date().toISOString().slice(0, 10),
        }).select().single();
    setSaving(false);

    if (error) { toast.error("Erro ao salvar orçamento", { description: error.message }); return; }

    if (after === "whatsapp") {
      if (vendedor.whatsapp) {
        const message = encodeURIComponent(`Olá ${cliente.nome}, aqui está seu orçamento #${data.numero} com um total de ${fmt(total)}. Por favor me avise se tiver alguma dúvida.`);
        window.open(`https://wa.me/${vendedor.whatsapp.replace(/\D/g, "")}?text=${message}`, "_blank");
      } else {
        toast.error("Número do WhatsApp não encontrado", { description: "O vendedor selecionado não possui WhatsApp cadastrado." });
      }
    }

    toast.success(isEdit ? "Orçamento atualizado" : "Orçamento criado", { description: `Orçamento ${data.numero} foi salvo com sucesso.` });

    if (after === "pdf") router.push(`/orcamentos/${data.id}/imprimir`);
    else router.push("/orcamentos");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={isEdit ? "Editar Orçamento" : "Criar Novo Orçamento"} />
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? `Editar Orçamento${numero ? ` · ${numero}` : ""}` : "Criar Novo Orçamento"} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Envolvidos</CardTitle>
            <CardDescription>Selecione o cliente e o vendedor para este orçamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Combobox
                id="cliente"
                options={clientes.map(c => ({ value: c.id, label: `${c.nome} — ${c.documento}` }))}
                value={clienteId}
                onSelect={setClienteId}
                placeholder="Selecione um cliente"
                searchPlaceholder="Buscar por nome ou CPF/CNPJ…"
                notFoundMessage="Nenhum cliente encontrado."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor</Label>
              <Select value={vendedorId} onValueChange={setVendedorId}>
                <SelectTrigger id="vendedor"><SelectValue placeholder="Selecione um vendedor" /></SelectTrigger>
                <SelectContent>
                  {vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Itens do Serviço</CardTitle>
            <CardDescription>Adicione os serviços incluídos neste orçamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Precificação</Label>
              <RadioGroup
                value={budgetType}
                onValueChange={(v) => { setBudgetType(v as BudgetType); setItems([]); }}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="items" id="rb-items" />
                  <Label htmlFor="rb-items">Item a item</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="rb-group" />
                  <Label htmlFor="rb-group">Grupo de serviços</Label>
                </div>
              </RadioGroup>
            </div>

            {budgetType === "items" ? (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_150px_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label htmlFor="item-desc">Descrição</Label>
                  <Textarea
                    id="item-desc"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Ex: Manutenção de sistema hidráulico"
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="item-qtd">Qtd.</Label>
                  <Input id="item-qtd" inputMode="numeric" value={newQtdInput} onChange={(e) => setNewQtdInput(e.target.value.replace(/[^0-9]/g, ""))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="item-valor">Vlr. Unit. (R$)</Label>
                  <Input id="item-valor" value={newValorInput} onChange={(e) => setNewValorInput(e.target.value)} placeholder="Ex: 1.500,00" />
                </div>
                <Button onClick={handleAddItem} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Item</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label htmlFor="item-desc-group">Descrição do grupo</Label>
                  <Textarea
                    id="item-desc-group"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Ex: Manutenção preventiva completa"
                    className="min-h-[60px]"
                  />
                </div>
                <Button onClick={handleAddItem} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Item</Button>
              </div>
            )}

            <Separator />

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado ainda.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-2 rounded-md bg-muted">
                    <div className="flex-1">
                      <span className="font-medium whitespace-pre-wrap">{item.descricao}</span>
                      {budgetType === "items" && item.qtd > 1 && (
                        <p className="text-sm text-muted-foreground">{item.qtd} x {fmt(item.valor / item.qtd)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {budgetType === "items" && <span className="font-semibold">{fmt(item.valor)}</span>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 border-t pt-6">
            {budgetType === "items" && (
              <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
            )}
            {budgetType === "group" && (
              <>
                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                  <Label htmlFor="group-qtd" className="flex items-center gap-2 cursor-pointer"><PlusCircle className="h-4 w-4" />Quantidade de Serviço</Label>
                  <Input id="group-qtd" inputMode="numeric" value={groupQuantityInput} onChange={(e) => setGroupQuantityInput(e.target.value.replace(/[^0-9]/g, ""))} className="max-w-[150px] text-right" />
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                  <Label htmlFor="group-valor" className="flex items-center gap-2 cursor-pointer"><DollarSign className="h-4 w-4" />Valor Total Unitário (R$)</Label>
                  <Input id="group-valor" value={groupUnitPriceInput} onChange={(e) => handleValorChange(e.target.value, setGroupUnitPrice, setGroupUnitPriceInput)} onBlur={() => setGroupUnitPriceInput(groupUnitPrice > 0 ? formatBRL(groupUnitPrice) : "")} className="max-w-[150px] text-right" placeholder="0,00" />
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
              <Label htmlFor="desconto" className="flex items-center gap-2 cursor-pointer"><TicketPercent className="h-4 w-4" />Desconto (R$)</Label>
              <Input id="desconto" value={descontoInput} onChange={(e) => handleValorChange(e.target.value, setDesconto, setDescontoInput)} onBlur={() => setDescontoInput(desconto > 0 ? formatBRL(desconto) : "")} className="max-w-[120px] text-right" placeholder="0,00" />
            </div>
            <div className="flex justify-between items-center text-lg font-semibold text-foreground">
              <span>Total</span><span className="font-display">{fmt(total)}</span>
            </div>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Observações e Pagamento</CardTitle>
            <CardDescription>Adicione observações e selecione um plano de pagamento.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="observacao" className="flex items-center gap-2"><NotebookText className="h-4 w-4" />Observações do Orçamento</Label>
              <Textarea id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Detalhes sobre o serviço, prazos, condições especiais, etc." className="h-32" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plano">Plano de Pagamento</Label>
                <Select value={planoId} onValueChange={setPlanoId}>
                  <SelectTrigger id="plano"><SelectValue placeholder="Selecione um plano (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {planos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {planoSelecionado && planoSelecionado.parcelas > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="parcelas">Parcelas</Label>
                  <Select value={String(installmentsCount)} onValueChange={(v) => setInstallmentsCount(Number(v))}>
                    <SelectTrigger id="parcelas"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: planoSelecionado.parcelas }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={String(n)}>{n}x de {fmt(total / n)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="gap-2 border-t pt-6 flex-wrap">
            <Button disabled={saving} onClick={() => handleSave()} className="flex-1 gap-2 bg-primary hover:bg-[var(--primary-hover)]">
              <FileText className="h-4 w-4" />{saving ? "Salvando…" : isEdit ? "Salvar Alterações" : "Salvar Orçamento"}
            </Button>
            <Button disabled={saving} onClick={() => handleSave("pdf")} variant="outline" className="flex-1 gap-2">
              <FileText className="h-4 w-4" />Salvar e Gerar PDF
            </Button>
            <Button disabled={saving} onClick={() => handleSave("whatsapp")} variant="outline" className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />Compartilhar no WhatsApp
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
