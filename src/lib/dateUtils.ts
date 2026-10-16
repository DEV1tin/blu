/**
 * Utilitários de Data Lógica e Formatação para Diário Psiquiátrico
 * Regra: O dia clínico "vira" às 03:00 da manhã.
 * Registros entre 00:00 e 02:59 pertencem ao dia anterior.
 */

export function getLogicalDate(date: Date = new Date()): Date {
  const d = new Date(date);
  if (d.getHours() < 3) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/**
 * Retorna a chave do dia lógico no formato YYYY-MM-DD
 */
export function getLogicalDateString(date: Date = new Date()): string {
  const logical = getLogicalDate(date);
  const year = logical.getFullYear();
  const month = String(logical.getMonth() + 1).padStart(2, '0');
  const day = String(logical.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna o horário atual no formato HH:mm
 */
export function getCurrentTimeString(date: Date = new Date()): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formata data lógica para exibição amigável (ex: "15 de Outubro")
 */
export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}
