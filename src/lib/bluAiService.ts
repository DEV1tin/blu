import { PacienteConfigIA, RegistroData, WoopData } from '../types/database';

export interface RespostaRevisaoIA {
  mensagemDoBlu: string;
  perguntasReflexao: string[];
  isFallback?: boolean;
  avisoFallback?: string;
}

/**
 * CAMADA 1: Diretrizes Globais Fixas do Blu
 * Tom maduro (adulto para adulto), empático, lúcido e 100% fiel apenas aos registros reais do paciente.
 */
export const CAMADA_1_DIRETRIZES_GLOBAIS = `
Você é o Blu, o copiloto de autoconhecimento, saúde mental e rotina do aplicativo Blu.
Seu interlocutor é um paciente adulto. Trate-o de igual para igual, com respeito, acolhimento genuíno e maturidade clínica.

DIRETRIZES ESSENCIAIS DE COMUNICAÇÃO (CAMADA 1):
1. TOM DE VOZ: ADULTO, LÚCIDO, PESSOAL E MADURO:
   - NUNCA use linguagem infantil, termos diminutivos paternalistas ou comemorações artificiais (como "campeão", "guerreiro", "parabéns").
   - Fale como um parceiro de jornada experiente, atento e acolhedor, que lê com profundidade o que o paciente escreveu hoje.
   - Adapte o tom emocional exatamente ao que o paciente viveu hoje:
     * Se for um dia de tristeza profunda, apatia, depressão, dor emocional ou exaustão extrema, NÃO cobre produtividade nem fale em "vitórias" forçadas; ofereça validação profunda, presença acolhedora, redução de culpa e autocompaixão realista.
     * Se for um dia de ansiedade ou oscilação, ajude a organizar a percepção dos gatilhos e do que trouxe alívio.
     * Se for um dia produtivo ou estável, reconheça com maturidade os pilares que sustentaram essa estabilidade.

2. ARCO NARRATIVO FIEL AOS DADOS REAIS (2 A 3 PARÁGRAFOS):
   - NUNCA invente fatos, sintomas, horários ou ações que não estejam explicitamente nos registros de hoje do paciente.
   - Construa uma reflexão fluida (em 2 a 3 parágrafos) conectando exclusivamente o que foi registrado hoje (sono, medicação, sentimentos, desabafos em texto livre e WOOP, se houver).
   - Quando fizer sentido a partir dos dados do dia, destaque uma síntese ou aprendizado prático em um bloco curto iniciado por "🎯".

3. ESCUTA ATIVA E CITAÇÃO DIRETA:
   - Cite entre aspas palavras ou trechos reais que o próprio paciente escreveu nos registros de hoje, mostrando que você realmente leu o desabafo dele.

4. PERGUNTAS DE REFLEXÃO:
   - Retorne exatamente 3 perguntas abertas, maduras e sensíveis ao estado emocional atual do paciente (se ele estiver muito abatido ou deprimido, faça perguntas leves, de acolhimento e alívio de pressão; se estiver disposto, perguntas de percepção de padrões).

5. GUARDRAILS CLÍNICOS E ÉTICOS:
   - Você NÃO prescreve, não diagnostica transtornos e jamais sugere alterar doses de medicamentos.
`.trim();

/**
 * CAMADA 2: Diretrizes do Médico para o Paciente
 */
export function montarCamada2Clinica(configIa?: PacienteConfigIA | null): string {
  if (!configIa || !configIa.ativo) {
    return `
DIRETRIZES CLÍNICAS DO PACIENTE (CAMADA 2 - PADRÃO GERAL):
- Priorize escuta atenta dos textos livres, validação genuína do estado emocional relatado e estímulo ao autoconhecimento sem julgamentos.
`.trim();
  }

  const partes: string[] = [
    'DIRETRIZES CLÍNICAS PERSONALIZADAS PELO MÉDICO PARA ESTE PACIENTE (CAMADA 2):',
  ];

  if (configIa.focoClinico) partes.push(`- Foco Clínico de Atenção: ${configIa.focoClinico}`);
  if (configIa.estiloComunicacao) partes.push(`- Estilo de Comunicação Recomendado: ${configIa.estiloComunicacao}`);
  if (configIa.orientacoesDoMedico) partes.push(`- Orientações Específicas do Médico: ${configIa.orientacoesDoMedico}`);
  if (configIa.topicosEvitar) partes.push(`- Tópicos a Evitar: ${configIa.topicosEvitar}`);

  return partes.join('\n');
}

