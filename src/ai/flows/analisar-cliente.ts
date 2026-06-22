import { ai } from "@/ai/genkit";
import { z } from "genkit";

const inputSchema = z.object({
  contextoNegocio: z.string().optional(),
  nome: z.string(),
  tipo: z.enum(["PF", "PJ"]),
  cidade: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  totalOrcamentos: z.number(),
  orcamentosRealizados: z.number(),
  orcamentosPendentes: z.number(),
  valorTotalRealizado: z.number(),
  diasDesdeUltimoOrcamento: z.number().nullable().optional(),
});

const outputSchema = z.object({
  risco: z.enum(["baixo", "medio", "alto"]).describe("Risco de perda/churn desse cliente."),
  resumo: z.string().describe("2 a 3 frases em português resumindo o histórico e o comportamento desse cliente."),
  upsell: z.array(z.string()).describe(
    "0 a 3 oportunidades concretas de upsell/cross-sell pra esse cliente, frases curtas e específicas.",
  ),
});

export const analisarClienteFlow = ai.defineFlow(
  {
    name: "analisarCliente",
    inputSchema,
    outputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Você avalia clientes de uma empresa de peças hidráulicas, pra identificar risco de perda e oportunidades de venda.

${input.contextoNegocio ? `Contexto do negócio: ${input.contextoNegocio}\n` : ""}
Cliente a avaliar:
- Nome: ${input.nome} (${input.tipo === "PJ" ? "pessoa jurídica" : "pessoa física"})
- Cidade: ${input.cidade ?? "não informado"}
- Observações cadastradas: ${input.observacoes || "nenhuma"}
- Total de orçamentos: ${input.totalOrcamentos} (${input.orcamentosRealizados} realizados, ${input.orcamentosPendentes} pendentes)
- Valor total já realizado: ${input.valorTotalRealizado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
- Dias desde o último orçamento: ${input.diasDesdeUltimoOrcamento ?? "nunca teve orçamento"}

Avalie o risco de perda desse cliente (baixo/medio/alto), escreva um resumo curto do comportamento dele, e sugira de 0 a 3 oportunidades concretas de upsell ou reativação. Se não houver histórico suficiente, diga isso no resumo e não force oportunidades genéricas.`,
      output: { schema: outputSchema },
    });
    return output!;
  },
);
