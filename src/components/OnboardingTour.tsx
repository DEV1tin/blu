'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { triggerHaptic } from '../lib/haptics';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  placement: 'top' | 'bottom';
}

const TOUR_TARGETS = [
  'tour-humor',
  'tour-medicacao',
  'tour-sono',
  'tour-ferramentas',
  'tour-revisao',
];

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  // Fase: 'intro' (2 cards de apresentação) ou 'tour' (5 passos ancorados)
  const [phase, setPhase] = useState<'intro' | 'tour'>('intro');
  const [introStep, setIntroStep] = useState<0 | 1>(0);
  const [tourStep, setTourStep] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Reiniciar ao abrir
  useEffect(() => {
    if (isOpen) {
      setPhase('intro');
      setIntroStep(0);
      setTourStep(0);
    }
  }, [isOpen]);

  // Atualizar retângulo do elemento alvo na tela
  const updateTargetRect = useCallback(() => {
    if (phase !== 'tour') return;

    const targetId = TOUR_TARGETS[tourStep];
    const el = document.getElementById(targetId);

    if (el) {
      const r = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // Se houver espaço suficiente abaixo (pelo menos 220px), posiciona abaixo; senão, acima
      const spaceBelow = viewportHeight - r.bottom;
      const placement = spaceBelow >= 210 ? 'bottom' : 'top';

      setTargetRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        placement,
      });
    }
  }, [phase, tourStep]);

  // Rola até o elemento e recalcula a posição
  useEffect(() => {
    if (!isOpen || phase !== 'tour') return;

    const targetId = TOUR_TARGETS[tourStep];
    const el = document.getElementById(targetId);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Atualiza após a rolagem suave iniciar e terminar
      const timer1 = setTimeout(updateTargetRect, 100);
      const timer2 = setTimeout(updateTargetRect, 400);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [tourStep, phase, isOpen, updateTargetRect]);

  // Listeners para resize e scroll durante a tour
  useEffect(() => {
    if (!isOpen || phase !== 'tour') return;

    const handleUpdate = () => updateTargetRect();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, phase, updateTargetRect]);

  if (!isOpen) return null;

  const handleNextIntro = () => {
    triggerHaptic('light');
    if (introStep === 0) {
      setIntroStep(1);
    } else {
      setPhase('tour');
      setTourStep(0);
    }
  };

  const handleBackIntro = () => {
    triggerHaptic('light');
    setIntroStep(0);
  };

  const handleNextTour = () => {
    triggerHaptic('light');
    if (tourStep < TOUR_TARGETS.length - 1) {
      setTourStep((prev) => prev + 1);
    } else {
      handleFinalizar();
    }
  };

  const handlePrevTour = () => {
    triggerHaptic('light');
    if (tourStep > 0) {
      setTourStep((prev) => prev - 1);
    } else {
      setPhase('intro');
      setIntroStep(1);
    }
  };

  const handleFinalizar = () => {
    triggerHaptic('success');
    if (typeof window !== 'undefined') {
      localStorage.setItem('blu_onboarding_completed', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in select-none">
      {/* ======================================================== */}
      {/* FASE 1: APRESENTAÇÃO INICIAL (2 CARDS CENTRALIZADOS)    */}
      {/* ======================================================== */}
      {phase === 'intro' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-[#16181D] border border-white/15 rounded-[32px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

            {/* Indicador de passos da introdução (1 de 2) */}
            <div className="w-full flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 rounded-full transition-all ${
                    introStep === 0 ? 'w-6 bg-primary' : 'w-2 bg-primary/40'
                  }`}
                />
                <span
                  className={`h-1.5 rounded-full transition-all ${
                    introStep === 1 ? 'w-6 bg-primary' : 'w-2 bg-white/20'
                  }`}
                />
                <span className="text-[11px] font-semibold text-gray-400 ml-1.5">
                  {introStep + 1} de 2
                </span>
              </div>
              <button
                type="button"
                onClick={handleFinalizar}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Pular tour
              </button>
            </div>

            {/* Mascote Blu */}
            <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-110" />
              <img
                src="/mascote/mascote-sem-fundo.png"
                alt="Blu"
                className="w-20 h-20 object-contain drop-shadow-xl relative z-10"
              />
            </div>

            {introStep === 0 ? (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-2">
                  Bem-vindo ao Blu! 🐾
                </h2>
                <div className="space-y-2.5 text-xs text-gray-300 leading-relaxed mb-6 px-1 text-left">
                  <p>
                    Eu sou o <strong className="text-primary font-bold">Blu</strong>, seu novo{' '}
                    <strong className="text-white">assistente pessoal para autoconhecimento</strong> e
                    acompanhamento da sua saúde mental.
                  </p>
                  <p className="text-gray-400">
                    Aqui você tem um <strong className="text-gray-200">espaço seguro</strong> para
                    expressar o que sente, registrar seu dia e construir uma visão clara do seu bem-estar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNextIntro}
                  className="w-full bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20"
                >
                  Continuar →
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight mb-2">
                  Como funciona no seu dia? ⚡
                </h2>
                <div className="space-y-2.5 text-xs text-gray-300 leading-relaxed mb-6 px-1 text-left">
                  <p>
                    <strong className="text-primary">1. Registros com Zero Atrito:</strong> Durante o
                    dia, anote sentimentos, medicação ou sono em poucos segundos.
                  </p>
                  <p>
                    <strong className="text-amber-300">2. Reflexão e Aprendizado:</strong> Ao final do
                    dia, organizamos esses dados para te ajudar a{' '}
                    <strong className="text-white">encontrar padrões</strong> e cuidar melhor de você.
                  </p>
                </div>
                <div className="w-full flex gap-2">
                  <button
                    type="button"
                    onClick={handleBackIntro}
                    className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] text-gray-200 font-semibold py-3.5 rounded-2xl text-xs transition-all border border-white/10"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNextIntro}
                    className="flex-[2] bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-primary/20"
                  >
                    Ver na Prática →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FASE 2: TOUR REAL ANCORADA COM SPOTLIGHT SOBRE ELEMENTOS */}
      {/* ======================================================== */}
      {phase === 'tour' && targetRect && (
        <>
          {/* Spotlight com recorte iluminado sobre o elemento exato */}
          <div
            className="fixed pointer-events-none rounded-[24px] border-2 border-primary/90 transition-all duration-300 z-40 shadow-[0_0_0_9999px_rgba(0,0,0,0.72),0_0_35px_rgba(155,189,160,0.45)]"
            style={{
              top: `${Math.max(8, targetRect.top - 6)}px`,
              left: `${Math.max(8, targetRect.left - 6)}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
            }}
          />

          {/* Tooltip Card flutuante posicionado acima ou abaixo do elemento */}
          <div
            className="fixed z-50 left-4 right-4 max-w-sm mx-auto transition-all duration-300"
            style={{
              ...(targetRect.placement === 'bottom'
                ? { top: `${Math.min(window.innerHeight - 250, targetRect.bottom + 14)}px` }
                : { bottom: `${Math.min(window.innerHeight - 80, window.innerHeight - targetRect.top + 14)}px` }),
            }}
          >
            <div className="bg-[#16181D]/98 border border-white/20 rounded-[26px] p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex flex-col relative overflow-hidden backdrop-blur-xl animate-fade-in">
              {/* Seta indicadora (Arrow Pointer) */}
              <div
                className={`absolute left-8 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent ${
                  targetRect.placement === 'bottom'
                    ? '-top-2 border-b-[8px] border-b-primary'
                    : '-bottom-2 border-t-[8px] border-t-white/20'
                }`}
              />

              {/* Header com Progresso dos 5 passos da Tour */}
              <div className="flex items-center justify-between mb-2.5 border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === tourStep
                          ? 'w-5 bg-primary'
                          : i < tourStep
                          ? 'w-1.5 bg-primary/40'
                          : 'w-1.5 bg-white/20'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-semibold text-gray-400 ml-1.5">
                    {tourStep + 1} de 5
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleFinalizar}
                  className="text-xs text-gray-400 hover:text-gray-200 px-1 py-0.5 transition-colors"
                >
                  Pular
                </button>
              </div>

              {/* Corpo com Mascote e Texto Formatado para Leitura Rápida */}
              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-12 h-12 flex-shrink-0 relative">
                  <img
                    src="/mascote/mascote-sem-fundo.png"
                    alt="Blu"
                    className="w-full h-full object-contain drop-shadow"
                  />
                </div>

                <div className="flex-1 text-left">
                  {/* PASSO 1: HUMOR & VOZ */}
                  {tourStep === 0 && (
                    <>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        1. Humor & Desabafo Livre
                      </h3>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        Seu <strong className="text-white">espaço aberto</strong> para falar o que quiser.
                        Toque nos sentimentos ou <strong className="text-primary">use o microfone</strong>{' '}
                        para desabafar por voz no seu próprio ritmo, sem interrupções.
                      </p>
                    </>
                  )}

                  {/* PASSO 2: MEDICAÇÃO */}
                  {tourStep === 1 && (
                    <>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        2. Medicação Diária
                      </h3>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        Marque suas doses com facilidade. Use a{' '}
                        <strong className="text-white">roleta estilo Apple</strong> para selecionar de{' '}
                        <strong className="text-primary">10 a 200mg</strong> e{' '}
                        <strong className="text-white">edite ou apague</strong> registros a qualquer momento.
                      </p>
                    </>
                  )}

                  {/* PASSO 3: QUALIDADE DO SONO */}
                  {tourStep === 2 && (
                    <>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        3. Sono & Descanso
                      </h3>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        Registre suas <strong className="text-white">horas de sono</strong> e a{' '}
                        <strong className="text-white">qualidade do descanso</strong>. Essencial para
                        correlacionar noites difíceis com picos de cansaço ou ansiedade.
                      </p>
                    </>
                  )}

                  {/* PASSO 4: MINHAS FERRAMENTAS */}
                  {tourStep === 3 && (
                    <>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        4. Minhas Ferramentas
                      </h3>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        Aqui você encontra <strong className="text-white">ferramentas práticas</strong> para
                        te apoiar no dia a dia, como o{' '}
                        <strong className="text-primary">WOOP para foco e intenção diária</strong>.
                      </p>
                    </>
                  )}

                  {/* PASSO 5: REVISÃO DO DIA COM IA DO BLU */}
                  {tourStep === 4 && (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-amber-400 text-xs">✨</span>
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          5. Revisão do Dia
                        </h3>
                      </div>
                      <p className="text-xs text-gray-100 leading-relaxed">
                        Aqui é onde a{' '}
                        <strong className="text-white bg-primary/20 px-1 py-0.5 rounded">
                          IA do Blu te ajuda a transformar tudo o que anotamos em aprendizado
                        </strong>!
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed mt-1">
                        Ela analisa seus registros para{' '}
                        <strong className="text-gray-200">encontrar padrões</strong> e apoiar seu bem-estar.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevTour}
                  className="px-3.5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-gray-300 font-semibold rounded-xl text-xs transition-colors border border-white/10"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={handleNextTour}
                  className="flex-1 bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                >
                  {tourStep === TOUR_TARGETS.length - 1 ? (
                    <>
                      <span>🚀</span> Começar a Usar!
                    </>
                  ) : (
                    <>
                      <span>Próximo</span> →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