/**
 * Monta o resumo detalhado dos registros para a IA ler todos os textos abertos
 */
function formatarDadosDoDiaParaPrompt(
  nomePaciente: string,
  registrosHoje: RegistroData[],
  woopHoje?: WoopData | null
): string {
  const linhas: string[] = [`Nome do paciente: ${nomePaciente || 'Paciente'}`];

  if (registrosHoje.length === 0 && !woopHoje) {
    linhas.push('O paciente não deixou anotações hoje, mas abriu a Revisão do Dia agora.');
    return linhas.join('\n');
  }

  linhas.push('\nREGISTROS REAIS FEITOS PELO PACIENTE HOJE:');
  const ordenados = [...registrosHoje].sort((a, b) => {
    const horaA = a.hora || '00:00';
    const horaB = b.hora || '00:00';
    return horaA.localeCompare(horaB);
  });

  ordenados.forEach((reg) => {
    const detalheLimpo = reg.detalhe ? ` | Relato/Detalhe: "${reg.detalhe}"` : '';
    const qual = reg.qualidade ? ` | Qualidade: ${reg.qualidade}` : '';
    linhas.push(`- [${reg.hora || '--:--'}] [${reg.tipo}] ${reg.titulo}${qual}${detalheLimpo}`);
  });

  if (woopHoje) {
    linhas.push('\nMETA WOOP DEFINIDA PELO PACIENTE HOJE:');
    linhas.push(`- Desejo (Wish): "${woopHoje.wish}"`);
    if (woopHoje.outcome) linhas.push(`- Melhor Resultado (Outcome): "${woopHoje.outcome}"`);
    if (woopHoje.obstacle) linhas.push(`- Obstáculo Antecipado (Obstacle): "${woopHoje.obstacle}"`);
    if (woopHoje.plan) linhas.push(`- Plano Se-Então (Plan): "${woopHoje.plan}"`);
  }

  return linhas.join('\n');
}

/**
 * Fallback estritamente fiel aos dados registrados, acionado APENAS se todos os modelos da API falharem.
 * Não contém nenhum texto pré-fabricado de outros usuários.
 */
export function gerarFallbackFielAosDados(
  nomePaciente: string,
  registrosHoje: RegistroData[],
  woopHoje?: WoopData | null
): RespostaRevisaoIA {
  const primeiroNome = (nomePaciente || 'Paciente').trim().split(' ')[0];

  if (registrosHoje.length === 0 && !woopHoje) {
    return {
      mensagemDoBlu: `Olá, ${primeiroNome}.\n\nHoje você não deixou registros ao longo do dia, mas reservou este momento para abrir a sua revisão. Pausar por alguns instantes para observar como você está chegando ao fim do dia já é um gesto válido de cuidado consigo mesmo.`,
      perguntasReflexao: [
        'Em uma palavra, como você descreveria a sua energia física e mental neste momento?',
        'Houve algum momento específico hoje que exigiu mais de você emocionalmente?',
        'O que você pode fazer agora para diminuir a cobrança interna e descansar?',
      ],
      isFallback: true,
    };
  }

  const resumoItens = registrosHoje.map((r) => {
    if (r.tipo === 'SONO') return `sono (${r.detalhe}${r.qualidade ? ` - ${r.qualidade}` : ''})`;
    if (r.tipo === 'MEDICACAO') return `medicação (${r.detalhe} às ${r.hora})`;
    return `${r.titulo}${r.detalhe ? `: "${r.detalhe}"` : ''}`;
  });

  const textoMensagem = `Olá, ${primeiroNome}.\n\nSeus registros de hoje foram salvos no seu diário (${resumoItens.join('; ')}${woopHoje ? `; Meta WOOP: "${woopHoje.wish}"` : ''}). No momento, o serviço de análise aprofundada está temporariamente indisponível, mas seus dados estão seguros e você pode usar as perguntas abaixo para guiar sua reflexão de hoje.`;

  return {
    mensagemDoBlu: textoMensagem,
    perguntasReflexao: [
      'Olhando para o que você registrou hoje, qual foi o sentimento ou sensação mais presente no seu corpo?',
      'Como você pode se tratar com mais gentileza e menos cobrança neste encerramento de dia?',
      'Qual é a menor atitude de cuidado pessoal que está ao seu alcance fazer antes de dormir?',
    ],
    isFallback: true,
  };
}

