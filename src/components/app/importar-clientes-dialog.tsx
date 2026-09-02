"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Cliente } from "@/lib/supabase/types";
import { toast } from "sonner";

type CampoCliente =
  | "nome" | "nome_fantasia" | "documento" | "ie_rg" | "telefone" | "email"
  | "cep" | "logradouro" | "numero" | "bairro" | "cidade" | "estado" | "observacoes" | "tipo";

const CAMPOS: { campo: CampoCliente; label: string; obrigatorio?: boolean }[] = [
  { campo: "nome", label: "Nome / Razão social", obrigatorio: true },
  { campo: "documento", label: "CPF / CNPJ", obrigatorio: true },
  { campo: "tipo", label: "Tipo (PF/PJ)" },
  { campo: "nome_fantasia", label: "Nome fantasia" },
  { campo: "ie_rg", label: "IE / RG" },
  { campo: "telefone", label: "Telefone" },
  { campo: "email", label: "E-mail" },
  { campo: "cep", label: "CEP" },
  { campo: "logradouro", label: "Logradouro" },
  { campo: "numero", label: "Número" },
  { campo: "bairro", label: "Bairro" },
  { campo: "cidade", label: "Cidade" },
  { campo: "estado", label: "Estado" },
  { campo: "observacoes", label: "Observações" },
];

const ALIASES: Record<CampoCliente, string[]> = {
  nome: ["nome", "razao social", "razão social", "cliente", "nome do cliente", "nome completo"],
  nome_fantasia: ["nome fantasia", "fantasia"],
  documento: ["documento", "cpf", "cnpj", "cpf/cnpj", "cpf cnpj"],
  ie_rg: ["ie", "rg", "inscricao estadual", "inscrição estadual"],
  telefone: ["telefone", "celular", "fone", "whatsapp", "contato"],
  email: ["email", "e-mail"],
  cep: ["cep"],
  logradouro: ["endereco", "endereço", "logradouro", "rua"],
  numero: ["numero", "número", "nº", "n"],
  bairro: ["bairro"],
  cidade: ["cidade", "municipio", "município"],
  estado: ["estado", "uf"],
  observacoes: ["observacoes", "observações", "obs", "observação"],
  tipo: ["tipo", "tipo pessoa", "pf/pj", "pf ou pj"],
};

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const soDigitos = (s: string) => s.replace(/\D/g, "");

type Etapa = "upload" | "mapeamento" | "resultado";
type Mapeamento = Partial<Record<CampoCliente, string>>;

