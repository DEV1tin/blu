'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  getRegistrosDeHoje,
  getWoopDeHoje,
  getRevisaoDeHoje,
  gerarReflexaoBluAction,
  salvarRevisao,
} from '../actions';
import { getLogicalDateString } from '../../lib/dateUtils';
import { RegistroData, WoopData } from '../../types/database';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { VoiceListeningModal } from '../../components/VoiceListeningModal';
import { triggerHaptic } from '../../lib/haptics';

type Phase = 'loading_init' | 'timeline' | 'loading_ai' | 'ai_feedback' | 'done';

function renderFormattedMessage(text: string) {
  if (!text) return null;
  const paragraphs = text.split('\n\n');
  return paragraphs.map((p, i) => {
    const parts = p.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="mb-3.5 leading-relaxed text-indigo-100/90 text-sm">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="text-white font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export default function RevisaoDoDia() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isListening, startListening, stopListening, syncManualText } = useSpeechRecognition();

  const [phase, setPhase] = useState<Phase>('loading_init');
  const [registrosHoje, setRegistrosHoje] = useState<RegistroData[]>([]);
  const [woopHoje, setWoopHoje] = useState<WoopData | null>(null);

  // Estado da Revisão e Resposta da IA
  const [revisaoId, setRevisaoId] = useState<string | undefined>(undefined);
  const [mensagemDoBlu, setMensagemDoBlu] = useState<string>('');
  const [perguntasReflexao, setPerguntasReflexao] = useState<string[]>([]);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [avisoFallback, setAvisoFallback] = useState<string>('');
  const [reflexao, setReflexao] = useState<string>('');
  const [reflexaoAntesModal, setReflexaoAntesModal] = useState<string>('');
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    if (user?.uid) {
      Promise.all([
        getRegistrosDeHoje(user.uid),
        getWoopDeHoje(user.uid),
        getRevisaoDeHoje(user.uid),
      ])
        .then(([hoje, woop, revExistente]) => {
          const list: RegistroData[] = [];
          if (hoje.sono) list.push(hoje.sono);
          if (hoje.medicacao) list.push(hoje.medicacao);
          list.push(...hoje.sentimentos);
          setRegistrosHoje(list);
          setWoopHoje(woop);

          if (revExistente) {
            setRevisaoId(revExistente.id);
            setReflexao(revExistente.respostaReflexao || '');

            const isOldGeneric =
              revExistente.isFallback ||
              revExistente.mensagemDoBlu?.includes('Muito bom ter você aqui encerrando mais um dia') ||
              revExistente.mensagemDoBlu?.includes('anotou sua medicação');

            if (!isOldGeneric) {
              setMensagemDoBlu(revExistente.mensagemDoBlu || '');
              setPerguntasReflexao(revExistente.perguntasReflexao || []);
              setIsFallback(false);
            }
          }
        })
        .catch(console.error)
        .finally(() => {
          setTimeout(() => setPhase('timeline'), 800);
        });
    }
  }, [user, authLoading, router]);

  const handleIniciarReflexaoIA = async () => {
    setPhase('loading_ai');
    const uid = user?.uid || 'usr_victor';
    const nomePaciente = user?.displayName || 'Paciente';

    try {
      const resultado = await gerarReflexaoBluAction({
        uid,
        nomePaciente,
        registrosHoje,
        woopHoje,
      });

      setMensagemDoBlu(resultado.mensagemDoBlu);
      setPerguntasReflexao(resultado.perguntasReflexao);
      setIsFallback(Boolean(resultado.isFallback));
      setAvisoFallback(
        resultado.avisoFallback ||
          'Ops, parece que o Blu não está em casa agora! 🐾 Mas ele deixou este recado e perguntas especiais para você refletir sobre o seu dia:'
      );

      // Já salva as perguntas do Blu no Firestore para que fiquem registradas em "Meus Registros"
      const revSalva = await salvarRevisao({
        id: revisaoId,
        pacienteId: uid,
        dataLogica: getLogicalDateString(),
        mensagemDoBlu: resultado.mensagemDoBlu,
        perguntasReflexao: resultado.perguntasReflexao,
        respostaReflexao: reflexao,
        isFallback: resultado.isFallback,
      });

      if (revSalva?.id) {
        setRevisaoId(revSalva.id);
      }
    } catch (err) {
      console.error('Erro ao consultar IA na revisão:', err);
    } finally {
      setPhase('ai_feedback');
    }
  };

  const handleEnviarReflexao = async (textoOverride?: string) => {
    stopListening();
    setVoiceModalOpen(false);
    setIsSaving(true);
    const textoFinal = typeof textoOverride === 'string' ? textoOverride.trim() : reflexao.trim();

    if (user?.uid && textoFinal) {
      try {
        await salvarRevisao({
          id: revisaoId,
          pacienteId: user.uid,
          dataLogica: getLogicalDateString(),
          mensagemDoBlu,
          perguntasReflexao,
          respostaReflexao: textoFinal,
          isFallback,
        });
      } catch (err) {
        console.error('Erro ao salvar reflexão:', err);
      }
    }
    setIsSaving(false);
    setPhase('done');
    setTimeout(() => {
      router.push('/');
    }, 3500);
  };

  const handleAbrirModalVozRevisao = () => {
    triggerHaptic('medium');
    setReflexaoAntesModal(reflexao);
    setVoiceModalOpen(true);
    startListening((transcript) => {
      setReflexao(transcript);
    }, reflexao);
  };

  return (
    <main className="flex-1 flex flex-col bg-background min-h-screen relative">
      {/* Header Fixo */}
      <header className="flex items-center gap-4 p-6 pb-2 border-b border-gray-700/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
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
          <p className="text-xs text-gray-400">Reflexão Guiada com o Blu</p>
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

            {registrosHoje.length === 0 && !woopHoje ? (
              <div className="bg-surface/50 border border-gray-700/50 rounded-2xl p-6 text-center mb-8">
                <span className="text-3xl mb-2 block">📝</span>
                <p className="text-sm text-gray-300 font-medium">Você ainda não registrou nada hoje.</p>
                <p className="text-xs text-gray-500 mt-1">
                  Ainda assim, você pode conversar com o Blu e refletir sobre como foi seu dia!
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {registrosHoje.length > 0 && (
                  <div className="relative pl-4 space-y-5">
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

                {woopHoje && (
                  <div className="bg-surface/60 border border-primary/30 rounded-2xl p-4 mt-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span>🎯</span>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                        WOOP do Dia
                      </h3>
                    </div>
                    <p className="text-xs text-gray-200 font-medium">
                      <strong>Desejo:</strong> {woopHoje.wish}
                    </p>
                    {woopHoje.plan && (
                      <p className="text-xs text-gray-400 mt-1">
                        <strong>Plano:</strong> {woopHoje.plan}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto pt-4">
              <button
                onClick={handleIniciarReflexaoIA}
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
            <p className="text-sm text-gray-400">Ele está preparando uma reflexão especial para o seu dia.</p>
          </div>
        )}

        {/* FASE 4: Feedback da IA e Formulário */}
        {phase === 'ai_feedback' && (
          <div className="animate-fade-in-up pb-8 flex flex-col gap-6">
            {/* Aviso Divertido caso Fallback */}
            {isFallback && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                <span className="text-lg leading-none">🐾</span>
                <p className="leading-relaxed">
                  {avisoFallback ||
                    'Ops, parece que o Blu não está em casa agora! Mas ele deixou este recado e perguntas especiais para você refletir sobre o seu dia:'}
                </p>
              </div>
            )}

            {/* Mensagem do Blu */}
            <div className="bg-indigo-900/20 border border-primary/30 rounded-3xl p-5 relative mt-4 shadow-xl">
              <div className="absolute -top-5 -left-2 w-12 h-12 rounded-full border-2 border-primary/40 overflow-hidden shadow-lg bg-[#16181D] flex items-center justify-center">
                <img src="/mascote/mascote-sem-fundo.png" alt="Blu" className="w-10 h-10 object-contain drop-shadow" />
              </div>
              <div className="pl-6 pt-1">
                <div className="mb-4">
                  {renderFormattedMessage(mensagemDoBlu)}
                </div>

                {/* Perguntas de Reflexão */}
                <div className="bg-surface/70 rounded-2xl p-4 border border-primary/20 shadow-inner">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>💡</span> Perguntas do Blu para refletir:
                  </h3>
                  <ul className="text-xs text-gray-200 space-y-2.5 list-disc pl-4 marker:text-primary">
                    {perguntasReflexao.map((pergunta, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pergunta}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Botão de Atualizar / Recalcular Reflexão */}
            <div className="flex justify-end -mt-3">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  handleIniciarReflexaoIA();
                }}
                className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/[0.04] active:scale-95"
              >
                <span>🔄</span> Atualizar reflexão com novos registros
              </button>
            </div>

            {/* Input de Reflexão */}
            <div className="bg-surface/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-1">Suas reflexões de hoje</h3>
              <p className="text-xs text-gray-400 mb-4">
                Responda às perguntas do Blu digitando ou usando o microfone. Suas respostas ficarão salvas em Meus Registros.
              </p>

              <div className="bg-[#111317] border border-white/10 focus-within:border-primary/50 rounded-2xl p-2 mb-4 transition-colors shadow-inner">
                <textarea
                  value={reflexao}
                  onChange={(e) => setReflexao(e.target.value)}
                  placeholder="Escreva aqui suas respostas ou toque no mic para desabafar..."
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none h-28 p-2 focus:outline-none"
                />
                <div className="flex justify-between items-center px-2 pb-1">
                  <span className="text-xs text-gray-500">{reflexao.length} caracteres</span>
                  <button
                    type="button"
                    onClick={handleAbrirModalVozRevisao}
                    title="Responder por voz com o Blu"
                    className="h-10 px-3.5 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <span className="text-base leading-none">🎙️</span>
                    <span className="text-xs font-bold">Falar</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleEnviarReflexao()}
                  disabled={reflexao.trim().length === 0 || isSaving}
                  className="w-full bg-primary hover:bg-[#8ab08f] active:scale-[0.98] disabled:bg-surface/70 disabled:text-gray-500 text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-sm transition-all"
                >
                  {isSaving ? 'Salvando...' : 'Salvar e Concluir Reflexão'}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/registros')}
                  className="w-full text-gray-400 hover:text-gray-200 text-xs py-2 font-medium transition-colors"
                >
                  Responder depois em Meus Registros →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FASE 5: Concluído (Mensagem padrão fixa acolhedora, sem 2ª chamada de IA) */}
        {phase === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center px-4">
            <div className="w-20 h-20 rounded-full border-2 border-primary p-1 mb-5 shadow-[0_0_30px_rgba(163,198,168,0.25)]">
              <img
                src="/mascote.jpg"
                alt="Blu Feliz"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Revisão Concluída! 💙</h2>
            <p className="text-sm text-gray-200 leading-relaxed max-w-xs mb-2">
              Que bom que você fez essas reflexões! O autoconhecimento é o caminho para a melhora e cada passo conta.
            </p>
            <p className="text-xs text-gray-400">
              Suas respostas já estão salvas em <strong>Meus Registros</strong>. Descanse bem e até amanhã!
            </p>
          </div>
        )}
      </div>

      {/* Modal de Voz na Revisão */}
      <VoiceListeningModal
        isOpen={voiceModalOpen}
        isListening={isListening}
        transcriptText={reflexao}
        onChangeText={(txt) => {
          setReflexao(txt);
          syncManualText(txt);
        }}
        onCancel={() => {
          stopListening();
          setVoiceModalOpen(false);
          setReflexao(reflexaoAntesModal);
        }}
        onKeepInField={(finalText: string) => {
          stopListening();
          setVoiceModalOpen(false);
          setReflexao(finalText);
        }}
        onFinishAndSubmit={(finalText) => handleEnviarReflexao(finalText)}
        submitLabel="Concluir e Salvar Reflexão"
      />
    </main>
  );
}
