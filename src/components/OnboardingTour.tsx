'use client';

import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptics';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  // 0: Boas-vindas inicial, 1: Humor & Voz, 2: Medicação, 3: Sono, 4: Revisão do Dia (IA do Blu)
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
    }
  }, [isOpen]);

  // Rola a página suavemente para o elemento do passo atual
  useEffect(() => {
    if (!isOpen) return;

    const targets = ['', 'tour-humor', 'tour-medicacao', 'tour-sono', 'tour-revisao'];
    const currentTargetId = targets[step];

    if (currentTargetId) {
      const el = document.getElementById(currentTargetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [step, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    triggerHaptic('light');
    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      handleFinalizar();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* PASSO 0: CARD DE BOAS-VINDAS CENTRAL */}
      {step === 0 && (
        <div
          className="w-full max-w-sm bg-[#16181D] border border-white/15 rounded-[32px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          {/* Mascote Blu */}
          <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-110" />
            <img
              src="/mascote/mascote-sem-fundo.png"
              alt="Blu"
              className="w-20 h-20 object-contain drop-shadow-xl relative z-10"
            />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight mb-2">
            Bem-vindo ao Blu! 🐾
          </h2>

          <div className="space-y-2 text-xs text-gray-300 leading-relaxed mb-6 px-1">
            <p>
              Eu sou o <strong className="text-primary font-bold">Blu</strong>, seu assistente
              pessoal para autoconhecimento e acompanhamento da sua saúde mental.
            </p>
            <p className="text-gray-400">
              Este app foi feito para você registrar seu dia com zero atrito — sentimentos, remédios,
              sono ou desabafos por áudio. No fim do dia, a gente junta esses dados para te ajudar a
              encontrar padrões e cuidar melhor de você.
            </p>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20"
            >
              Conhecer o Aplicativo →
            </button>
            <button
              type="button"
              onClick={handleFinalizar}
              className="text-xs text-gray-400 hover:text-gray-200 py-1.5 transition-colors"
            >
              Pular apresentação
            </button>
          </div>
        </div>
      )}

      {/* PASSOS 1 A 4: BALÕES DE FOCO GUIADO */}
      {step >= 1 && (
        <div
          className="w-full max-w-sm bg-[#16181D]/95 border border-white/15 rounded-[32px] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col relative overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header do Passo */}
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? 'w-6 bg-primary'
                      : i < step
                      ? 'w-2 bg-primary/40'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
              <span className="text-[11px] font-semibold text-gray-400 ml-1.5">
                {step} de 4
              </span>
            </div>

            <button
              type="button"
              onClick={handleFinalizar}
              className="text-xs text-gray-400 hover:text-gray-200 px-2 py-0.5"
            >
              Pular
            </button>
          </div>

          {/* Conteúdo Dinâmico por Passo */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 flex-shrink-0 relative">
              <img
                src="/mascote/mascote-sem-fundo.png"
                alt="Blu"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>

            <div className="flex-1 bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm p-3 relative shadow-inner">
              <div className="absolute -left-1.5 top-3 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-white/[0.06]" />

              {step === 1 && (
                <>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    1. Como você está se sentindo?
                  </h3>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    Aqui é o seu <strong>espaço aberto</strong> para falar o que quiser, como quiser
                    e contar como está se sentindo. Toque nos sentimentos ou aperte o microfone para
                    desabafar falando livremente no seu tempo.
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    2. Medicação Diária
                  </h3>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    Marque suas doses com facilidade. Você pode girar a roleta estilo Apple para
                    escolher a miligramagem (de 10 a 200mg) e editar ou apagar registros a qualquer
                    momento.
                  </p>
                </>
              )}

              {step === 3 && (
                <>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    3. Qualidade do Sono
                  </h3>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    Como foi sua noite? Anotar o descanso nos ajuda a entender picos de cansaço ou
                    ansiedade no dia seguinte, identificando a relação entre seu sono e seu humor.
                  </p>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-amber-400 text-sm">✨</span>
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      4. Revisão do Dia (O Ouro do App)
                    </h3>
                  </div>
                  <p className="text-xs text-gray-100 leading-relaxed font-medium">
                    Aqui é onde a <strong>IA do Blu te ajuda a transformar tudo o que anotamos em aprendizado</strong>!
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed mt-1">
                    No fim do dia, a inteligência analisa seus registros para te ajudar a entender como
                    foi o seu dia, encontrar padrões e te apoiar a entender melhor seu comportamento.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Botão de Avanço */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {step === 4 ? (
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
      )}
    </div>
  );
}
