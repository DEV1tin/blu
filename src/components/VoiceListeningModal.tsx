'use client';

import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptics';

interface VoiceListeningModalProps {
  isOpen: boolean;
  isListening: boolean;
  transcriptText: string;
  onChangeText: (newText: string) => void;
  onCancel: () => void;
  onFinishAndSubmit: (finalText: string) => void;
  onKeepInField?: (finalText: string) => void;
  submitLabel?: string;
}

export function VoiceListeningModal({
  isOpen,
  isListening,
  transcriptText,
  onChangeText,
  onCancel,
  onFinishAndSubmit,
  submitLabel = 'Concluir e Enviar',
}: VoiceListeningModalProps) {
  const [seconds, setSeconds] = useState(0);

  // Cronômetro da sessão
  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-xl animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-[#16181D]/95 border border-white/10 rounded-[32px] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior Minimalista */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold text-red-300 font-mono tracking-wide">
              {formatTime(seconds)}
            </span>
            {isListening && (
              <span className="text-[11px] text-gray-400 font-medium">· gravando</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onCancel();
            }}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors text-xs"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Mascote Blu de um lado + Balão de Fala do outro */}
        <div className="flex items-center gap-3.5 mb-4 px-1">
          {/* Mascote Blu */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse" />
            <img
              src="/mascote/mascote-sem-fundo.png"
              alt="Blu"
              className="w-14 h-14 object-contain relative z-10 drop-shadow-md"
            />
          </div>

          {/* Balão de Fala Amigável (Speech Bubble) */}
          <div className="relative flex-1 bg-white/[0.07] border border-white/10 rounded-2xl rounded-tl-sm p-3 shadow-sm">
            {/* Triângulo / Ponta do Balão apontando para o Blu */}
            <div
              className="absolute -left-1.5 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white/[0.07]"
            />
            <p className="text-sm font-semibold text-white leading-snug">
              Estou te escutando, como está se sentindo?
            </p>
          </div>
        </div>

        {/* Caixa de Transcrição Minimalista */}
        <div className="w-full bg-[#0F1115] border border-white/10 rounded-2xl p-3.5 mb-4 shadow-inner">
          <textarea
            value={transcriptText}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="Fale no seu tempo, suas palavras aparecerão aqui..."
            className="w-full h-28 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none leading-relaxed"
          />
        </div>

        {/* Ação Única Direta e Minimalista */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('success');
            onFinishAndSubmit(transcriptText);
          }}
          disabled={!transcriptText.trim()}
          className="w-full bg-primary hover:bg-[#8ab08f] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <span>✓</span> {submitLabel}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onCancel();
          }}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-300 py-2.5 transition-colors mt-1"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
