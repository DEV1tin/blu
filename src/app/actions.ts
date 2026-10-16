import { 
  salvarRegistro, 
  buscarRegistros, 
  buscarRegistrosDeHoje, 
  salvarWoop, 
  buscarWoops, 
  buscarWidgetsUsuario 
} from '../lib/dbService';
import { RegistroData, WoopData } from '../types/database';

export const authenticate = async (email: string, pass: string) => {
  return { 
    success: true, 
    message: '', 
    user: { id: 'usr_victor', name: 'Vitor H.', email } 
  };
};

export const getConfigMedico = async () => {
  return {
    nomeMedico: "Dr. Bruno",
    paciente: "Vitor H.",
    modulosAtivos: {
      registroLivre: true,
      dosimetria: true,
      horasSono: true,
      sentimentos: true,
      woop: true
    },
    sentimentosConfigurados: [
      { label: "Ansiedade", color: "text-red-400 border-red-500/30", activeBg: "bg-red-500/20" },
      { label: "Taquicardia", color: "text-orange-400 border-orange-500/30", activeBg: "bg-orange-500/20" },
      { label: "Eufórico/Acelerado", color: "text-purple-400 border-purple-500/30", activeBg: "bg-purple-500/20" },
      { label: "Irritabilidade", color: "text-yellow-400 border-yellow-500/30", activeBg: "bg-yellow-500/20" },
      { label: "Fadiga", color: "text-gray-400 border-slate-500/30", activeBg: "bg-slate-500/20" }
    ]
  };
};

export const addRegistro = async (data: any) => {
  return await salvarRegistro({
    pacienteId: 'usr_victor',
    tipo: data.tipo,
    titulo: data.titulo,
    detalhe: data.detalhe,
    emoji: data.emoji,
    qualidade: data.qualidade,
    hora: data.hora
  });
};

export const getRegistros = async () => {
  return await buscarRegistros('usr_victor');
};

export const getRegistrosDeHoje = async () => {
  return await buscarRegistrosDeHoje('usr_victor');
};

export const addWoop = async (data: any) => {
  return await salvarWoop({
    pacienteId: 'usr_victor',
    wish: data.wish,
    outcome: data.outcome,
    obstacle: data.obstacle,
    plan: data.plan,
    ativo: true
  });
};

export const getWoops = async () => {
  return await buscarWoops('usr_victor');
};

export const getWidgetsUsuario = async () => {
  return await buscarWidgetsUsuario('usr_victor');
};
