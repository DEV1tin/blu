import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { RegistroData, WoopData, RevisaoDiariaData, PacienteConfigIA } from '../types/database';
import { getLogicalDateString, getCurrentTimeString } from './dateUtils';
import { UserWidgetConfig } from '../types/widgets';
import { DEFAULT_USER_WIDGETS, resolveUserWidgets } from './widgetDefaults';

const STORAGE_KEY_REGISTROS = 'blu_offline_registros';
const STORAGE_KEY_WOOP = 'blu_offline_woops';
const STORAGE_KEY_WIDGETS = 'blu_user_widgets';
const STORAGE_KEY_REVISOES = 'blu_offline_revisoes';

function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Erro ao salvar localmente:', err);
  }
}

/**
 * Salva um novo registro (Humor, Medicação, Sono, Texto)
 */
export async function salvarRegistro(registro: Omit<RegistroData, 'dataLogica' | 'createdAt'>): Promise<RegistroData> {
  const dataLogica = getLogicalDateString();
  const novoRegistro: RegistroData = {
    ...registro,
    qualidade: registro.qualidade || '',
    detalhe: registro.detalhe || '',
    titulo: registro.titulo || '',
    emoji: registro.emoji || '📝',
    hora: registro.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    dataLogica,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured) {
    try {
      const colRef = collection(db, 'registros');
      const docRef = await addDoc(colRef, {
        ...novoRegistro,
        serverTimestamp: Timestamp.now(),
      });
      novoRegistro.id = docRef.id;
      return novoRegistro;
    } catch (err) {
      console.error('Falha ao gravar no Firestore:', err);
    }
  }

  // Fallback Local
  const existentes = getLocalData<RegistroData[]>(STORAGE_KEY_REGISTROS, []);
  novoRegistro.id = `local_${Date.now()}`;
  existentes.unshift(novoRegistro);
  setLocalData(STORAGE_KEY_REGISTROS, existentes);
  return novoRegistro;
}

/**
 * Atualiza um registro existente (Medicação, Sono, etc.) sem criar duplicidade
 */
export async function atualizarRegistro(
  id: string,
  dadosAtualizados: Partial<Omit<RegistroData, 'id' | 'pacienteId' | 'dataLogica' | 'createdAt'>>
): Promise<boolean> {
  // Remove chaves undefined para não quebrar o updateDoc do Firestore
  const payloadLimpo = Object.fromEntries(
    Object.entries(dadosAtualizados).filter(([_, v]) => v !== undefined)
  );

  if (isFirebaseConfigured && id && !id.startsWith('local_')) {
    try {
      const docRef = doc(db, 'registros', id);
      await updateDoc(docRef, payloadLimpo);
      return true;
    } catch (err) {
      console.warn('Falha ao atualizar registro no Firestore, tentando local:', err);
    }
  }

  const existentes = getLocalData<RegistroData[]>(STORAGE_KEY_REGISTROS, []);
  const idx = existentes.findIndex(r => r.id === id);
  if (idx !== -1) {
    existentes[idx] = {
      ...existentes[idx],
      ...payloadLimpo,
    };
    setLocalData(STORAGE_KEY_REGISTROS, existentes);
    return true;
  }
  return false;
}

/**
 * Exclui um registro existente (Medicação, Sono, Sentimento, etc.)
 */
