'use client';

import React, { useState } from 'react';
import { triggerHaptic } from '../lib/haptics';

interface WOOPHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WOOPHelpModal({ isOpen, onClose }: WOOPHelpModalProps) {
  const [step, setStep] = useState<0 | 1>(0);

  if (!isOpen) return null;

  const handleNext = () => {
    triggerHaptic('light');
    if (step === 0) {
      setStep(1);
    } else {
      handleFinalizar();
    }
  };

  const handleBack = () => {
    triggerHaptic('light');
    setStep(0);
  };

  const handleFinalizar = () => {
    triggerHaptic('success');
    if (typeof window !== 'undefined') {
      localStorage.setItem('blu_woop_onboarding_completed', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-sm bg-[#16181D] border border-white/15 rounded-[32px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col relative overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de fundo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header com indicador de passos e botão fechar */}
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-all ${
                step === 0 ? 'w-6 bg-primary' : 'w-2 bg-primary/40'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all ${
                step === 1 ? 'w-6 bg-primary' : 'w-2 bg-white/20'
              }`}
            />
            <span className="text-[11px] font-semibold text-gray-400 ml-1.5">
              {step + 1} de 2
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinalizar}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-1"
          >
            Fechar
          </button>
        </div>

        {/* Mascote Blu Compacto */}
        <div className="flex items-center gap-3 mb-4 bg-white/[0.04] border border-white/10 rounded-2xl p-3">
          <div className="w-12 h-12 flex-shrink-0 relative">
            <img
              src="/mascote/mascote-sem-fundo.png"
              alt="Blu"
              className="w-full h-full object-contain drop-shadow"
            />
          </div>
          <div className="flex-1 text-left">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
              Metodologia Comprovada
            </span>
            <h3 className="text-sm font-bold text-white">
              {step === 0 ? 'Por que o WOOP funciona?' : 'Como preencher seu WOOP?'}
            </h3>
          </div>
        </div>

        {/* Conteúdo Dinâmico com Negritos Estratégicos para Leitura Rápida */}
        {step === 0 ? (
          <div className="space-y-3 text-xs text-gray-300 leading-relaxed mb-6 text-left">
            <p>
              Diferente do pensamento positivo tradicional, o <strong className="text-white">WOOP</strong> é
              uma metodologia criada pela psicóloga <strong className="text-primary font-bold">Gabriele Oettingen</strong> (NYU)
              após mais de 20 anos de pesquisa.
            </p>
            <p>
              Sonhar sozinho engana nosso cérebro achando que já alcançamos o objetivo. O segredo do WOOP é o{' '}
              <strong className="text-white">contraste mental</strong>: você foca no desejo e{' '}
              <strong className="text-amber-300">antecipa o obstáculo interno</strong> (como preguiça, ansiedade ou hesitação).
            </p>
            <p className="text-gray-400">
              Isso cria um <strong className="text-gray-200">gatilho automático no cérebro</strong>, aumentando em mais
              de 2x as chances reais de você agir sem depender de força de vontade.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs text-gray-300 leading-relaxed mb-6 text-left">
            <div className="bg-[#111317] border border-primary/20 rounded-xl p-2.5">
              <span className="text-primary font-bold uppercase text-[10px] block">
                🎯 W - Wish (Desejo)
              </span>
              <p className="text-gray-200 mt-0.5">
                Escolha <strong className="text-white">1 único objetivo realista</strong> e desafiador para as próximas 24h.
              </p>
            </div>

            <div className="bg-[#111317] border border-green-500/20 rounded-xl p-2.5">
              <span className="text-green-400 font-bold uppercase text-[10px] block">
                🌟 O - Outcome (Resultado)
              </span>
              <p className="text-gray-200 mt-0.5">
                Qual é a <strong className="text-white">melhor sensação ou ganho</strong> ao conseguir realizá-lo?
              </p>
            </div>

            <div className="bg-[#111317] border border-amber-500/20 rounded-xl p-2.5">
              <span className="text-amber-400 font-bold uppercase text-[10px] block">
                🚧 O - Obstacle (Obstáculo Interno)
              </span>
              <p className="text-gray-200 mt-0.5">
                Qual é a barreira <strong className="text-white">dentro de você</strong> (distração, medo, cansaço)?
              </p>
            </div>

            <div className="bg-[#111317] border border-blue-500/20 rounded-xl p-2.5">
              <span className="text-blue-400 font-bold uppercase text-[10px] block">
                📋 P - Plan (Plano Se-Então)
              </span>
              <p className="text-gray-200 mt-0.5">
                Uma regra clara: <strong className="text-white">&ldquo;Se [obstáculo], então vou [ação rápida]&rdquo;</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Botões de Navegação */}
        <div className="flex gap-2">
          {step === 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] text-gray-200 font-semibold py-3.5 rounded-2xl text-xs transition-all border border-white/10"
            >
              ← Voltar
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-[2] bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
          >
            {step === 0 ? (
              <>
                <span>Como Praticar</span> →
              </>
            ) : (
              <>
                <span>✓ Entendi, Criar WOOP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
