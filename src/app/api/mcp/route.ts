import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { buscarLeadsApify } from "@/lib/apify-leads";
import { analisarLeadEPersiste, analisarClienteEPersiste } from "@/lib/ai-analise";

const supabase = createAdminClient();

const handler = createMcpHandler(
  (server) => {
    // --- Leads ---

    server.tool(
      "listar_leads",
      "Lista leads do CRM, com filtros opcionais. Use pra ver o que já existe antes de criar ou analisar.",
      {
        tipo_negocio: z.enum(["cliente", "parceiro"]).optional().describe("Filtra por perfil do lead."),
        arquivado: z.boolean().optional().describe("Filtra por leads arquivados (atendimento finalizado) ou ativos."),
        busca: z.string().optional().describe("Busca por nome da empresa (parcial, case-insensitive)."),
      },
      async ({ tipo_negocio, arquivado, busca }) => {
        let query = supabase.from("leads").select("id, empresa, contato, telefone, email, categoria, tipo_negocio, score, arquivado, etapa_id");
        if (tipo_negocio) query = query.eq("tipo_negocio", tipo_negocio);
        if (arquivado !== undefined) query = query.eq("arquivado", arquivado);
        if (busca) query = query.ilike("empresa", `%${busca}%`);
        const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "buscar_lead",
      "Busca um lead específico pelo ID, com todos os detalhes incluindo análise de IA.",
      { id: z.string().describe("UUID do lead.") },
      async ({ id }) => {
        const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
        if (error || !data) return { content: [{ type: "text", text: "Lead não encontrado." }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "criar_lead",
      "Cadastra um novo lead manualmente no CRM, na primeira etapa do pipeline.",
      {
        empresa: z.string().describe("Nome da empresa."),
        contato: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        endereco: z.string().optional(),
        site: z.string().optional(),
        categoria: z.string().optional().describe("Ramo de atividade, ex: 'Manutenção hidráulica'."),
        tipo_negocio: z.enum(["cliente", "parceiro"]).optional().describe("Cliente (precisa de reparo) ou parceiro (presta o serviço)."),
      },
      async (input) => {
        const { data: etapa } = await supabase.from("lead_etapas").select("id").order("ordem", { ascending: true }).limit(1).single();
        if (!etapa) return { content: [{ type: "text", text: "Nenhuma etapa de pipeline configurada." }], isError: true };
        const { data, error } = await supabase.from("leads").insert({
          empresa: input.empresa,
          contato: input.contato ?? null,
          telefone: input.telefone ?? null,
          email: input.email ?? null,
          endereco: input.endereco ?? null,
          site: input.site ?? null,
          categoria: input.categoria ?? null,
          tipo_negocio: input.tipo_negocio ?? null,
          etapa_id: etapa.id,
          arquivado: false,
          origem: "manual",
        }).select().single();
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "mudar_etapa_lead",
      "Move um lead para outra etapa do pipeline. Se a etapa marcar arquivamento automático (ex: Ganho/Perdido), o lead é arquivado.",
      {
        id: z.string().describe("UUID do lead."),
        etapa_nome: z.string().describe("Nome da etapa de destino (ex: 'Contatado', 'Ganho'). Use listar_etapas_pipeline pra ver as opções."),
      },
      async ({ id, etapa_nome }) => {
        const { data: etapa } = await supabase.from("lead_etapas").select("*").ilike("nome", etapa_nome).maybeSingle();
        if (!etapa) return { content: [{ type: "text", text: `Etapa "${etapa_nome}" não encontrada.` }], isError: true };
        const { data, error } = await supabase.from("leads").update({
          etapa_id: etapa.id,
          arquivado: etapa.arquiva,
        }).eq("id", id).select().single();
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        await supabase.from("lead_atividades").insert({ lead_id: id, texto: `Movido para "${etapa.nome}" via agente de IA.` });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "analisar_lead",
      "Gera (ou atualiza) a análise de IA de um lead: score de potencial, justificativa e sugestão de mensagem de WhatsApp.",
      { id: z.string().describe("UUID do lead.") },
      async ({ id }) => {
        try {
          const lead = await analisarLeadEPersiste(supabase, id);
          return { content: [{ type: "text", text: JSON.stringify(lead) }] };
        } catch (err) {
          return { content: [{ type: "text", text: err instanceof Error ? err.message : "Erro ao analisar lead." }], isError: true };
        }
      },
    );

    server.tool(
      "buscar_leads_apify",
      "Busca novos leads de verdade no Google Maps via Apify, e já cadastra os resultados no CRM. Pode levar até 1 minuto.",
      {
        termos_clientes: z.array(z.string()).optional().describe("Termos de busca pra clientes (empresas com equipamento que quebra)."),
        termos_parceiros: z.array(z.string()).optional().describe("Termos de busca pra parceiros (prestadores de reparo)."),
        cidade: z.string().optional(),
        estado: z.string().optional(),
      },
      async ({ termos_clientes, termos_parceiros, cidade, estado }) => {
        try {
          const result = await buscarLeadsApify(supabase, {
            termosClientes: termos_clientes, termosParceiros: termos_parceiros, cidade, estado,
          });
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err) {
          return { content: [{ type: "text", text: err instanceof Error ? err.message : "Erro na busca." }], isError: true };
        }
      },
    );

    server.tool(
      "listar_etapas_pipeline",
      "Lista as etapas configuradas no pipeline de leads do CRM, na ordem.",
      {},
      async () => {
        const { data, error } = await supabase.from("lead_etapas").select("*").order("ordem", { ascending: true });
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    // --- Clientes ---

    server.tool(
      "listar_clientes",
      "Lista clientes cadastrados, com busca opcional por nome.",
      { busca: z.string().optional().describe("Busca por nome (parcial, case-insensitive).") },
      async ({ busca }) => {
        let query = supabase.from("clientes").select("id, tipo, nome, documento, telefone, email, cidade, estado, ia_risco");
        if (busca) query = query.ilike("nome", `%${busca}%`);
        const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "buscar_cliente",
      "Busca um cliente específico pelo ID, com todos os detalhes incluindo análise de IA.",
      { id: z.string().describe("UUID do cliente.") },
      async ({ id }) => {
        const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single();
        if (error || !data) return { content: [{ type: "text", text: "Cliente não encontrado." }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "criar_cliente",
      "Cadastra um novo cliente.",
      {
        tipo: z.enum(["PF", "PJ"]),
        nome: z.string(),
        documento: z.string().describe("CPF ou CNPJ."),
        telefone: z.string().optional(),
        email: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().optional(),
        observacoes: z.string().optional(),
      },
      async (input) => {
        const { data, error } = await supabase.from("clientes").insert({
          tipo: input.tipo,
          nome: input.nome,
          documento: input.documento,
          telefone: input.telefone ?? null,
          email: input.email ?? null,
          cidade: input.cidade ?? null,
          estado: input.estado ?? null,
          observacoes: input.observacoes ?? null,
        }).select().single();
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "analisar_cliente",
      "Gera (ou atualiza) a análise de IA de um cliente: risco de perda, resumo do histórico e oportunidades de upsell baseadas nos itens já orçados.",
      { id: z.string().describe("UUID do cliente.") },
      async ({ id }) => {
        try {
          const cliente = await analisarClienteEPersiste(supabase, id);
          return { content: [{ type: "text", text: JSON.stringify(cliente) }] };
        } catch (err) {
          return { content: [{ type: "text", text: err instanceof Error ? err.message : "Erro ao analisar cliente." }], isError: true };
        }
      },
    );

    // --- Orçamentos ---

    server.tool(
      "listar_orcamentos",
      "Lista orçamentos, com filtro opcional por status ou cliente.",
      {
        status: z.enum(["pendente", "aprovado", "realizado"]).optional(),
        cliente_nome: z.string().optional().describe("Busca por nome do cliente (parcial)."),
      },
      async ({ status, cliente_nome }) => {
        let query = supabase.from("orcamentos").select("id, numero, cliente_nome, vendedor_nome, total, status, data");
        if (status) query = query.eq("status", status);
        if (cliente_nome) query = query.ilike("cliente_nome", `%${cliente_nome}%`);
        const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "criar_orcamento",
      "Cria um novo orçamento com um ou mais itens.",
      {
        cliente_nome: z.string().describe("Nome do cliente (texto livre, não precisa já estar cadastrado)."),
        cliente_id: z.string().optional().describe("UUID do cliente, se já cadastrado (use buscar_cliente/listar_clientes)."),
        vendedor_nome: z.string().describe("Nome do vendedor responsável."),
        vendedor_id: z.string().optional().describe("UUID do vendedor, se já cadastrado."),
        itens: z.array(z.object({
          descricao: z.string(),
          qtd: z.number(),
          valor: z.number().describe("Valor unitário em reais."),
        })).min(1),
        desconto: z.number().optional().default(0),
        observacao: z.string().optional(),
      },
      async (input) => {
        const total = input.itens.reduce((s, it) => s + it.qtd * it.valor, 0) - (input.desconto ?? 0);
        const numero = `ORC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const { data, error } = await supabase.from("orcamentos").insert({
          numero,
          cliente_id: input.cliente_id ?? null,
          cliente_nome: input.cliente_nome,
          vendedor_id: input.vendedor_id ?? null,
          vendedor_nome: input.vendedor_nome,
          itens: input.itens,
          total,
          desconto: input.desconto ?? 0,
          observacao: input.observacao ?? null,
          status: "pendente",
        }).select().single();
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "mudar_status_orcamento",
      "Atualiza o status de um orçamento (pendente, aprovado ou realizado).",
      {
        id: z.string().describe("UUID do orçamento."),
        status: z.enum(["pendente", "aprovado", "realizado"]),
      },
      async ({ id, status }) => {
        const { data, error } = await supabase.from("orcamentos").update({ status }).eq("id", id).select().single();
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "listar_vendedores",
      "Lista os vendedores cadastrados.",
      {},
      async () => {
        const { data, error } = await supabase.from("vendedores").select("*");
        if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );
  },
  {
    serverInfo: { name: "dsr-hidraupecas", version: "1.0.0" },
  },
  {
    disableSse: true,
    streamableHttpEndpoint: "/api/mcp",
    maxDuration: 60,
  },
);

const authHandler = withMcpAuth(
  handler,
  (_req, bearerToken) => {
    const expected = process.env.MCP_API_TOKEN;
    if (!expected || bearerToken !== expected) return undefined;
    return { token: bearerToken, clientId: "dsr-hidraupecas-agente", scopes: ["crm"] };
  },
  { required: true },
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
