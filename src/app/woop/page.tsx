'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { salvarWoop, getWoopDeHoje, excluirWoop } from '../actions';
import { useAuth } from '../../context/AuthContext';
import { WoopData } from '../../types/database';
import { WOOPHelpModal } from '../../components/WOOPHelpModal';
import { triggerHaptic } from '../../lib/haptics';

export default function WOOPPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [woopId, setWoopId] = useState<string | undefined>(undefined);
  const [wish, setWish] = useState('');
  const [outcome, setOutcome] = useState('');
  const [obstacle, setObstacle] = useState('');
  const [plan, setPlan] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [ajudaAberta, setAjudaAberta] = useState(false);

  const uid = user?.uid || 'usr_victor';

  // Gatilho do Onboarding explicativo na primeira vez que abre o WOOP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const jaViu = localStorage.getItem('blu_woop_onboarding_completed') === 'true';
      if (!jaViu) {
        setAjudaAberta(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    if (user?.uid) {
      setIsLoading(true);
      getWoopDeHoje(user.uid)
        .then((hoje: WoopData | null) => {
          if (hoje) {
            setWoopId(hoje.id);
            setWish(hoje.wish || '');
            setOutcome(hoje.outcome || '');
            setObstacle(hoje.obstacle || '');
            setPlan(hoje.plan || '');
          } else {
            setWoopId(undefined);
            setWish('');
            setOutcome('');
            setObstacle('');
            setPlan('');
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user, loading, router]);

  const handleSalvar = async () => {
    if (!wish.trim()) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      await salvarWoop(
        {
          id: woopId,
          wish: wish.trim(),
          outcome: outcome.trim(),
          obstacle: obstacle.trim(),
          plan: plan.trim(),
        },
        uid
      );
      setFeedbackMsg('WOOP salvo com sucesso!');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (e) {
      console.error('Erro ao salvar WOOP:', e);
      setFeedbackMsg('Erro ao salvar WOOP. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluir = async () => {
    if (!woopId) return;
    const confirmou = window.confirm('Tem certeza que deseja excluir o WOOP de hoje?');
    if (!confirmou) return;

    setIsDeleting(true);
    try {
      await excluirWoop(woopId);
      setWoopId(undefined);
      setWish('');
      setOutcome('');
      setObstacle('');
      setPlan('');
      setFeedbackMsg('WOOP excluído com sucesso.');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (e) {
      console.error('Erro ao excluir WOOP:', e);
      alert('Erro ao excluir WOOP.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen overflow-y-auto pb-12">
      {/* Header com botão de ajuda (?) */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {woopId ? 'Editar WOOP do Dia' : 'WOOP do Dia'}
            </h1>
            <p className="text-xs text-gray-400">
              {woopId ? 'Atualize ou gerencie o seu foco de hoje' : 'Um único foco intencional para hoje'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setAjudaAberta(true);
          }}
          className="w-9 h-9 bg-surface/90 hover:bg-white/[0.08] active:scale-95 border border-white/10 hover:border-primary/40 rounded-full flex items-center justify-center text-primary font-bold text-sm transition-all shadow-md flex-shrink-0"
          title="Como funciona a metodologia WOOP?"
        >
          ?
        </button>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Carregando WOOP...
        </div>
      ) : (
        <div className="animate-fade-in-up">
          {/* Mensagem de Feedback */}
          {feedbackMsg && (
            <div className="bg-primary/20 border border-primary/40 rounded-2xl p-3 mb-5 text-primary text-xs font-semibold text-center animate-fade-in">
              {feedbackMsg}
            </div>
          )}

          {/* Card com o Formulário */}
          <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 mb-6 shadow-xl space-y-4">
            {woopId && (
              <div className="flex items-center justify-between border-b border-gray-700/50 pb-3 mb-1">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  WOOP Ativo Hoje
                </span>
                <span className="text-[11px] text-gray-500">
                  (Limite: 1 por dia)
                </span>
              </div>
            )}

            {/* W - Wish */}
            <div>
              <label className="text-xs font-bold text-primary uppercase flex items-center gap-1.5 mb-1">
                <span>🎯</span> Wish (Desejo)
              </label>
              <input
                type="text"
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                placeholder="Qual seu desejo realista mais importante hoje?"
                className="w-full bg-background border border-gray-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-gray-500"
              />
            </div>

            {/* O - Outcome */}
            <div>
              <label className="text-xs font-bold text-green-400 uppercase flex items-center gap-1.5 mb-1">
                <span>✨</span> Outcome (Melhor Resultado)
              </label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Como você vai se sentir ao alcançar isso?"
                className="w-full bg-background border border-gray-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-400 transition-colors placeholder:text-gray-500"
              />
            </div>

            {/* O - Obstacle */}
            <div>
              <label className="text-xs font-bold text-orange-400 uppercase flex items-center gap-1.5 mb-1">
                <span>🚧</span> Obstacle (Obstáculo Interno)
              </label>
              <input
                type="text"
                value={obstacle}
                onChange={(e) => setObstacle(e.target.value)}
                placeholder="O que dentro de você (procrastinação, cansaço) pode atrapalhar?"
                className="w-full bg-background border border-gray-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-400 transition-colors placeholder:text-gray-500"
              />
            </div>

            {/* P - Plan */}
            <div>
              <label className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 mb-1">
                <span>💡</span> Plan (Plano Se... Então...)
              </label>
              <input
                type="text"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Se [o obstáculo acontecer], então eu vou [ação rápida]..."
                className="w-full bg-background border border-gray-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors placeholder:text-gray-500"
              />
            </div>

            {/* Botões de Ação */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={handleSalvar}
                disabled={!wish.trim() || isSubmitting || isDeleting}
                className="w-full bg-primary hover:bg-[#8ab08f] disabled:opacity-50 text-[#121826] font-bold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? 'Salvando...'
                  : woopId
                  ? 'Salvar Alterações'
                  : 'Salvar WOOP de Hoje'}
              </button>

              {woopId && (
                <button
                  type="button"
                  onClick={handleExcluir}
                  disabled={isSubmitting || isDeleting}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? 'Excluindo...' : '🗑️ Excluir WOOP de Hoje'}
                </button>
              )}
            </div>
          </div>

          {/* Dica do Método WOOP */}
          <div className="bg-surface/50 border border-gray-700/40 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
            <h4 className="font-bold text-gray-300 text-xs uppercase tracking-wide">
              💡 Sobre o Método WOOP
            </h4>
            <p className="leading-relaxed">
              O WOOP é uma estratégia científica para autorregulação: definir um único desejo por dia, visualizar o melhor benefício, antecipar o obstáculo interno e definir uma ação imediata no formato <em>&quot;Se... Então...&quot;</em>.
            </p>
          </div>
        </div>
      )}

      {/* Modal de Ajuda / Onboarding da Metodologia WOOP */}
      <WOOPHelpModal
        isOpen={ajudaAberta}
        onClose={() => setAjudaAberta(false)}
      />
    </main>
  );
}
