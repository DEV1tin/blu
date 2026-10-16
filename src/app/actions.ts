import { 
  salvarRegistro, 
  buscarRegistros, 
  buscarRegistrosDeHoje, 
  salvarWoop, 
  buscarWoops, 
  buscarWidgetsUsuario,
  salvarRevisaoDiaria
} from '../lib/dbService';

export const getConfigMedico = async () => {
  return {
    nomeMedico: "Dr. Bruno",
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

export const addRegistro = async (data: any, pacienteId: string = 'usr_victor') => {
  return await salvarRegistro({
    pacienteId,
    tipo: data.tipo,
    titulo: data.titulo || '',
    detalhe: data.detalhe || '',
    emoji: data.emoji || '📝',
    qualidade: data.qualidade || '',
    hora: data.hora || ''
  });
};

export const getRegistros = async (pacienteId: string = 'usr_victor') => {
  return await buscarRegistros(pacienteId);
};

export const getRegistrosDeHoje = async (pacienteId: string = 'usr_victor') => {
  return await buscarRegistrosDeHoje(pacienteId);
};

export const addWoop = async (data: any, pacienteId: string = 'usr_victor') => {
  return await salvarWoop({
    pacienteId,
    wish: data.wish,
    outcome: data.outcome,
    obstacle: data.obstacle,
    plan: data.plan,
    ativo: true
  });
};

export const getWoops = async (pacienteId: string = 'usr_victor') => {
  return await buscarWoops(pacienteId);
};

export const getWidgetsUsuario = async (userId: string = 'usr_victor') => {
  return await buscarWidgetsUsuario(userId);
};

export const salvarRevisao = async (dados: {
  pacienteId: string;
  dataLogica: string;
  respostaReflexao: string;
}) => {
  return await salvarRevisaoDiaria(dados);
};

export const getPerfilUsuario = async (uid: string) => {
  const { buscarPerfilUsuario } = await import('../lib/dbService');
  return await buscarPerfilUsuario(uid);
};

export const setPerfilUsuario = async (uid: string, dados: any) => {
  const { atualizarPerfilUsuario } = await import('../lib/dbService');
  return await atualizarPerfilUsuario(uid, dados);
};
