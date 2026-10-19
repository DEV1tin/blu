import { 
  salvarRegistro, 
  atualizarRegistro,
  excluirRegistro as dbExcluirRegistro,
  buscarRegistros, 
  buscarRegistrosDeHoje, 
  salvarWoop as dbSalvarWoop, 
  salvarOuAtualizarWoop,
  buscarWoops, 
  buscarWoopDeHoje,
  excluirWoop as dbExcluirWoop,
  buscarWidgetsUsuario,
  salvarRevisaoDiaria,
  buscarRevisoes,
  buscarRevisaoDeHoje,
  buscarPerfilUsuario,
  atualizarPerfilUsuario
} from '../lib/dbService';
import { gerarReflexaoComBluServerAction } from './aiServerAction';
import { RegistroData, WoopData } from '../types/database';

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

export const updateRegistro = async (id: string, data: any) => {
  return await atualizarRegistro(id, {
    titulo: data.titulo,
    detalhe: data.detalhe,
    emoji: data.emoji,
    qualidade: data.qualidade,
    hora: data.hora,
  });
};

export const deleteRegistro = async (id: string) => {
  return await dbExcluirRegistro(id);
};

export const getRegistros = async (pacienteId: string = 'usr_victor') => {
  return await buscarRegistros(pacienteId);
};

export const getRegistrosDeHoje = async (pacienteId: string = 'usr_victor') => {
  return await buscarRegistrosDeHoje(pacienteId);
};

export const addWoop = async (data: any, pacienteId: string = 'usr_victor') => {
  return await salvarOuAtualizarWoop({
    id: data.id,
    pacienteId,
    wish: data.wish,
    outcome: data.outcome,
    obstacle: data.obstacle,
    plan: data.plan,
    ativo: true
  });
};

export const salvarWoop = async (data: any, pacienteId: string = 'usr_victor') => {
  return await salvarOuAtualizarWoop({
    id: data.id,
    pacienteId,
    wish: data.wish,
    outcome: data.outcome,
    obstacle: data.obstacle,
    plan: data.plan,
    ativo: true
  });
};

export const getWoopDeHoje = async (pacienteId: string = 'usr_victor') => {
  return await buscarWoopDeHoje(pacienteId);
};

export const excluirWoop = async (woopId: string) => {
  return await dbExcluirWoop(woopId);
};

export const getWoops = async (pacienteId: string = 'usr_victor') => {
  return await buscarWoops(pacienteId);
};

export const getWidgetsUsuario = async (userId: string = 'usr_victor') => {
  return await buscarWidgetsUsuario(userId);
};

export const salvarRevisao = async (dados: {
  id?: string;
  pacienteId: string;
  dataLogica: string;
  mensagemDoBlu?: string;
  perguntasReflexao?: string[];
  respostaReflexao: string;
  isFallback?: boolean;
}) => {
  return await salvarRevisaoDiaria(dados);
};

export const getRevisoes = async (pacienteId: string = 'usr_victor') => {
  return await buscarRevisoes(pacienteId);
};

export const getRevisaoDeHoje = async (pacienteId: string = 'usr_victor') => {
  return await buscarRevisaoDeHoje(pacienteId);
};

export const gerarReflexaoBluAction = async (params: {
  uid: string;
  nomePaciente: string;
  registrosHoje: RegistroData[];
  woopHoje?: WoopData | null;
}) => {
  const perfil = await buscarPerfilUsuario(params.uid);

  // Garantir objetos planos 100% serializáveis para a Server Action (remove instâncias Timestamp do Firestore)
  const registrosPlanos: RegistroData[] = (params.registrosHoje || []).map((r) => ({
    id: r.id,
    pacienteId: r.pacienteId,
    tipo: r.tipo,
    titulo: r.titulo || '',
    detalhe: r.detalhe || '',
    qualidade: r.qualidade || '',
    hora: r.hora || '',
    emoji: r.emoji || '',
    dataLogica: r.dataLogica || '',
    createdAt: r.createdAt || '',
  }));

  const woopPlano: WoopData | null = params.woopHoje
    ? {
        id: params.woopHoje.id,
        pacienteId: params.woopHoje.pacienteId,
        wish: params.woopHoje.wish || '',
        outcome: params.woopHoje.outcome || '',
        obstacle: params.woopHoje.obstacle || '',
        plan: params.woopHoje.plan || '',
        ativo: Boolean(params.woopHoje.ativo),
        dataLogica: params.woopHoje.dataLogica || '',
        createdAt: params.woopHoje.createdAt || '',
      }
    : null;

  const configIaPlana = perfil?.configIa
    ? JSON.parse(JSON.stringify(perfil.configIa))
    : null;

  return await gerarReflexaoComBluServerAction({
    nomePaciente: params.nomePaciente || perfil?.nome || 'Paciente',
    registrosHoje: registrosPlanos,
    woopHoje: woopPlano,
    configIa: configIaPlana,
  });
};

export const getPerfilUsuario = async (uid: string) => {
  return await buscarPerfilUsuario(uid);
};

export const setPerfilUsuario = async (uid: string, dados: any) => {
  return await atualizarPerfilUsuario(uid, dados);
};