/**
 * Chama a API oficial do Gemini com cascata de modelos rápidos e estáveis + timeout por modelo
 */
async function chamarGeminiComCascata(
  promptCompleto: string,
  systemInstruction: string
): Promise<RespostaRevisaoIA | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    console.warn('[Blu AI] GEMINI_API_KEY não encontrada no ambiente do servidor.');
    return null;
  }

  // Lista sem duplicatas priorizando modelos rápidos (0.7s-2s) e com alta disponibilidade (200 OK)
  // evita timeout de 10s da Vercel Hobby quando modelos pesados retornam 503 High Demand
  const candidatos = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    process.env.GEMINI_MODEL,
    'gemini-3.8-flash',
  ].filter(Boolean) as string[];

  const modelosParaTentar = Array.from(new Set(candidatos));

  for (const modelo of modelosParaTentar) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: promptCompleto }],
            },
          ],
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 2500,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[Blu AI] Modelo ${modelo} retornou status ${res.status}. Tentando próximo...`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      let textClean = rawText.trim();
      if (textClean.startsWith('```json')) {
        textClean = textClean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (textClean.startsWith('```')) {
        textClean = textClean.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(textClean);
      if (
        parsed &&
        typeof parsed.mensagemDoBlu === 'string' &&
        Array.isArray(parsed.perguntasReflexao) &&
        parsed.perguntasReflexao.length > 0
      ) {
        console.log(`[Blu AI] Resposta gerada com sucesso pelo modelo: ${modelo}`);
        return {
          mensagemDoBlu: parsed.mensagemDoBlu,
          perguntasReflexao: parsed.perguntasReflexao.slice(0, 3),
          isFallback: false,
        };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[Blu AI] Falha/timeout no modelo ${modelo}:`, err?.message || err);
    }
  }

  return null;
}

/**
 * Função principal chamada pela Server Action
 */
export async function gerarReflexaoComBlu(params: {
  nomePaciente: string;
  registrosHoje: RegistroData[];
  woopHoje?: WoopData | null;
  configIa?: PacienteConfigIA | null;
}): Promise<RespostaRevisaoIA> {
  const { nomePaciente, registrosHoje, woopHoje, configIa } = params;

  const instrucaoSistema = `${CAMADA_1_DIRETRIZES_GLOBAIS}\n\n${montarCamada2Clinica(configIa)}`;
  const resumoDia = formatarDadosDoDiaParaPrompt(nomePaciente, registrosHoje, woopHoje);

  const promptUsuario = `
Analise com profundidade EXCLUSIVAMENTE os registros reais do paciente abaixo.
Não invente informações que não estejam nos registros. Adapte seu acolhimento e leitura clínica ao estado real que o paciente relatou hoje.
Retorne estritamente um JSON válido no formato:
{
  "mensagemDoBlu": "string em 2 a 3 parágrafos (separados por \\n\\n) com tom adulto, empático e lúcido, citando trechos reais do que o paciente registrou e destacando uma síntese com 🎯 se pertinente",
  "perguntasReflexao": ["pergunta 1", "pergunta 2", "pergunta 3"]
}

DADOS DO PACIENTE HOJE:
${resumoDia}
`.trim();

  try {
    const respostaApi = await chamarGeminiComCascata(promptUsuario, instrucaoSistema);
    if (respostaApi) {
      return respostaApi;
    }
  } catch (err) {
    console.warn('[Blu AI] Erro inesperado na cascata Gemini:', err);
  }

  return gerarFallbackFielAosDados(nomePaciente, registrosHoje, woopHoje);
}
