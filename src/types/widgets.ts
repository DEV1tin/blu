export type WidgetId = 
  | 'top_actions'
  | 'humor_rapido'
  | 'medicacao'
  | 'sono'
  | 'woop';

export type WidgetGridSpan = 'full' | 'half'; // 'full' = 2 colunas, 'half' = 1 coluna em grid de 2

export interface WidgetDefinition {
  id: WidgetId;
  name: string;
  description: string;
  isCore: boolean; // Se true, é padrão para todos (ex: sentimentos/anotações). Se false, é prescrita pelo médico.
  defaultGridSpan: WidgetGridSpan;
  defaultOrder: number;
}

export interface UserWidgetConfig {
  id: WidgetId;
  enabled: boolean;
  order: number;
  gridSpan?: WidgetGridSpan;
}
