import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc,
  getDoc,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { RegistroData, WoopData } from '../types/database';
import { getLogicalDateString } from './dateUtils';
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
      console.warn('Falha ao gravar no Firestore, salvando em fallback local:', err);
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
  sono?: RegistroData;
  sentimentos: RegistroData[];
}> {
  const hoje = getLogicalDateString();
  const todos = await buscarRegistros(pacienteId);
  const registrosHoje = todos.filter(r => r.dataLogica === hoje);

  const medicacao = registrosHoje.find(r => r.tipo === 'MEDICACAO');
  const sono = registrosHoje.find(r => r.tipo === 'SONO');
  const sentimentos = registrosHoje.filter(r => r.tipo !== 'MEDICACAO' && r.tipo !== 'SONO');

  return { medicacao, sono, sentimentos };
}

/**
 * Salva uma nova meta WOOP
 */
export async function salvarWoop(woop: Omit<WoopData, 'createdAt'>): Promise<WoopData> {
  const novoWoop: WoopData = {
    ...woop,
    createdAt: new Date().toISOString(),
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
 * Busca metas WOOP do paciente
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
 * Salva uma revisão do dia
 */
export async function salvarRevisaoDiaria(dados: {
  pacienteId: string;
  dataLogica: string;
  respostaReflexao: string;
}) {
  const revisao = {
    ...dados,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured) {
    try {
      const colRef = collection(db, 'revisoes_diarias');
      await addDoc(colRef, {
        ...revisao,
        serverTimestamp: Timestamp.now(),
      });
      return revisao;
    } catch (err) {
      console.warn('Falha ao salvar revisão diária no Firestore:', err);
    }
  }

  const locais = getLocalData<any[]>(STORAGE_KEY_REVISOES, []);
  locais.unshift(revisao);
  setLocalData(STORAGE_KEY_REVISOES, locais);
  return revisao;
}

/**
 * Obtém a lista de widgets ativos e ordenados para o usuário
 */
export async function buscarWidgetsUsuario(userId: string): Promise<UserWidgetConfig[]> {
  const custom = getLocalData<UserWidgetConfig[]>(`${STORAGE_KEY_WIDGETS}_${userId}`, DEFAULT_USER_WIDGETS);
  return resolveUserWidgets(custom);
}
