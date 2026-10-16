import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { RegistroData, WoopData } from '../types/database';
import { getLogicalDateString } from './dateUtils';
import { UserWidgetConfig } from '../types/widgets';
import { DEFAULT_USER_WIDGETS, resolveUserWidgets } from './widgetDefaults';

// Chaves para cache/fallback local (quando o Firebase ainda não tiver chaves preenchidas)
const STORAGE_KEY_REGISTROS = 'blu_offline_registros';
const STORAGE_KEY_WOOP = 'blu_offline_woops';
const STORAGE_KEY_WIDGETS = 'blu_user_widgets';

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
 * Busca todos os registros do paciente (para a tela de Timeline / Meus Registros)
 */
export async function buscarRegistros(pacienteId: string): Promise<RegistroData[]> {
  if (isFirebaseConfigured) {
    try {
      const colRef = collection(db, 'registros');
      const q = query(
        colRef, 
        where('pacienteId', '==', pacienteId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const list: RegistroData[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...(doc.data() as Omit<RegistroData, 'id'>) });
      });
      return list;
    } catch (err) {
      console.warn('Falha ao ler do Firestore, usando fallback local:', err);
    }
  }

  const locais = getLocalData<RegistroData[]>(STORAGE_KEY_REGISTROS, []);
  return locais.filter(r => r.pacienteId === pacienteId || !r.pacienteId);
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
  if (isFirebaseConfigured) {
    try {
      const colRef = collection(db, 'woop_goals');
      const q = query(
        colRef, 
        where('pacienteId', '==', pacienteId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const list: WoopData[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...(doc.data() as Omit<WoopData, 'id'>) });
      });
      return list;
    } catch (err) {
      console.warn('Falha ao carregar WOOPs do Firestore, usando fallback local:', err);
    }
  }

  return getLocalData<WoopData[]>(STORAGE_KEY_WOOP, []);
}

/**
 * Obtém a lista de widgets ativos e ordenados para o usuário
 */
export async function buscarWidgetsUsuario(userId: string): Promise<UserWidgetConfig[]> {
  // No futuro, buscar da coleção 'user_widgets' no Firestore
  // Por enquanto, retorna a lista com todos os widgets ativos resolvidos
  const custom = getLocalData<UserWidgetConfig[]>(`${STORAGE_KEY_WIDGETS}_${userId}`, DEFAULT_USER_WIDGETS);
  return resolveUserWidgets(custom);
}