export async function excluirRegistro(id: string): Promise<boolean> {
  if (isFirebaseConfigured && id && !id.startsWith('local_')) {
    try {
      const docRef = doc(db, 'registros', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Falha ao excluir registro no Firestore, tentando local:', err);
    }
  }

  const existentes = getLocalData<RegistroData[]>(STORAGE_KEY_REGISTROS, []);
  const filtrados = existentes.filter(r => r.id !== id);
  setLocalData(STORAGE_KEY_REGISTROS, filtrados);
  return true;
}

/**
 * Busca todos os registros do paciente (para Meus Registros / Timeline)
 * Ordenação feita no cliente para evitar erros de índice composto no Firestore
 */
export async function buscarRegistros(pacienteId: string): Promise<RegistroData[]> {
  if (isFirebaseConfigured && pacienteId) {
    try {
      const colRef = collection(db, 'registros');
      const q = query(colRef, where('pacienteId', '==', pacienteId));
      const snapshot = await getDocs(q);
      const list: RegistroData[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...(doc.data() as Omit<RegistroData, 'id'>) });
      });
      // Ordenação decrescente em memória (mais recentes primeiro)
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Falha ao ler do Firestore, usando fallback local:', err);
    }
  }

  const locais = getLocalData<RegistroData[]>(STORAGE_KEY_REGISTROS, []);
  return locais
    .filter(r => r.pacienteId === pacienteId || !r.pacienteId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Busca os registros do DIA LÓGICO ATUAL (para alimentar o Dashboard e reset diário)
 */
export async function buscarRegistrosDeHoje(pacienteId: string): Promise<{
  medicacao?: RegistroData;
  medicacoes: RegistroData[];
  sono?: RegistroData;
  sentimentos: RegistroData[];
}> {
  const hoje = getLogicalDateString();
  const todos = await buscarRegistros(pacienteId);
  const registrosHoje = todos.filter(r => r.dataLogica === hoje);

  const medicacoes = registrosHoje.filter(r => r.tipo === 'MEDICACAO');
  const medicacao = medicacoes[0];
  const sono = registrosHoje.find(r => r.tipo === 'SONO');
  const sentimentos = registrosHoje.filter(r => r.tipo !== 'MEDICACAO' && r.tipo !== 'SONO');

  return { medicacao, medicacoes, sono, sentimentos };
}

/**
 * Salva ou atualiza o WOOP do dia (garantindo apenas 1 por dia clínico)
 */
export async function salvarOuAtualizarWoop(woop: {
  id?: string;
  pacienteId: string;
  wish: string;
  outcome?: string;
  obstacle?: string;
  plan?: string;
  ativo?: boolean;
}): Promise<WoopData> {
  const dataLogicaHoje = getLogicalDateString();
  const agora = new Date().toISOString();

  // Se já temos um id explícito para editar
  if (woop.id) {
    const dadosAtualizados: Partial<WoopData> = {
      wish: woop.wish,
      outcome: woop.outcome || '',
      obstacle: woop.obstacle || '',
      plan: woop.plan || '',
      updatedAt: agora,
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'woop_goals', woop.id);
        await updateDoc(docRef, dadosAtualizados);
      } catch (err) {
        console.warn('Falha ao atualizar WOOP no Firestore, tentando local:', err);
      }
    }

    const locais = getLocalData<WoopData[]>(STORAGE_KEY_WOOP, []);
    const idx = locais.findIndex(w => w.id === woop.id);
    if (idx !== -1) {
      locais[idx] = { ...locais[idx], ...dadosAtualizados };
      setLocalData(STORAGE_KEY_WOOP, locais);
      return locais[idx];
    }

    return {
      id: woop.id,
      pacienteId: woop.pacienteId,
      wish: woop.wish,
      outcome: woop.outcome || '',
      obstacle: woop.obstacle || '',
      plan: woop.plan || '',
      ativo: true,
      dataLogica: dataLogicaHoje,
      createdAt: agora,
      updatedAt: agora,
    };
  }

  // Se não foi passado id, verifica se já existe um WOOP hoje para este paciente
  const woopExistenteHoje = await buscarWoopDeHoje(woop.pacienteId);
  if (woopExistenteHoje?.id) {
    return await salvarOuAtualizarWoop({
      ...woop,
      id: woopExistenteHoje.id,
    });
  }

  // Cria um novo WOOP para o dia de hoje
  const novoWoop: WoopData = {
    pacienteId: woop.pacienteId,
    wish: woop.wish,
    outcome: woop.outcome || '',
    obstacle: woop.obstacle || '',
    plan: woop.plan || '',
    ativo: woop.ativo ?? true,
    dataLogica: dataLogicaHoje,
    createdAt: agora,
  };

  if (isFirebaseConfigured) {
    try {
      const colRef = collection(db, 'woop_goals');
      const docRef = await addDoc(colRef, {
        ...novoWoop,
        serverTimestamp: Timestamp.now(),
      });
      novoWoop.id = docRef.id;
      return novoWoop;
    } catch (err) {
      console.warn('Falha ao salvar WOOP no Firestore, usando fallback local:', err);
    }
  }

  const locais = getLocalData<WoopData[]>(STORAGE_KEY_WOOP, []);
  novoWoop.id = `local_woop_${Date.now()}`;
  locais.unshift(novoWoop);
  setLocalData(STORAGE_KEY_WOOP, locais);
  return novoWoop;
}

/**
 * Alias de compatibilidade para salvar WOOP
 */
