import { ai } from "@/ai/genkit";
import { z } from "genkit";

const inputSchema = z.object({
  contextoNegocio: z.string().optional(),
  orcamentosTotais: z.number(),
  orcamentosPendentes: z.number(),
  orcamentosRealizadosQtd: z.number(),
  orcamentosRealizadosValor: z.number(),
  clientesCount: z.number(),
  prestadoresCount: z.number(),
  funilLeads: z.array(z.object({ label: z.string(), qtd: z.number() })),
  leadsArquivadosCount: z.number(),
});

const outputSchema = z.object({
  resumo: z.string().describe(
    "Resumo executivo em português, 3 a 5 frases em prosa, destacando números-chave, riscos/oportunidades e uma próxima ação concreta sugerida.",
  ),
});

export const resumoDashboardFlow = ai.defineFlow(
  {
    name: "resumoDashboard",
    inputSchema,
    outputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Você é um analista de negócios gerando o resumo executivo do dashboard de uma empresa de peças hidráulicas.

${input.contextoNegocio ? `Contexto do negócio: ${input.contextoNegocio}\n` : ""}
Dados atuais:
- Orçamentos: ${input.orcamentosTotais} totais, ${input.orcamentosPendentes} pendentes, ${input.orcamentosRealizadosQtd} realizados somando ${input.orcamentosRealizadosValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.
- ${input.clientesCount} clientes cadastrados e ${input.prestadoresCount} prestadores de serviço (parceiros) cadastrados.
- Funil de leads no CRM: ${input.funilLeads.map((f) => `${f.label}: ${f.qtd}`).join(", ")}.
- ${input.leadsArquivadosCount} atendimentos finalizados (arquivados) no total.

Escreva um resumo executivo de 3 a 5 frases em português, em prosa natural (não liste os números cru) — destaque o que está indo bem, o que merece atenção, e termine sugerindo uma próxima ação concreta e específica.`,
      output: { schema: outputSchema },
    });
    return output!;
  },
);
