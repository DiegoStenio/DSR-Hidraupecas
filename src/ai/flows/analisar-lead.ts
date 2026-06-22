import { ai } from "@/ai/genkit";
import { z } from "genkit";

const inputSchema = z.object({
  contextoNegocio: z.string().optional(),
  empresa: z.string(),
  categoria: z.string().optional(),
  tipoNegocio: z.enum(["cliente", "parceiro"]).nullable().optional(),
  temTelefone: z.boolean(),
  temSite: z.boolean(),
  temEndereco: z.boolean(),
  avaliacao: z.number().nullable().optional(),
});

const outputSchema = z.object({
  score: z.enum(["alto", "medio", "baixo"]).describe("Potencial do lead com base nos dados disponíveis."),
  justificativa: z.string().describe("1 a 2 frases em português explicando o motivo do score."),
  sugestaoWhatsapp: z.string().describe(
    "Mensagem curta e natural em português pra um primeiro contato via WhatsApp com esse lead, sem soar genérica ou robótica.",
  ),
});

export const analisarLeadFlow = ai.defineFlow(
  {
    name: "analisarLead",
    inputSchema,
    outputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Você avalia leads de prospecção para uma empresa de peças hidráulicas que intermedia clientes (empresas com equipamentos que quebram) e parceiros (prestadores que fazem o reparo).

${input.contextoNegocio ? `Contexto do negócio: ${input.contextoNegocio}\n` : ""}
Lead a avaliar:
- Empresa: ${input.empresa}
- Categoria/ramo: ${input.categoria ?? "não informado"}
- Perfil: ${input.tipoNegocio === "parceiro" ? "parceiro (prestador de serviço)" : input.tipoNegocio === "cliente" ? "cliente em potencial" : "não classificado"}
- Tem telefone cadastrado: ${input.temTelefone ? "sim" : "não"}
- Tem site: ${input.temSite ? "sim" : "não"}
- Tem endereço completo: ${input.temEndereco ? "sim" : "não"}
- Avaliação no Google: ${input.avaliacao != null ? `${input.avaliacao.toFixed(1)}/5` : "sem avaliação"}

Dê um score de potencial (alto/medio/baixo), uma justificativa curta, e sugira uma mensagem de WhatsApp pra primeiro contato — direta, profissional, sem clichê de vendedor.`,
      output: { schema: outputSchema },
    });
    return output!;
  },
);
