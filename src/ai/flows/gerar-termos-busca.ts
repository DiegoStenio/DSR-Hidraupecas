import { ai } from "@/ai/genkit";
import { z } from "genkit";

const inputSchema = z.object({
  contextoNegocio: z.string(),
  nicho: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

const outputSchema = z.object({
  termosClientes: z.array(z.string()).describe(
    "Termos de busca no Google Maps pra achar empresas que TÊM peças/equipamentos hidráulicos que quebram e precisam de reparo (clientes em potencial).",
  ),
  termosParceiros: z.array(z.string()).describe(
    "Termos de busca no Google Maps pra achar prestadores de serviço que ARRUMAM peças hidráulicas (parceiros em potencial).",
  ),
});

export const gerarTermosBuscaFlow = ai.defineFlow(
  {
    name: "gerarTermosBusca",
    inputSchema,
    outputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Você ajuda uma empresa a prospectar leads no Google Maps.

Contexto do negócio:
${input.contextoNegocio}

${input.nicho ? `O usuário sugeriu o termo/nicho: "${input.nicho}" — use isso como ponto de partida, mas não se limite a ele.` : ""}
${input.cidade ? `Região de interesse: ${input.cidade}${input.estado ? `, ${input.estado}` : ""} (não inclua a cidade nos termos, só o tipo de negócio/nicho).` : ""}

Gere de 4 a 6 termos de busca curtos e específicos (em português, como alguém digitaria no Google Maps) para CADA um dos dois perfis abaixo:

1. CLIENTES: tipos de empresa que possuem equipamentos/peças hidráulicas que quebram e precisam de reparo.
2. PARCEIROS: tipos de prestador de serviço que reparam peças hidráulicas.

Os termos devem ser variados (não repetir a mesma ideia com sinônimos óbvios) e realistas para buscar no Google Maps.`,
      output: { schema: outputSchema },
    });
    return output!;
  },
);
