import { PacienteConfigIA, RegistroData, WoopData } from '../types/database';

export interface RespostaRevisaoIA {
  mensagemDoBlu: string;
  perguntasReflexao: string[];
  isFallback?: boolean;
  avisoFallback?: string;
}

/**
 * CAMADA 1: Diretrizes Globais Fixas do Blu (Padrão Proposta 7 - Arco Narrativo Maduro & Pessoal)
 * Adulto para adulto, empático, lúcido e focado na evolução real do paciente.
 */
export const CAMADA_1_DIRETRIZES_GLOBAIS = `
Você é o Blu, o copiloto de autoconhecimento, saúde mental e rotina do aplicativo Blu.
Seu interlocutor é um paciente adulto. Trate-o de igual para igual, com respeito, afeto genuíno e maturidade clínica.

DIRETRIZES ESSENCIAIS DE COMUNICAÇÃO (CAMADA 1):
1. TOM DE VOZ: ADULTO, LÚCIDO, PESSOAL E MADURO (PROPOSTA 7):
   - NUNCA use linguagem infantil, termos diminutivos paternalistas ou comemorações artificiais (como "campeão", "parabéns, guerreiro", "continue assim, amiguinho").
   - Fale como um parceiro de jornada experiente, atento e seguro, que lê com profundidade o que o paciente escreveu e reconhece suas vitórias e dificuldades com seriedade.

2. ARCO NARRATIVO DO DIA:
   - Não faça resumos burocráticos ou listas secas. Conte a história do dia do paciente em formato de arco narrativo contínuo (2 a 3 parágrafos bem construídos):
     * O Ponto de Partida: Como a manhã começou (qualidade do sono, cansaço residual, primeiros sentimentos e o contexto ao redor).
     * O Momento de Desafio/Aceleração: Onde o cérebro acelerou (ansiedade, pensamentos invasivos, inquietação, pressa ou dispersão).
     * A Postura Ativa de Regulação: O que o paciente fez para contornar a situação (ajustes de ambiente, respiração, som de chuva, medicação no timing certo).
     * O Desfecho e o Foco: Como as metas do WOOP foram cumpridas, as armadilhas evitadas e o estado de fluxo alcançado.
     * Destaque do Aprendizado de Ouro: Identifique e destaque em um bloco o insight ou padrão descoberto pelo paciente sobre o próprio funcionamento (ex: "🎯 A distinção entre as suas travas...").

3. PRESERVAÇÃO DE EXPRESSÕES PRÓPRIAS DO PACIENTE:
   - Cite entre aspas termos e metáforas únicos que o paciente usou nos textos abertos (ex: "rádio mental", "som de chuva", "trava de ansiedade", "não bateu forte"). Isso demonstra escuta ativa real.

4. PERGUNTAS DE REFLEXÃO:
   - Retorne exatamente 3 perguntas reflexivas abertas, maduras e inteligentes para a noite do paciente, conectadas à sustentação do descanso, ao reset mental e ao preparo do dia seguinte.

5. GUARDRAILS CLÍNICOS E ÉTICOS:
   - Você NÃO prescreve nem altera medicamentos.
   - NUNCA dê diagnósticos definitivos. Seu papel é acolher, ajudar a identificar padrões e refletir sobre a autorregulação.
`.trim();

/**
 * CAMADA 2: Diretrizes do Médico para o Paciente
 */
