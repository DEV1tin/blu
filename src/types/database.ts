export type UserRole = 'PACIENTE' | 'MEDICO' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  role: UserRole;
  medicoId?: string;
  createdAt: string;
}

export type TipoRegistro = 'SENTIMENTO' | 'TEXTO_LIVRE' | 'TEXTO_SENTIMENTO' | 'MEDICACAO' | 'SONO';

export interface RegistroData {
  id?: string;
  pacienteId: string;
  tipo: TipoRegistro;
  titulo: string;
  detalhe: string;
  emoji: string;
  qualidade?: string;
  hora: string; // HH:mm
  dataLogica: string; // YYYY-MM-DD
  createdAt: string; // ISO String
}

export interface WoopData {
  id?: string;
  pacienteId: string;
  wish: string;
  outcome: string;
  obstacle: string;
  plan: string;
  ativo: boolean;
  dataLogica?: string; // YYYY-MM-DD do dia clínico
  createdAt: string;
  updatedAt?: string;
}

/**
 * Camada 2 de Personalização da IA (Configurada futuramente pelo médico para cada paciente)
 */
export interface PacienteConfigIA {
  ativo: boolean;
  focoClinico?: string; // Ex: "TDAH combinado + Ansiedade"
  estiloComunicacao?: string; // Ex: "Acolhedor, direto, sem cobranças de horário"
  orientacoesDoMedico?: string; // Instruções personalizadas do psiquiatra
  topicosEvitar?: string; // Gatilhos ou assuntos que o Blu deve evitar abordar
}

/**
 * Estrutura da Revisão Diária com o Blu (Perguntas geradas + Resposta do Paciente)
 */
export interface RevisaoDiariaData {
  id?: string;
  pacienteId: string;
  dataLogica: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  mensagemDoBlu: string;
  perguntasReflexao: string[];
  respostaReflexao: string;
  isFallback?: boolean;
  createdAt: string;
  updatedAt?: string;
}


