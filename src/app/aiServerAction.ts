'use server';

import { gerarReflexaoComBlu, RespostaRevisaoIA } from '../lib/bluAiService';
import { PacienteConfigIA, RegistroData, WoopData } from '../types/database';

/**
 * Server Action real do Next.js (executa exclusivamente no servidor Node.js / Vercel)
 * Garante acesso seguro a process.env.GEMINI_API_KEY e process.env.GEMINI_MODEL
 */
export async function gerarReflexaoComBluServerAction(params: {
  nomePaciente: string;
  registrosHoje: RegistroData[];
  woopHoje?: WoopData | null;
  configIa?: PacienteConfigIA | null;
}): Promise<RespostaRevisaoIA> {
  return await gerarReflexaoComBlu(params);
}
