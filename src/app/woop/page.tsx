'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addWoop, getWoops } from '../actions';

export default function WOOPForm() {
  const router = useRouter();
  const [wish, setWish] = useState("");
  const [outcome, setOutcome] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [plan, setPlan] = useState("");
  const [lista, setLista] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getWoops().then(setLista).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if(!wish) return;
    setIsSubmitting(true);
    try {
      const newWoop = await addWoop({ wish, outcome, obstacle, plan });
      setLista([newWoop, ...lista]);
      setWish(""); setOutcome(""); setObstacle(""); setPlan("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen overflow-y-auto">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Ferramenta WOOP</h1>
          <p className="text-xs text-gray-400">Defina e alcance seus objetivos</p>
        </div>
      </header>

      <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 mb-8 animate-fade-in-up">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-primary uppercase">Wish (Desejo)</label>
            <input type="text" value={wish} onChange={e=>setWish(e.target.value)} placeholder="O que você quer muito realizar?" className="w-full bg-background border border-gray-600/50/50 rounded-xl px-4 py-3 mt-1 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-green-400 uppercase">Outcome (Resultado)</label>
            <input type="text" value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder="Como você se sentirá ao realizar isso?" className="w-full bg-background border border-gray-600/50/50 rounded-xl px-4 py-3 mt-1 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-orange-400 uppercase">Obstacle (Obstáculo)</label>
            <input type="text" value={obstacle} onChange={e=>setObstacle(e.target.value)} placeholder="O que dentro de você impede isso?" className="w-full bg-background border border-gray-600/50/50 rounded-xl px-4 py-3 mt-1 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-blue-400 uppercase">Plan (Plano)</label>
            <input type="text" value={plan} onChange={e=>setPlan(e.target.value)} placeholder="Se [obstáculo], então eu vou [ação]" className="w-full bg-background border border-gray-600/50/50 rounded-xl px-4 py-3 mt-1 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
          </div>
          <button onClick={handleAdd} disabled={!wish || isSubmitting} className="w-full bg-primary hover:bg-[#8ab08f] disabled:opacity-50 text-[#1A1A1A] font-nunito font-bold py-3.5 rounded-xl text-sm transition-colors mt-2">
            {isSubmitting ? 'Salvando...' : 'Adicionar WOOP'}
          </button>
        </div>
      </div>

      {lista.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-sm font-bold text-gray-400 uppercase ml-1">Meus WOOPs Ativos</h2>
          {lista.map(item => (
            <div key={item.id} className="bg-surface border border-gray-700/50 rounded-2xl p-4">
              <h3 className="font-bold text-white text-sm mb-2 border-b border-gray-700/50 pb-2"><strong className="text-primary">W:</strong> {item.wish}</h3>
              <p className="text-gray-300 text-xs mt-2"><strong className="text-green-400">O:</strong> {item.outcome}</p>
              <p className="text-gray-300 text-xs mt-1"><strong className="text-orange-400">O:</strong> {item.obstacle}</p>
              <p className="text-gray-300 text-xs mt-1"><strong className="text-blue-400">P:</strong> {item.plan}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
