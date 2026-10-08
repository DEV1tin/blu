'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Perfil() {
  const router = useRouter();

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Meu Perfil</h1>
        </div>
      </header>

      <div className="flex flex-col items-center mb-8 animate-fade-in-up">
        <div className="w-24 h-24 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner">
          👤
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Victor H.</h2>
        <p className="text-gray-400 text-sm mt-1">28 anos</p>
      </div>

      <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Dados Clínicos</h3>
        <div className="flex justify-between items-center pb-3 border-b border-gray-700/50 mb-3">
          <span className="text-gray-400 text-sm">Médico Responsável</span>
          <span className="text-white font-medium text-sm">Dr. Bruno</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Acompanhamento desde</span>
          <span className="text-white font-medium text-sm">Outubro 2026</span>
        </div>
      </div>

      <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Conta</h3>
        <div className="flex justify-between items-center pb-3 border-b border-gray-700/50 mb-3">
          <span className="text-gray-400 text-sm">E-mail</span>
          <span className="text-white font-medium text-sm">victor@exemplo.com</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Senha</span>
          <span className="text-white font-medium text-sm">••••••••</span>
        </div>
      </div>

      <button className="w-full bg-surface/70 hover:bg-gray-700 text-white font-bold py-4 rounded-xl text-sm transition-colors border border-gray-600/50 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        Editar Dados de Acesso
      </button>
    </main>
  );
}
