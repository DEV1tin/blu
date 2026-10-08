'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { getRegistros } from '../actions';

// Helpers para agrupar as datas com a regra das 02:00 AM
function getLogicalDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  if (d.getHours() < 2) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

function isToday(date: Date) {
  const today = getLogicalDate(new Date());
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function isYesterday(date: Date) {
  const yesterday = getLogicalDate(new Date());
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
}

export default function MeusRegistros() {
  const router = useRouter();
  const [registros, setRegistros] = useState<any[]>([]);
  const [filtroData, setFiltroData] = useState<string>('todos');

  React.useEffect(() => {
    getRegistros().then(setRegistros).catch(console.error);
  }, []);

  const groupedRegistros = useMemo(() => {
    const groups: Record<string, { dateObj: Date, sono: any[], timeline: any[] }> = {};

    registros.forEach(reg => {
      const logicalDate = getLogicalDate(reg.createdAt);
      const dateStr = logicalDate.toISOString().split('T')[0];
      
      if (!groups[dateStr]) {
        groups[dateStr] = {
          dateObj: logicalDate,
          sono: [],
          timeline: []
        };
      }

      if (reg.tipo === 'SONO') {
        groups[dateStr].sono.push(reg);
      } else {
        groups[dateStr].timeline.push(reg);
      }
    });

    // Ordenar os dias do mais recente para o mais antigo
    const sortedDays = Object.values(groups).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    
    // Ordenar a timeline dentro de cada dia por hora
    sortedDays.forEach(day => {
      day.timeline.sort((a, b) => {
        const timeA = a.hora || '00:00';
        const timeB = b.hora || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return sortedDays;
  }, [registros]);

  const filteredGroups = useMemo(() => {
    if (filtroData === 'hoje') {
      return groupedRegistros.filter(g => isToday(g.dateObj));
    }
    if (filtroData === 'ontem') {
      return groupedRegistros.filter(g => isYesterday(g.dateObj));
    }
    return groupedRegistros;
  }, [groupedRegistros, filtroData]);

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Meus Registros</h1>
          </div>
        </div>
        
        {/* Filtro simples */}
        <select 
          value={filtroData}
          onChange={e => setFiltroData(e.target.value)}
          className="bg-surface text-gray-300 text-sm border border-gray-700/50 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50"
        >
          <option value="todos">Todos</option>
          <option value="hoje">Hoje</option>
          <option value="ontem">Ontem</option>
        </select>
      </header>

      {filteredGroups.length === 0 && <p className="text-gray-500 text-sm text-center mt-10">Nenhum registro encontrado.</p>}

      {filteredGroups.map((group, index) => {
        const title = isToday(group.dateObj) ? 'Hoje' : isYesterday(group.dateObj) ? 'Ontem' : formatDate(group.dateObj);
        
        return (
          <div key={index} className="mb-10">
            <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-gray-700/50">{title}</h2>
            
            {/* Registro de Sono fora da timeline */}
            {group.sono.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Horas de Sono</h3>
                {group.sono.map(reg => (
                  <div key={reg.id} className="bg-surface border border-gray-700/50 rounded-2xl p-4 flex justify-between items-start group hover:border-gray-600/50 transition-colors">
                    <div className="flex gap-3 items-center">
                      <div className="text-2xl">{reg.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-2">
                          {reg.titulo}
                          {reg.qualidade && <span className="text-base leading-none">{reg.qualidade}</span>}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{reg.detalhe}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline do restante do dia */}
            {group.timeline.length > 0 && (
              <div className="relative pl-4 space-y-6 mt-4">
                <div className="absolute left-[27px] top-4 bottom-4 w-px bg-surface/70"></div>
                
                {group.timeline.map((reg) => (
                  <div key={reg.id} className="flex gap-4 relative animate-fade-in-up" style={{ animationFillMode: 'both' }}>
                    
                    {/* Hora e Bolinha na linha */}
                    <div className="flex flex-col items-center mt-1 z-10 w-12 flex-shrink-0">
                      <span className="text-xs font-bold text-primary mb-1">{reg.hora}</span>
                      <div className="w-3 h-3 bg-primary rounded-full border-4 border-[#2B2D31]"></div>
                    </div>

                    {/* Card do Registro */}
                    <div className="flex-1 bg-surface border border-gray-700/50 rounded-2xl p-4 flex justify-between items-start group hover:border-gray-600/50 transition-colors">
                      <div className="flex gap-3">
                        <div className="text-2xl mt-0.5">{reg.emoji}</div>
                        <div>
                          <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-2">
                            {reg.titulo}
                            {reg.qualidade && <span className="text-base leading-none">{reg.qualidade}</span>}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1 leading-relaxed">{reg.detalhe}</p>
                        </div>
                      </div>
                      <button className="text-gray-500 hover:text-primary p-2 -mr-2 -mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