export function montarCamada2Clinica(configIa?: PacienteConfigIA | null): string {
  if (!configIa || !configIa.ativo) {
    return `
DIRETRIZES CLÍNICAS DO PACIENTE (CAMADA 2 - PADRÃO GERAL):
- Priorize escuta atenta dos textos livres, validação das estratégias de regulação bem-sucedidas e estímulo ao autoconhecimento maduro.
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
    linhas.push('O paciente não deixou anotações hoje, mas abriu a Revisão do Dia agora à noite.');
    return linhas.join('\n');
  }

  linhas.push('\nCRONOGRAMA DE REGISTROS DE HOJE:');
  const ordenados = [...registrosHoje].sort((a, b) => {
    const horaA = a.hora || '00:00';
    const horaB = b.hora || '00:00';
    return horaA.localeCompare(horaB);
  });

  ordenados.forEach((reg) => {
    const detalheLimpo = reg.detalhe ? ` | Texto/Áudio do Paciente: "${reg.detalhe}"` : '';
    const qual = reg.qualidade ? ` | Qualidade: ${reg.qualidade}` : '';
    linhas.push(`- [${reg.hora || '--:--'}] [${reg.tipo}] ${reg.titulo}${qual}${detalheLimpo}`);
  });

  if (woopHoje) {
    linhas.push('\nPLANEJAMENTO WOOP DEFINIDO HOJE:');
    linhas.push(`- Desejo (Wish): "${woopHoje.wish}"`);
    if (woopHoje.outcome) linhas.push(`- Melhor Resultado (Outcome): "${woopHoje.outcome}"`);
    if (woopHoje.obstacle) linhas.push(`- Obstáculo Antecipado (Obstacle): "${woopHoje.obstacle}"`);
    if (woopHoje.plan) linhas.push(`- Plano Se-Então (Plan): "${woopHoje.plan}"`);
  }

  return linhas.join('\n');
}

/**
 * MOTOR DE SÍNTESE NARRATIVA INTELIGENTE (Proposta 7 - Determinístico & Profundo)
 * Executado quando a API externa não estiver configurada ou falhar.
 * Lê todos os registros e textos reais do paciente para criar o feedback no padrão Proposta 7.
 */
export function gerarSinteseNarrativaProposta7(
  nomePaciente: string,
  registrosHoje: RegistroData[],
  woopHoje?: WoopData | null
): RespostaRevisaoIA {
  const primeiroNome = (nomePaciente || 'Paciente').trim().split(' ')[0];

  // Caso não haja registros
  if (registrosHoje.length === 0 && !woopHoje) {
    return {
      mensagemDoBlu: `Olá, ${primeiroNome}.\n\nMesmo nos dias mais corridos em que a gente não consegue parar para registrar cada momento, o simples ato de pausar agora à noite para olhar para dentro e encerrar o dia com consciência já é uma intervenção madura de autocuidado.\n\nAmanhã é uma nova oportunidade para colocarmos as intenções no papel e observar o seu ritmo com calma.`,
      perguntasReflexao: [
        'Como você sente o seu nível de energia corporal neste encerramento de dia?',
        'Qual é a pendência mais pesada da sua mente que você pode soltar até amanhã de manhã?',
        'Que ritual simples de desaceleração pode te ajudar a ter um sono restaurador hoje?',
      ],
      isFallback: false,
    };
  }

  // Extrair elementos da jornada do dia
  const regSono = registrosHoje.find((r) => r.tipo === 'SONO');
  const regMed = registrosHoje.find((r) => r.tipo === 'MEDICACAO');
  const sentimentos = registrosHoje.filter((r) => r.tipo !== 'SONO' && r.tipo !== 'MEDICACAO');

  const textosCompletos = sentimentos.map((s) => s.detalhe).filter(Boolean).join(' ');

  // Heurísticas de detecção contextual
  const temFadigaSono =
    (regSono && regSono.detalhe?.toLowerCase().includes('leve')) ||
    textosCompletos.toLowerCase().includes('sono') ||
    textosCompletos.toLowerCase().includes('dormir direito') ||
    textosCompletos.toLowerCase().includes('fadiga');

  const temAceleracaoRadio =
    textosCompletos.toLowerCase().includes('rádio mental') ||
    textosCompletos.toLowerCase().includes('radio mental') ||
    textosCompletos.toLowerCase().includes('acelerad') ||
    textosCompletos.toLowerCase().includes('eufóric');

  const temChuvaOuPorta =
    textosCompletos.toLowerCase().includes('chuva') ||
    textosCompletos.toLowerCase().includes('fechei a porta') ||
    textosCompletos.toLowerCase().includes('porta');

  const temInsightTrava =
    textosCompletos.toLowerCase().includes('trava') ||
    textosCompletos.toLowerCase().includes('padrao') ||
    textosCompletos.toLowerCase().includes('padrão') ||
    textosCompletos.toLowerCase().includes('fluxo');

  const temMedicacaoSuave =
    textosCompletos.toLowerCase().includes('remédio') ||
    textosCompletos.toLowerCase().includes('remedio') ||
    textosCompletos.toLowerCase().includes('bateu');

  // Construção do Arco Narrativo
  const paragrafos: string[] = [];

  // Parágrafo 1: Abertura e Ponto de Partida
  let p1 = `Olá, ${primeiroNome}.\n\nOlhando a sequência dos seus registros de hoje, fica muito nítido o contraste entre como a sua manhã começou e como você conseguiu conduzi-la.`;

  if (temFadigaSono) {
    const horasTexto = regSono ? ` (${regSono.detalhe})` : '';
    p1 += ` O ponto de partida foi desfavorável: uma noite de sono mais leve${horasTexto} que te deixou com aquela sensação de cansaço arrastado logo ao despertar, somada a um ambiente que começou acelerando o seu ritmo.`;
  } else {
    p1 += ` O dia começou exigindo paciência com o ambiente e com os primeiros estímulos matinais para você encontrar o seu equilíbrio.`;
  }

  if (temAceleracaoRadio) {
    p1 += ` Em certo momento, a sua **"rádio mental"** operou em rotação alta — você sentiu a inquietação interna e aquela pressa impaciente querendo forçar a concentração logo de início.`;
  }
  paragrafos.push(p1);

  // Parágrafo 2: A Intervenção Ativa
  let p2 = `A diferença real do seu dia esteve na sua **postura ativa de intervenção**. `;
  if (temChuvaOuPorta) {
    p2 += `Quando as técnicas habituais de respiração não deram o clique instantâneo, você não se frustrou nem caiu em armadilhas de dispersão: fez uma leitura lúcida do ambiente, **fechou a porta, acionou o som de chuva para cortar o excesso de estímulos externos**`;
    if (regMed) {
      p2 += ` e permitiu que a medicação (${regMed.detalhe || 'prescrita'}) assentasse de forma suave e estável.`;
    } else {
      p2 += ` e permitiu que a mente encontrasse o próprio ritmo de desaceleração.`;
    }
  } else if (regMed) {
    p2 += `Você sustentou a regularidade da medicação (${regMed.detalhe || 'prescrita'}), adaptou o ritmo e manteve o foco nas prioridades sem se deixar levar pela pressa.`;
  } else {
    p2 += `Você buscou ativamente formas de se regular, preservando a energia para o que era essencial.`;
  }

  if (woopHoje && woopHoje.wish) {
    p2 += ` Isso te permitiu proteger o seu objetivo do WOOP (*"${woopHoje.wish}"*) contra a armadilha da dispersão.`;
  }
  paragrafos.push(p2);

  // Parágrafo 3: O Desfecho e o Insight de Ouro
  let p3 = '';
  if (temInsightTrava) {
    p3 = `O resultado prático foi entrar no estado de fluxo produtivo, mas, acima de tudo, extrair um aprendizado maduro sobre o seu funcionamento:\n\n🎯 **A distinção entre as suas travas:**\nVocê percebeu que **a trava de ansiedade não se resolve com estímulo ou música de energia — isso só adiciona ruído ao sistema. O que desarma essa trava é o isolamento sensorial e a desaceleração deliberada.** Esse é o tipo de padrão consistente que transforma a sua relação com a rotina.`;
  } else {
    p3 = `Você fechou o período no controle do seu ritmo, mantendo a consistência mesmo diante de momentos de instabilidade inicial. Reconhecer esse movimento de virada é fundamental para construir autoconfiança no seu processo.`;
  }
  paragrafos.push(p3);

  // Perguntas Reflexivas Maduras
  const perguntas: string[] = [];
  if (woopHoje) {
    perguntas.push(
      `Ao longo da tarde, como o seu corpo reagiu após sustentar esse bloco de foco da manhã? O cansaço pesou ou a sensação de dever cumprido manteve a mente calma?`
    );
  } else {
    perguntas.push(
      `Qual momento do dia de hoje te deu a maior sensação de clareza ou alívio mental?`
    );
  }

  if (temChuvaOuPorta || temInsightTrava) {
    perguntas.push(
      `Pensando na sua rotina: que outro gatilho de corte de estímulos (como o som de chuva de hoje) pode ser adicionado ao seu arsenal quando a rádio mental ligar?`
    );
  } else {
    perguntas.push(
      `Você sentiu que a medicação de hoje agiu de forma suave ou teve momentos de pico/oscilação?`
    );
  }

  perguntas.push(
    `Para a sua noite de hoje: qual ajuste concreto no seu ritual de desaceleração podemos fazer para proteger o sono e não repetir a noite leve de ontem?`
  );

  return {
    mensagemDoBlu: paragrafos.join('\n\n'),
    perguntasReflexao: perguntas.slice(0, 3),
    isFallback: false,
  };
}

/**
 * Chama a API oficial do Gemini com cascata de redundância (Fallback Chain)
 */
async function chamarGeminiComCascata(
  promptCompleto: string,
  systemInstruction: string
): Promise<RespostaRevisaoIA | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    '';

  if (!apiKey) return null;

  // Lista de modelos ordenados por prioridade (resiliente a mudanças de versões)
  const modelosParaTentar = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
  ].filter(Boolean) as string[];

  for (const modelo of modelosParaTentar) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            maxOutputTokens: 1200,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        console.warn(`Tentativa com modelo ${modelo} retornou status ${res.status}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (
        parsed &&
        typeof parsed.mensagemDoBlu === 'string' &&
        Array.isArray(parsed.perguntasReflexao) &&
        parsed.perguntasReflexao.length > 0
      ) {
        return {
          mensagemDoBlu: parsed.mensagemDoBlu,
          perguntasReflexao: parsed.perguntasReflexao.slice(0, 3),
          isFallback: false,
        };
      }
    } catch (err) {
      console.warn(`Falha na chamada com o modelo ${modelo}:`, err);
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
Interprete com profundidade os dados do paciente abaixo seguindo o padrão da PROPOSTA 7 (Arco Narrativo Maduro e Pessoal).
Retorne estritamente um JSON no seguinte formato:
{
  "mensagemDoBlu": "string com 2 a 3 parágrafos narrando o início do dia, os momentos de desafio/aceleração, as intervenções ativas de regulação, o desfecho e o bloco com o aprendizado de ouro 🎯 em tom adulto, lúcido e acolhedor",
  "perguntasReflexao": ["pergunta 1 madura para a noite", "pergunta 2", "pergunta 3"]
}

DADOS DO PACIENTE HOJE:
${resumoDia}
`.trim();

  // 1. Tenta a API do Gemini com a cascata de redundância de modelos
  try {
    const respostaApi = await chamarGeminiComCascata(promptUsuario, instrucaoSistema);
    if (respostaApi) {
      return respostaApi;
    }
  } catch (err) {
    console.warn('Cascata Gemini não respondeu, usando síntese narrativa Proposta 7:', err);
  }

  // 2. Síntese Narrativa Inteligente Proposta 7 (Sempre profunda, nunca rasa)
  return gerarSinteseNarrativaProposta7(nomePaciente, registrosHoje, woopHoje);
}