export async function salvarWoop(woop: Omit<WoopData, 'createdAt'>): Promise<WoopData> {
  return await salvarOuAtualizarWoop(woop);
}

/**
 * Busca todas as metas WOOP do paciente
 */
export async function buscarWoops(pacienteId: string): Promise<WoopData[]> {
  if (isFirebaseConfigured && pacienteId) {
    try {
      const colRef = collection(db, 'woop_goals');
      const q = query(colRef, where('pacienteId', '==', pacienteId));
      const snapshot = await getDocs(q);
      const list: WoopData[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...(doc.data() as Omit<WoopData, 'id'>) });
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Falha ao carregar WOOPs do Firestore, usando fallback local:', err);
    }
  }

  return getLocalData<WoopData[]>(STORAGE_KEY_WOOP, [])
    .filter(w => w.pacienteId === pacienteId || !w.pacienteId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Busca exclusivamente o WOOP do dia lógico atual do paciente
 */
export async function buscarWoopDeHoje(pacienteId: string): Promise<WoopData | null> {
  const dataLogicaHoje = getLogicalDateString();
  const todos = await buscarWoops(pacienteId);

  const woopHoje = todos.find(w => {
    if (w.dataLogica) {
      return w.dataLogica === dataLogicaHoje;
    }
    // Fallback para registros antigos sem dataLogica: compara a data de criação
    try {
      return getLogicalDateString(new Date(w.createdAt)) === dataLogicaHoje;
    } catch {
      return false;
    }
  });

  return woopHoje || null;
}

/**
 * Exclui um WOOP por ID
 */
export async function excluirWoop(woopId: string): Promise<boolean> {
  if (isFirebaseConfigured && woopId && !woopId.startsWith('local_')) {
    try {
      const docRef = doc(db, 'woop_goals', woopId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Falha ao excluir WOOP do Firestore:', err);
    }
  }

  const locais = getLocalData<WoopData[]>(STORAGE_KEY_WOOP, []);
  const filtrados = locais.filter(w => w.id !== woopId);
  setLocalData(STORAGE_KEY_WOOP, filtrados);
  return true;
}

/**
 * Salva ou atualiza a revisão do dia (garantindo 1 revisão consolidada por dia lógico)
 */
export async function salvarRevisaoDiaria(dados: {
  id?: string;
  pacienteId: string;
  dataLogica: string;
  mensagemDoBlu?: string;
  perguntasReflexao?: string[];
  respostaReflexao: string;
  isFallback?: boolean;
}): Promise<RevisaoDiariaData> {
  const agora = new Date().toISOString();
  const horaAtual = getCurrentTimeString();

  // Verifica se já existe revisão para essa dataLogica caso o id não tenha sido informado
  let idAlvo = dados.id;
  let existente: RevisaoDiariaData | null = null;

  if (!idAlvo && dados.pacienteId) {
    const todas = await buscarRevisoes(dados.pacienteId);
    existente = todas.find(r => r.dataLogica === dados.dataLogica) || null;
    if (existente?.id) {
      idAlvo = existente.id;
    }
  }

  if (idAlvo) {
    const camposAtualizados: Partial<RevisaoDiariaData> = {
      respostaReflexao: dados.respostaReflexao ?? existente?.respostaReflexao ?? '',
      updatedAt: agora,
    };
    if (dados.mensagemDoBlu !== undefined) {
      camposAtualizados.mensagemDoBlu = dados.mensagemDoBlu;
    }
    if (dados.perguntasReflexao !== undefined) {
      camposAtualizados.perguntasReflexao = dados.perguntasReflexao;
    }
    if (dados.isFallback !== undefined) {
      camposAtualizados.isFallback = Boolean(dados.isFallback);
    }

    if (isFirebaseConfigured && !idAlvo.startsWith('local_')) {
      try {
        const docRef = doc(db, 'revisoes_diarias', idAlvo);
        await updateDoc(docRef, camposAtualizados);
      } catch (err) {
        console.warn('Falha ao atualizar revisão diária no Firestore:', err);
      }
    }

    const locais = getLocalData<RevisaoDiariaData[]>(STORAGE_KEY_REVISOES, []);
    const idx = locais.findIndex(r => r.id === idAlvo);
    if (idx !== -1) {
      locais[idx] = { ...locais[idx], ...camposAtualizados };
      setLocalData(STORAGE_KEY_REVISOES, locais);
      return locais[idx];
    }

    return {
      id: idAlvo,
      pacienteId: dados.pacienteId,
      dataLogica: dados.dataLogica,
      hora: existente?.hora || horaAtual,
      mensagemDoBlu: dados.mensagemDoBlu || existente?.mensagemDoBlu || '',
      perguntasReflexao: dados.perguntasReflexao || existente?.perguntasReflexao || [],
      respostaReflexao: dados.respostaReflexao,
      isFallback: Boolean(dados.isFallback ?? existente?.isFallback),
      createdAt: existente?.createdAt || agora,
      updatedAt: agora,
    };
  }

  const novaRevisao: RevisaoDiariaData = {
    pacienteId: dados.pacienteId,
    dataLogica: dados.dataLogica,
    hora: horaAtual,
    mensagemDoBlu: dados.mensagemDoBlu || '',
    perguntasReflexao: dados.perguntasReflexao || [],
    respostaReflexao: dados.respostaReflexao || '',
    isFallback: Boolean(dados.isFallback),
    createdAt: agora,
  };

  if (isFirebaseConfigured) {
    try {
      const colRef = collection(db, 'revisoes_diarias');
      const docRef = await addDoc(colRef, {
        ...novaRevisao,
        serverTimestamp: Timestamp.now(),
      });
      novaRevisao.id = docRef.id;
      return novaRevisao;
    } catch (err) {
      console.warn('Falha ao salvar revisão diária no Firestore:', err);
    }
  }

  const locais = getLocalData<RevisaoDiariaData[]>(STORAGE_KEY_REVISOES, []);
  novaRevisao.id = `local_rev_${Date.now()}`;
  locais.unshift(novaRevisao);
  setLocalData(STORAGE_KEY_REVISOES, locais);
  return novaRevisao;
}

/**
 * Busca todas as revisões diárias do paciente
 */
export async function buscarRevisoes(pacienteId: string): Promise<RevisaoDiariaData[]> {
  if (isFirebaseConfigured && pacienteId) {
    try {
      const colRef = collection(db, 'revisoes_diarias');
      const q = query(colRef, where('pacienteId', '==', pacienteId));
      const snapshot = await getDocs(q);
      const list: RevisaoDiariaData[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<RevisaoDiariaData, 'id'>) });
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Falha ao buscar revisões no Firestore, usando fallback local:', err);
    }
  }

  return getLocalData<RevisaoDiariaData[]>(STORAGE_KEY_REVISOES, [])
    .filter(r => r.pacienteId === pacienteId || !r.pacienteId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Busca a revisão do dia lógico atual do paciente
 */
export async function buscarRevisaoDeHoje(pacienteId: string): Promise<RevisaoDiariaData | null> {
  const dataLogicaHoje = getLogicalDateString();
  const todas = await buscarRevisoes(pacienteId);
  return todas.find(r => r.dataLogica === dataLogicaHoje) || null;
}

/**
 * Obtém a lista de widgets ativos e ordenados para o usuário
 */
export async function buscarWidgetsUsuario(userId: string): Promise<UserWidgetConfig[]> {
  const custom = getLocalData<UserWidgetConfig[]>(`${STORAGE_KEY_WIDGETS}_${userId}`, DEFAULT_USER_WIDGETS);
  return resolveUserWidgets(custom);
}

/**
 * Busca dados completos do perfil do usuário no Firestore (incluindo configIa da Camada 2 se houver)
 */
export async function buscarPerfilUsuario(uid: string): Promise<{
  nome?: string;
  email?: string;
  medicoResponsavel?: string;
  configIa?: PacienteConfigIA;
} | null> {
  if (isFirebaseConfigured && uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as any;
      }
    } catch (e) {
      console.warn('Erro ao buscar perfil no Firestore:', e);
    }
  }
  return getLocalData(`blu_profile_${uid}`, null);
}

/**
 * Atualiza dados do perfil do usuário no Firestore
 */
export async function atualizarPerfilUsuario(uid: string, dados: {
  nome?: string;
  email?: string;
  medicoResponsavel?: string;
}) {
  if (isFirebaseConfigured && uid) {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, { ...dados, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Erro ao atualizar perfil no Firestore:', e);
    }
  }
  const local = getLocalData<any>(`blu_profile_${uid}`, {});
  setLocalData(`blu_profile_${uid}`, { ...local, ...dados });
}

