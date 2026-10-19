'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../lib/haptics';

export interface WheelOption {
  value: string;
  label: string;
  emoji?: string;
  sublabel?: string;
}

interface WheelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: WheelOption[];
  selectedValue: string;
  onConfirm: (value: string) => void;
}

const ITEM_HEIGHT = 50; // px
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 250px
const PADDING_Y = ITEM_HEIGHT * 2; // 100px para centralizar o 1º e o último

export function WheelPickerModal({
  isOpen,
  onClose,
  title,
  subtitle,
  options,
  selectedValue,
  onConfirm,
}: WheelPickerModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef<number>(-1);
  const isInitialScrollDone = useRef<boolean>(false);

  const findIndex = useCallback(
    (val: string) => {
      const idx = options.findIndex((o) => o.value === val);
      return idx >= 0 ? idx : 0;
    },
    [options]
  );

  const [activeIndex, setActiveIndex] = useState<number>(() => findIndex(selectedValue));

  // Posiciona na opção selecionada ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      isInitialScrollDone.current = false;
      const targetIdx = findIndex(selectedValue);
      setActiveIndex(targetIdx);
      lastIndexRef.current = targetIdx;

      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = targetIdx * ITEM_HEIGHT;
          setTimeout(() => {
            isInitialScrollDone.current = true;
          }, 80);
        }
      });
    }
  }, [isOpen, selectedValue, findIndex]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(options.length - 1, rawIndex));

    if (clampedIndex !== lastIndexRef.current) {
      lastIndexRef.current = clampedIndex;
      setActiveIndex(clampedIndex);
      if (isInitialScrollDone.current) {
        triggerHaptic('tick');
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: 'smooth',
    });
  };

  const handleConfirm = () => {
    triggerHaptic('medium');
    const chosen = options[activeIndex] || options[0];
    if (chosen) {
      onConfirm(chosen.value);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#181A20]/95 backdrop-blur-2xl border-t border-white/15 rounded-t-[32px] p-6 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber Handle */}
        <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header estilo iOS */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="text-sm font-medium text-gray-400 hover:text-white px-2 py-1 transition-colors active:scale-95"
          >
            Cancelar
          </button>

          <div className="text-center">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="text-sm font-bold text-primary hover:text-[#b2d8b7] px-2 py-1 transition-colors active:scale-95"
          >
            Concluir
          </button>
        </div>

        {/* Roleta (UIPickerView) */}
        <div
          className="relative w-full overflow-hidden my-2 select-none"
          style={{ height: `${CONTAINER_HEIGHT}px` }}
        >
          {/* Máscara de Gradiente Superior e Inferior */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#181A20] via-[#181A20]/80 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#181A20] via-[#181A20]/80 to-transparent z-20" />

          {/* Lente de Foco Central (Vidro Jateado Apple) */}
          <div
            className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-2xl bg-white/[0.07] border border-white/15 shadow-inner z-10"
            style={{ height: `${ITEM_HEIGHT}px` }}
          />

          {/* Lista Rolável com Snap */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar relative z-30"
            style={{
              paddingTop: `${PADDING_Y}px`,
              paddingBottom: `${PADDING_Y}px`,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {options.map((opt, idx) => {
              const distance = Math.abs(idx - activeIndex);
              const isCenter = distance === 0;
              const isNear = distance === 1;

              return (
                <div
                  key={opt.value}
                  onClick={() => scrollToIndex(idx)}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className={`snap-center flex items-center justify-center gap-2.5 px-4 cursor-pointer transition-all duration-150 ${
                    isCenter
                      ? 'opacity-100 scale-105 text-white font-bold text-lg'
                      : isNear
                      ? 'opacity-55 scale-95 text-gray-300 font-medium text-base'
                      : 'opacity-25 scale-90 text-gray-500 text-sm'
                  }`}
                >
                  {opt.emoji && <span className="text-xl leading-none">{opt.emoji}</span>}
                  <span>{opt.label}</span>
                  {opt.sublabel && (
                    <span
                      className={`text-xs font-normal ${
                        isCenter ? 'text-primary' : 'text-gray-400'
                      }`}
                    >
                      · {opt.sublabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Botão de Confirmação Principal */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full mt-3 bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20"
        >
          Confirmar Seleção
        </button>
      </div>
    </div>
  );
}
