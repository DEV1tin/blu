'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRegistros, getRevisoes, salvarRevisao } from '../actions';
import { useAuth } from '../../context/AuthContext';
import { getLogicalDate, getLogicalDateString } from '../../lib/dateUtils';
import { RevisaoDiariaData } from '../../types/database';

function formatDateFromKey(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export default function MeusRegistros() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [registros, setRegistros] = useState<any[]>([]);
  const [revisoes, setRevisoes] = useState<RevisaoDiariaData[]>([]);
  const [filtroData, setFiltroData] = useState<string>('todos');

  // Estados para responder/editar a reflexão do Blu diretamente em Meus Registros
  const [editandoRevisaoKey, setEditandoRevisaoKey] = useState<string | null>(null);
  const [textoRespostaTemp, setTextoRespostaTemp] = useState<string>('');
  const [salvandoRevisaoKey, setSalvandoRevisaoKey] = useState<string | null>(null);
  const [feedbackPadraoKey, setFeedbackPadraoKey] = useState<string | null>(null);

  const todayKey = useMemo(() => getLogicalDateString(new Date()), []);
  const yesterdayKey = useMemo(() => {
    const d = getLogicalDate(new Date());
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (user?.uid) {
      Promise.all([getRegistros(user.uid), getRevisoes(user.uid)])
        .then(([regs, revs]) => {
          setRegistros(regs);
          setRevisoes(revs);
        })
        .catch(console.error);
    }
  }, [user, loading, router]);

  const groupedDays = useMemo(() => {
    const groups: Record<
      string,
      {
        dateStr: string;
        sono: any[];
        timeline: any[];
        revisao: RevisaoDiariaData | null;
      }
    > = {};

    const ensureGroup = (dateStr: string) => {
      if (!groups[dateStr]) {
        groups[dateStr] = {
          dateStr,
          sono: [],
          timeline: [],
          revisao: null,
        };
      }
    };

    registros.forEach((reg) => {
      const dateStr = reg.dataLogica || getLogicalDateString(new Date(reg.createdAt));
      ensureGroup(dateStr);

      if (reg.tipo === 'SONO') {
        groups[dateStr].sono.push(reg);
      } else {
        groups[dateStr].timeline.push(reg);
      }
    });

    revisoes.forEach((rev) => {
      const dateStr = rev.dataLogica || getLogicalDateString(new Date(rev.createdAt));
      ensureGroup(dateStr);
      // Mantém a revisão mais recente daquele dia lógico
      if (!groups[dateStr].revisao) {
        groups[dateStr].revisao = rev;
      }
    });

    const sortedDays = Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    sortedDays.forEach((day) => {
      day.timeline.sort((a, b) => {
        const timeA = a.hora || '00:00';
        const timeB = b.hora || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return sortedDays;
  }, [registros, revisoes]);

  const filteredGroups = useMemo(() => {
    if (filtroData === 'hoje') {
      return groupedDays.filter((g) => g.dateStr === todayKey);
    }
    if (filtroData === 'ontem') {
      return groupedDays.filter((g) => g.dateStr === yesterdayKey);
    }
    return groupedDays;
  }, [groupedDays, filtroData, todayKey, yesterdayKey]);

  const handleSalvarRespostaRevisao = async (rev: RevisaoDiariaData) => {
    if (!user?.uid || !textoRespostaTemp.trim()) return;
    setSalvandoRevisaoKey(rev.dataLogica);

    try {
      const atualizada = await salvarRevisao({
        id: rev.id,
        pacienteId: user.uid,
        dataLogica: rev.dataLogica,
        mensagemDoBlu: rev.mensagemDoBlu,
        perguntasReflexao: rev.perguntasReflexao,
        respostaReflexao: textoRespostaTemp.trim(),
        isFallback: rev.isFallback,
      });

      setRevisoes((prev) =>
        prev.map((item) => (item.dataLogica === rev.dataLogica ? atualizada : item))
      );
      setEditandoRevisaoKey(null);
      setFeedbackPadraoKey(rev.dataLogica);
    } catch (err) {
      console.error('Erro ao salvar resposta da revisão:', err);
    } finally {
      setSalvandoRevisaoKey(null);
    }
  };

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen overflow-y-auto pb-12">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
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
          onChange={(e) => setFiltroData(e.target.value)}
          className="bg-surface text-gray-300 text-sm border border-gray-700/50 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50"
        >
          <option value="todos">Todos</option>
          <option value="hoje">Hoje</option>
          <option value="ontem">Ontem</option>
        </select>
      </header>

      {filteredGroups.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-10">Nenhum registro encontrado.</p>
      )}

      {filteredGroups.map((group) => {
        const title =
          group.dateStr === todayKey
            ? 'Hoje'
            : group.dateStr === yesterdayKey
            ? 'Ontem'
            : formatDateFromKey(group.dateStr);

        const rev = group.revisao;
        const estaEditandoRevisao =
          editandoRevisaoKey === group.dateStr || (rev && !rev.respostaReflexao);

        return (
          <div key={group.dateStr} className="mb-10">
            <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-gray-700/50">
              {title}
            </h2>

            {/* Registro de Sono fora da timeline */}
            {group.sono.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Horas de Sono
                </h3>
                {group.sono.map((reg) => (
                  <div
                    key={reg.id}
                    className="bg-surface border border-gray-700/50 rounded-2xl p-4 flex justify-between items-start group hover:border-gray-600/50 transition-colors"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="text-2xl">{reg.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-2">
                          {reg.titulo}
                          {reg.qualidade && (
                            <span className="text-base leading-none">{reg.qualidade}</span>
                          )}
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
                  <div
                    key={reg.id}
                    className="flex gap-4 relative animate-fade-in-up"
                    style={{ animationFillMode: 'both' }}
                  >
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
                            {reg.qualidade && (
                              <span className="text-base leading-none">{reg.qualidade}</span>
                            )}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1 leading-relaxed">{reg.detalhe}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revisão do Dia com o Blu (No final dos registros do dia) */}
            {rev && (
              <div className="mt-6 bg-indigo-950/25 border border-primary/30 rounded-3xl p-5 shadow-lg animate-fade-in">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-primary/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/40 flex-shrink-0">
                      <img src="/mascote.jpg" alt="Blu" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Revisão do Dia com o Blu</h3>
                      {rev.hora && (
                        <span className="text-[11px] text-gray-400">Realizada às {rev.hora}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                    Reflexão Diária
                  </span>
                </div>

                {/* Mensagem do Blu */}
                {rev.mensagemDoBlu && (
                  <p className="text-xs text-indigo-100/90 leading-relaxed mb-4 whitespace-pre-line">
                    {rev.mensagemDoBlu}
                  </p>
                )}

                {/* Perguntas do Blu */}
                {rev.perguntasReflexao && rev.perguntasReflexao.length > 0 && (
                  <div className="bg-surface/60 rounded-2xl p-3.5 border border-gray-700/50 mb-4">
                    <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">
                      Perguntas do Blu:
                    </h4>
                    <ul className="text-xs text-gray-200 space-y-1.5 list-disc pl-4 marker:text-primary">
                      {rev.perguntasReflexao.map((p, i) => (
                        <li key={i} className="leading-relaxed">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resposta do Paciente ou Caixa para Responder */}
                {!estaEditandoRevisao ? (
                  <div className="bg-background/80 rounded-2xl p-3.5 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider">
                        Sua Reflexão Registrada:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoRevisaoKey(group.dateStr);
                          setTextoRespostaTemp(rev.respostaReflexao || '');
                        }}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        ✏️ Editar
                      </button>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                      {rev.respostaReflexao}
                    </p>
                  </div>
                ) : (
                  <div className="bg-background/90 rounded-2xl p-3.5 border border-primary/30">
                    <label className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-2">
                      {rev.respostaReflexao
                        ? 'Editar suas respostas para o Blu:'
                        : 'Registrar suas respostas para as perguntas do Blu:'}
                    </label>
                    <textarea
                      value={
                        editandoRevisaoKey === group.dateStr
                          ? textoRespostaTemp
                          : rev.respostaReflexao || textoRespostaTemp
                      }
                      onFocus={() => {
                        if (editandoRevisaoKey !== group.dateStr) {
                          setEditandoRevisaoKey(group.dateStr);
                          setTextoRespostaTemp(rev.respostaReflexao || '');
                        }
                      }}
                      onChange={(e) => {
                        if (editandoRevisaoKey !== group.dateStr) {
                          setEditandoRevisaoKey(group.dateStr);
                        }
                        setTextoRespostaTemp(e.target.value);
                      }}
                      placeholder="Escreva aqui o que você refletiu sobre as perguntas do Blu..."
                      className="w-full bg-surface/60 border border-gray-700/60 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 resize-none h-20 focus:outline-none focus:border-primary"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      {rev.respostaReflexao && (
                        <button
                          type="button"
                          onClick={() => setEditandoRevisaoKey(null)}
                          className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSalvarRespostaRevisao(rev)}
                        disabled={
                          salvandoRevisaoKey === group.dateStr || !textoRespostaTemp.trim()
                        }
                        className="bg-primary hover:bg-[#8ab08f] disabled:opacity-50 text-[#121826] font-bold px-4 py-1.5 rounded-xl text-xs transition-colors"
                      >
                        {salvandoRevisaoKey === group.dateStr
                          ? 'Salvando...'
                          : 'Salvar Reflexão'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensagem padrão acolhedora do Blu após o paciente responder */}
                {feedbackPadraoKey === group.dateStr && (
                  <div className="mt-3 bg-primary/15 border border-primary/30 rounded-2xl p-3 text-xs text-primary flex items-center gap-2 animate-fade-in">
                    <span>💙</span>
                    <span>
                      Que bom que você fez essas reflexões! O autoconhecimento é o caminho para a melhora.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
