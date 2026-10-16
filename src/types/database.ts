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
  createdAt: string;
}
