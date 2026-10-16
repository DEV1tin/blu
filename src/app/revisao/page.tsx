'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getRegistrosDeHoje, salvarRevisao } from '../actions';
import { getLogicalDateString } from '../../lib/dateUtils';
import { RegistroData } from '../../types/database';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

type Phase = 'loading_init' | 'timeline' | 'loading_ai' | 'ai_feedback' | 'done';

export default function RevisaoDoDia() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isListening, toggleListening, stopListening } = useSpeechRecognition();
  const [phase, setPhase] = useState<Phase>('loading_init');
  const [reflexao, setReflexao] = useState("");
  const [registrosHoje, setRegistrosHoje] = useState<RegistroData[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    if (user?.uid) {
      getRegistrosDeHoje(user.uid).then(hoje => {
        const list: RegistroData[] = [];
        if (hoje.sono) list.push(hoje.sono);
        if (hoje.medicacao) list.push(hoje.medicacao);
        list.push(...hoje.sentimentos);
        setRegistrosHoje(list);
      }).catch(console.error);
    }
  }, [user, authLoading, router]);

  // Simulação dos tempos de carregamento
  useEffect(() => {
    if (phase === 'loading_init') {
      const timer = setTimeout(() => setPhase('timeline'), 1500);
      return () => clearTimeout(timer);
    }
    if (phase === 'loading_ai') {
      const timer = setTimeout(() => setPhase('ai_feedback'), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleEnviarReflexao = async () => {
    stopListening();
    if (user?.uid) {
      try {
        await salvarRevisao({
          pacienteId: user.uid,
          dataLogica: getLogicalDateString(),
          respostaReflexao: reflexao,
        });
      } catch (err) {
        console.error('Erro ao salvar reflexão:', err);
      }
    }
    setPhase('done');
    setTimeout(() => {
      router.push('/');
    }, 2500);
  };

  return (
    <main className="flex-1 flex flex-col bg-background min-h-screen relative">
      {/* Header Fixo */}
      <header className="flex items-center gap-4 p-6 pb-2 border-b border-gray-700/50/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Revisão do Dia</h1>
          <p className="text-xs text-gray-400">Reflexão Guiada</p>
        </div>
      </header>

      <div className="p-6 flex-1 flex flex-col">
        
        {/* FASE 1: Loading Inicial */}
        {phase === 'loading_init' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center">
            <div className="w-16 h-16 bg-surface border-2 border-primary/30 rounded-full flex items-center justify-center text-3xl animate-pulse shadow-[0_0_30px_rgba(99,102,241,0.2)] mb-4">
              📅
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Buscando seus registros...</h2>
            <p className="text-sm text-gray-400">Preparando o resumo de hoje.</p>
          </div>
        )}

        {/* FASE 2: Timeline de Resumo */}
        {phase === 'timeline' && (
          <div className="animate-fade-in-up flex flex-col flex-1">
            <p className="text-sm text-gray-400 mb-6 font-medium">
              Veja o que você anotou hoje ↓
            </p>

            {registrosHoje.length === 0 ? (
              <div className="bg-surface/50 border border-gray-700/50 rounded-2xl p-6 text-center mb-8">
                <span className="text-3xl mb-2 block">📝</span>
                <p className="text-sm text-gray-300 font-medium">Você ainda não registrou nada hoje.</p>
                <p className="text-xs text-gray-500 mt-1">Ainda assim, você pode refletir sobre seu dia com o Blu!</p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-5 mb-8">
                <div className="absolute left-[27px] top-4 bottom-4 w-px bg-surface/70"></div>
                {registrosHoje.map((reg, index) => (
                  <div key={reg.id || index} className="flex gap-4 relative">
                    <div className="flex flex-col items-center mt-1 z-10 w-12 flex-shrink-0">
                      <span className="text-xs font-bold text-gray-500 mb-1">{reg.hora}</span>
                      <div className="w-3 h-3 bg-gray-700 rounded-full border-4 border-slate-950"></div>
                    </div>
                    <div className="flex-1 bg-surface/50 border border-gray-700/50 rounded-2xl p-3 flex gap-3 opacity-90">
                      <div className="text-xl mt-0.5">{reg.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-gray-200 text-sm">
                          {reg.titulo} {reg.qualidade}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">{reg.detalhe}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-4">
              <button 
                onClick={() => setPhase('loading_ai')}
                className="w-full bg-primary hover:bg-[#8ab08f] text-[#1A1A1A] font-nunito font-bold py-4 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-surface">
                  <img src="/mascote/mascote-sem-fundo.png" alt="Blu" className="w-full h-full object-contain" />
                </div>
                Vamos refletir como foi seu dia?
              </button>
            </div>
          </div>
        )}

        {/* FASE 3: Loading AI */}
        {phase === 'loading_ai' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center">
            <div className="w-20 h-20 border-2 border-primary rounded-full flex items-center justify-center mb-6 relative p-1">
              <div className="absolute inset-0 bg-blu-aura/50 animate-ping rounded-full"></div>
              <div className="relative z-10 w-full h-full rounded-full overflow-hidden">
                <img src="/mascote.jpg" alt="Blu Pensando" className="w-full h-full object-cover" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">O Blu está lendo seus registros...</h2>
            <p className="text-sm text-gray-400">Ele está pensando nas melhores perguntas para você.</p>
          </div>
        )}

        {/* FASE 4: Feedback da IA e Formulário */}
        {phase === 'ai_feedback' && (
          <div className="animate-fade-in-up pb-8 flex flex-col gap-6">
            
            {/* Mensagem do Blu */}
            <div className="bg-indigo-900/20 border border-primary/30 rounded-3xl p-5 relative">
              <div className="absolute -top-6 -left-2 w-12 h-12 rounded-full border-4 border-background overflow-hidden shadow-lg">
                <img src="/mascote.jpg" alt="Blu" className="w-full h-full object-cover" />
              </div>
              <div className="pl-8 pt-2">
                <p className="text-sm text-indigo-100 leading-relaxed mb-4">
                  <strong>Olá, {user?.displayName || 'Paciente'}!</strong> Muito bem por ter mantido seus registros hoje. A consistência no autocuidado é o passo mais importante. Parabéns! 💙
                </p>
                <p className="text-sm text-indigo-200 leading-relaxed mb-5">
                  Analisando seus dados de hoje, preparei estas perguntas para você refletir antes de descansar:
                </p>
                
                {/* Perguntas de Reflexão */}
                <div className="bg-surface/50 rounded-2xl p-4 border border-primary/20">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Questões para refletir:</h3>
                  <ul className="text-sm text-gray-300 space-y-2 list-disc pl-4 marker:text-primary">
                    <li>Qual foi o momento mais tranquilo do seu dia de hoje?</li>
                    <li>Teve algo que te gerou desconforto ou ansiedade? O que você fez para contornar?</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Input de Reflexão */}
            <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-3">Quer anotar suas reflexões?</h3>
              <p className="text-xs text-gray-400 mb-4">Responda ao Blu digitando ou por áudio.</p>
              
              <div className={`bg-background border rounded-2xl p-2 mb-4 transition-colors shadow-inner ${
                isListening ? 'border-red-500/50 bg-red-500/5' : 'border-gray-600/50/50 focus-within:border-primary/50'
              }`}>
                <textarea 
                  value={reflexao}
                  onChange={(e) => setReflexao(e.target.value)}
                  placeholder={isListening ? "Ouvindo sua reflexão..." : "Hoje o meu dia foi..."}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 resize-none h-24 p-2 focus:outline-none"
                />
                <div className="flex justify-between items-center px-2 pb-1">
                  <span className="text-xs text-gray-500">{reflexao.length} caracteres</span>
                  <button 
                    type="button"
                    onClick={() => toggleListening(reflexao, setReflexao)}
                    title={isListening ? "Parar ditado" : "Ditar por voz"}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isListening 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' 
                        : 'bg-surface/70 text-white hover:bg-gray-700'
                    }`}
                  >
                    {isListening ? '⏹️' : '🎙️'}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleEnviarReflexao}
                disabled={reflexao.length === 0}
                className="w-full bg-primary hover:bg-[#8ab08f] disabled:bg-surface/70 disabled:text-gray-500 text-[#1A1A1A] font-nunito font-bold py-3.5 rounded-xl text-sm transition-colors"
              >
                Enviar Reflexão
              </button>
            </div>
          </div>
        )}

        {/* FASE 5: Concluído */}
        {phase === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-4xl mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              ✓
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Revisão Concluída!</h2>
            <p className="text-sm text-gray-400">Sua reflexão foi salva com sucesso.<br/>Descanse bem e até amanhã!</p>
          </div>
        )}

      </div>
    </main>
  );
}
