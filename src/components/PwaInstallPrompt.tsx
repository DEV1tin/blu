'use client';

import React, { useState, useEffect } from 'react';

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Verifica se já está instalado como app (Standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Já está rodando como PWA, não exibir nada
    }

    // 2. Verifica se é computador (Desktop) - a regra é NÃO exibir em desktop
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isIos || isAndroid;

    if (!isMobile) {
      return; // Computador desktop: não exibir
    }

    // 3. Verifica se o usuário dispensou recentemente (nos últimos 3 dias)
    const dismissedTime = localStorage.getItem('blu_pwa_dismissed');
    if (dismissedTime) {
      const tresDias = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - Number(dismissedTime) < tresDias) {
        return;
      }
    }

    if (isIos) {
      setPlatform('ios');
      // Delay suave para não assustar o usuário assim que a página carrega
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    if (isAndroid) {
      setPlatform('android');

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Fallback: se o evento não disparar em 3s, exibe o aviso com orientações
      const fallbackTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearTimeout(fallbackTimer);
      };
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    try {
      localStorage.setItem('blu_pwa_dismissed', Date.now().toString());
    } catch {}
  };

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Erro ao instalar PWA:', err);
      }
    } else {
      // Se não tiver o deferredPrompt, orienta o usuário no Chrome/Android
      alert(
        'Para instalar: toque no menu de 3 pontinhos (⋮) do navegador no canto superior e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".'
      );
      handleDismiss();
    }
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Banner inferior fixo em celulares */}
      <aside aria-label="Instalação do Aplicativo" className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in-up">
        <div className="bg-[#1a2234] border border-primary/30 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface/80 border border-primary/20 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/mascote/mascote-sem-fundo.png"
              alt="Blu"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              Instalar o Blu no Celular
            </h4>
            <p className="text-xs text-gray-400 leading-tight">
              Acesse em tela cheia como um aplicativo nativo.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {platform === 'android' ? (
              <button
                onClick={handleInstallAndroid}
                className="bg-primary hover:bg-[#8ab08f] text-[#121826] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95"
              >
                Instalar
              </button>
            ) : (
              <button
                onClick={() => setShowIosGuide(true)}
                className="bg-primary hover:bg-[#8ab08f] text-[#121826] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95"
              >
                Como instalar
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 text-xs transition-colors"
              title="Dispensar"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Guia Passo a Passo para iOS (iPhone / Safari) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1a2234] border border-primary/30 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-fade-in-up">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-surface/80 border border-primary/20 p-1 flex items-center justify-center overflow-hidden">
                <img
                  src="/mascote/mascote-sem-fundo.png"
                  alt="Blu"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Adicionar ao iPhone
                </h3>
                <p className="text-xs text-primary font-medium">
                  Sem barra de navegador
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-5 leading-relaxed">
              Siga os 3 passos simples abaixo no Safari para colocar o ícone do Blu na sua tela de início:
            </p>

            <div className="space-y-4 mb-6">
              {/* Passo 1 */}
              <div className="flex items-start gap-3 bg-surface/60 rounded-2xl p-3 border border-gray-700/50">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div className="text-xs text-gray-200">
                  <span className="font-bold text-white block mb-0.5">
                    1. Toque em Compartilhar
                  </span>
                  Na barra inferior do Safari, toque no ícone de quadrado com a seta para cima.
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex items-start gap-3 bg-surface/60 rounded-2xl p-3 border border-gray-700/50">
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-base font-bold">
                  ⊞
                </div>
                <div className="text-xs text-gray-200">
                  <span className="font-bold text-white block mb-0.5">
                    2. Tela de Início
                  </span>
                  Role as opções para baixo e selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                </div>
              </div>

              {/* Passo 3 */}
              <div className="flex items-start gap-3 bg-surface/60 rounded-2xl p-3 border border-gray-700/50">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  OK
                </div>
                <div className="text-xs text-gray-200">
                  <span className="font-bold text-white block mb-0.5">
                    3. Confirmar
                  </span>
                  Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior direito. Pronto! O Blu agora abre como app.
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full bg-primary hover:bg-[#8ab08f] text-[#121826] font-bold text-sm py-3 rounded-2xl transition-all shadow-md active:scale-95"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
