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
  itensOrcados: z.array(z.string()).describe("Itens/peças/serviços já orçados pra esse cliente, com a quantidade e o status do orçamento."),
  observacoesOrcamentos: z.array(z.string()).describe("Observações livres anotadas nos orçamentos desse cliente."),
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
- Itens/peças/serviços já orçados: ${input.itensOrcados.length > 0 ? input.itensOrcados.join("; ") : "nenhum item registrado"}
- Observações anotadas nos orçamentos: ${input.observacoesOrcamentos.length > 0 ? input.observacoesOrcamentos.join("; ") : "nenhuma"}

Avalie o risco de perda desse cliente (baixo/medio/alto) e escreva um resumo curto do comportamento dele.

Para as oportunidades de upsell, baseie-se EXCLUSIVAMENTE nos itens/peças/serviços já orçados acima — sugira peças complementares, consumíveis recorrentes, manutenção preventiva da MESMA linha de equipamento, ou upgrade de uma peça específica que ele já comprou. Não sugira nada genérico ou desconectado do que ele realmente orçou. Se a lista de itens orçados estiver vazia ou for muito genérica pra sugerir algo concreto, retorne uma lista vazia e diga no resumo que não há histórico suficiente pra recomendar upsell.`,
      output: { schema: outputSchema },
    });
    return output!;
  },
);