export function ImportarClientesDialog({
  open, onClose, onImportado,
}: { open: boolean; onClose: () => void; onImportado: (novos: Cliente[]) => void }) {
  const supabase = createClient();
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapeamento, setMapeamento] = useState<Mapeamento>({});
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ importados: number; duplicados: number; invalidos: number } | null>(null);

  const reset = () => {
    setEtapa("upload"); setHeaders([]); setRows([]); setMapeamento({}); setResultado(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const baixarModelo = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nome", "CPF/CNPJ", "Tipo", "Telefone", "E-mail", "Cidade", "Estado", "CEP", "Logradouro", "Número", "Bairro"],
      ["Construtora Exemplo Ltda.", "12.345.678/0001-90", "PJ", "(11) 99999-0000", "contato@exemplo.com.br", "Guarulhos", "SP", "07000-000", "Rua Exemplo", "100", "Centro"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo-importacao-clientes.xlsx");
  };

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
      if (json.length === 0) { toast.error("Planilha vazia", { description: "Não encontrei nenhuma linha de dados." }); return; }
      const hdrs = Object.keys(json[0]);

      const auto: Mapeamento = {};
      for (const { campo } of CAMPOS) {
        const alvo = hdrs.find(h => ALIASES[campo].includes(normalizar(h)));
        if (alvo) auto[campo] = alvo;
      }

      setHeaders(hdrs);
      setRows(json);
      setMapeamento(auto);
      setEtapa("mapeamento");
    } catch (err) {
      toast.error("Erro ao ler o arquivo", { description: err instanceof Error ? err.message : "Verifique se é um .xlsx, .xls ou .csv válido." });
    }
  };

  const linhasProcessadas = useMemo(() => {
    return rows.map((row) => {
      const get = (campo: CampoCliente) => {
        const col = mapeamento[campo];
        if (!col) return "";
        return String(row[col] ?? "").trim();
      };
      const nome = get("nome");
      const documento = get("documento");
      const documentoDigitos = soDigitos(documento);
      let tipo = get("tipo").toUpperCase();
      if (tipo !== "PF" && tipo !== "PJ") {
        tipo = documentoDigitos.length === 11 ? "PF" : "PJ";
      }
      const valido = nome.length > 0 && documento.length > 0;
      return {
        valido,
        tipo: tipo as "PF" | "PJ",
        nome, nome_fantasia: get("nome_fantasia") || null,
        documento, ie_rg: get("ie_rg") || null,
        telefone: get("telefone") || null, email: get("email") || null,
        cep: get("cep") || null, logradouro: get("logradouro") || null,
        numero: get("numero") || null, bairro: get("bairro") || null,
        cidade: get("cidade") || null, estado: get("estado") || null,
        observacoes: get("observacoes") || null,
      };
    });
  }, [rows, mapeamento]);

  const resumo = useMemo(() => {
    const validos = linhasProcessadas.filter(l => l.valido);
    const vistos = new Set<string>();
    const semDuplicata = validos.filter(l => {
      const chave = soDigitos(l.documento);
      if (!chave || vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
    return {
      total: linhasProcessadas.length,
      invalidos: linhasProcessadas.length - validos.length,
      duplicadosNoArquivo: validos.length - semDuplicata.length,
      prontos: semDuplicata,
    };
  }, [linhasProcessadas]);

  const camposFaltando = CAMPOS.filter(c => c.obrigatorio && !mapeamento[c.campo]);

  const handleImportar = async () => {
    setImportando(true);

    const { data: existentes } = await supabase.from("clientes").select("documento");
    const existentesSet = new Set((existentes ?? []).map(c => soDigitos(c.documento)));

    const paraInserir = resumo.prontos.filter(l => !existentesSet.has(soDigitos(l.documento)));
    const duplicadosNoBanco = resumo.prontos.length - paraInserir.length;

    const inseridos: Cliente[] = [];
    const tamanhoLote = 300;
    for (let i = 0; i < paraInserir.length; i += tamanhoLote) {
      const lote = paraInserir.slice(i, i + tamanhoLote).map(({ valido, ...c }) => c);
      const { data, error } = await supabase.from("clientes").insert(lote).select();
      if (error) {
        toast.error("Erro ao importar", { description: error.message });
        setImportando(false);
        return;
      }
      if (data) inseridos.push(...data);
    }

    setImportando(false);
    setResultado({
      importados: inseridos.length,
      duplicados: resumo.duplicadosNoArquivo + duplicadosNoBanco,
      invalidos: resumo.invalidos,
    });
    setEtapa("resultado");
    if (inseridos.length > 0) onImportado(inseridos);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar clientes via Excel</DialogTitle>
          <DialogDescription>
            {etapa === "upload" && "Envie uma planilha .xlsx, .xls ou .csv com sua base de clientes."}
            {etapa === "mapeamento" && "Confira se as colunas foram identificadas corretamente."}
            {etapa === "resultado" && "Importação concluída."}
          </DialogDescription>
        </DialogHeader>

        {etapa === "upload" && (
          <div className="space-y-4 py-2">
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">Clique para selecionar o arquivo</span>
              <span className="text-xs text-muted-foreground">.xlsx, .xls ou .csv</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </label>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={baixarModelo}>
              <Download className="h-3.5 w-3.5" />Baixar modelo de planilha
            </Button>
          </div>
        )}

        {etapa === "mapeamento" && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              {rows.length} linha(s) encontrada(s) na planilha
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAMPOS.map(({ campo, label, obrigatorio }) => (
                <div key={campo} className="grid gap-1.5">
                  <Label className="text-xs">
                    {label}{obrigatorio && <span className="text-destructive"> *</span>}
                  </Label>
                  <Select
                    value={mapeamento[campo] ?? "__none__"}
                    onValueChange={(v) => setMapeamento(m => ({ ...m, [campo]: v === "__none__" ? undefined : v }))}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Não importar</SelectItem>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {camposFaltando.length > 0 ? (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 text-destructive p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                Selecione as colunas de {camposFaltando.map(c => c.label).join(" e ")} pra continuar.
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
                <p><strong className="text-foreground">{resumo.prontos.length}</strong> cliente(s) prontos pra importar.</p>
                {resumo.invalidos > 0 && <p>{resumo.invalidos} linha(s) sem nome ou documento — serão ignoradas.</p>}
                {resumo.duplicadosNoArquivo > 0 && <p>{resumo.duplicadosNoArquivo} duplicata(s) dentro da própria planilha — só a primeira ocorrência será usada.</p>}
              </div>
            )}
          </div>
        )}

        {etapa === "resultado" && resultado && (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-lg font-semibold text-foreground">{resultado.importados} cliente(s) importado(s)</p>
            {(resultado.duplicados > 0 || resultado.invalidos > 0) && (
              <p className="text-sm text-muted-foreground">
                {resultado.duplicados > 0 && `${resultado.duplicados} ignorado(s) por já existirem (mesmo CPF/CNPJ). `}
                {resultado.invalidos > 0 && `${resultado.invalidos} ignorado(s) por faltar nome ou documento.`}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {etapa === "mapeamento" && (
            <>
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button
                disabled={camposFaltando.length > 0 || importando || resumo.prontos.length === 0}
                onClick={handleImportar}
                className="gap-2 bg-primary hover:bg-[var(--primary-hover)]"
              >
                {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importando ? "Importando…" : `Importar ${resumo.prontos.length} cliente(s)`}
              </Button>
            </>
          )}
          {etapa === "resultado" && (
            <Button onClick={handleClose} className="bg-primary hover:bg-[var(--primary-hover)]">Concluir</Button>
          )}
          {etapa === "upload" && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
