import { WidgetDefinition, UserWidgetConfig } from '../types/widgets';

export const WIDGET_CATALOG: Record<string, WidgetDefinition> = {
  top_actions: {
    id: 'top_actions',
    name: 'Atalhos do Topo',
    description: 'Botões rápidos para Meus Registros e Revisão do Dia',
    isCore: true,
    defaultGridSpan: 'full',
    defaultOrder: 1,
  },
  humor_rapido: {
    id: 'humor_rapido',
    name: 'Como estou me sentindo',
    description: 'Registro de sintomas/humor em pílulas com anotação ou áudio',
    isCore: true,
    defaultGridSpan: 'full',
    defaultOrder: 2,
  },
  medicacao: {
    id: 'medicacao',
    name: 'Medicação (Dosimetria)',
    description: 'Registro diário da dose do remédio e horário de ingestão',
    isCore: false, // Prescrita pelo médico
    defaultGridSpan: 'full',
    defaultOrder: 3,
  },
  sono: {
    id: 'sono',
    name: 'Qualidade do Sono',
    description: 'Registro das horas dormidas e avaliação do descanso',
    isCore: false, // Prescrita pelo médico
    defaultGridSpan: 'full',
    defaultOrder: 4,
  },
  woop: {
    id: 'woop',
    name: 'Ferramenta WOOP',
    description: 'Definição e acompanhamento diário de Wish, Outcome, Obstacle e Plan',
    isCore: false, // Prescrita pelo médico
    defaultGridSpan: 'full',
    defaultOrder: 5,
  },
};

/**
 * Configuração padrão inicial para novos usuários de teste
 * (Todos os widgets ativos por padrão, ordenados)
 */
export const DEFAULT_USER_WIDGETS: UserWidgetConfig[] = [
  { id: 'top_actions', enabled: true, order: 1, gridSpan: 'full' },
  { id: 'humor_rapido', enabled: true, order: 2, gridSpan: 'full' },
  { id: 'medicacao', enabled: true, order: 3, gridSpan: 'full' },
  { id: 'sono', enabled: true, order: 4, gridSpan: 'full' },
  { id: 'woop', enabled: true, order: 5, gridSpan: 'full' },
];

/**
 * Função para resolver a lista final de widgets que devem ser exibidos na tela para o usuário,
 * garantindo ordenação e inclusão das features fixas (core).
 */
export function resolveUserWidgets(savedConfig?: UserWidgetConfig[]): UserWidgetConfig[] {
  if (!savedConfig || savedConfig.length === 0) {
    return [...DEFAULT_USER_WIDGETS].sort((a, b) => a.order - b.order);
  }

  // Filtrar apenas widgets habilitados
  const active = savedConfig.filter(w => w.enabled);

  // Garantir que os widgets core estejam sempre presentes mesmo se omitidos
  const coreIds = Object.values(WIDGET_CATALOG).filter(w => w.isCore).map(w => w.id);
  for (const coreId of coreIds) {
    if (!active.some(w => w.id === coreId)) {
      const def = WIDGET_CATALOG[coreId];
      active.push({
        id: coreId,
        enabled: true,
        order: def.defaultOrder,
        gridSpan: def.defaultGridSpan,
      });
    }
  }

  return active.sort((a, b) => a.order - b.order);
}
