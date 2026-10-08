'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Ajuda() {
  const router = useRouter();

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Ajuda e Suporte</h1>
        </div>
      </header>

      <div className="space-y-4 animate-fade-in-up">
        <button className="w-full bg-surface border border-gray-700/50 hover:bg-surface/70 hover:border-gray-600/50 rounded-3xl p-5 flex items-center gap-4 transition-all text-left group">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
            💬
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Falar com seu Médico</h2>
            <p className="text-xs text-gray-400 mt-1">Contato direto via WhatsApp</p>
          </div>
        </button>

        <button className="w-full bg-surface border border-gray-700/50 hover:bg-surface/70 hover:border-gray-600/50 rounded-3xl p-5 flex items-center gap-4 transition-all text-left group">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
            ✉️
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Suporte do App</h2>
            <p className="text-xs text-gray-400 mt-1">Relatar um erro ou tirar dúvida técnica</p>
          </div>
        </button>
      </div>
    </main>
  );
}
