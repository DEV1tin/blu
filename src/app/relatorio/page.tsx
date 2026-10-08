'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RelatorioScreen() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState('15');
  const [gerando, setGerando] = useState(false);
  const [relatorioPronto, setRelatorioPronto] = useState(false);

  const handleGerar = () => {
    setGerando(true);
    // Simular tempo de processamento da IA
    setTimeout(() => {
      setGerando(false);
      setRelatorioPronto(true);
    }, 2500);
  };

  const handleCompartilhar = () => {
    // Aqui no futuro será gerado o PDF e chamado a Web Share API
    alert("O PDF seria gerado aqui e a tela de compartilhamento nativa (WhatsApp/Email) seria aberta para você enviar para o Psiquiatra.");
  };

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Relatório Médico</h1>
          <p className="text-xs text-gray-400">Resumo Inteligente para o Psiquiatra</p>
        </div>
      </header>

      {!relatorioPronto ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="w-24 h-24 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
            <span className="text-4xl relative z-10">📄</span>
            {gerando && (
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            )}
          </div>
          
          <h2 className="text-lg font-bold text-gray-200 mb-2 text-center">Configurar Relatório</h2>
          <p className="text-sm text-gray-400 text-center mb-8 max-w-xs">
            Escolha o período para a IA analisar seus registros e criar um resumo clínico.
          </p>

          <div className="w-full max-w-xs bg-surface border border-gray-700/50 rounded-2xl p-4 mb-8">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Período de Análise</label>
            <select 
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={gerando}
              className="w-full bg-background text-gray-200 border border-gray-600/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-50"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </div>

          <button 
            onClick={handleGerar}
            disabled={gerando}
            className="w-full max-w-xs bg-primary hover:bg-[#8ab08f] disabled:opacity-70 disabled:cursor-not-allowed text-[#1A1A1A] font-nunito font-bold rounded-2xl py-4 flex items-center justify-center shadow-lg transition-all"
          >
            {gerando ? "Analisando Registros..." : "Gerar Resumo com IA"}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-fade-in">
          <div className="bg-surface border border-gray-700/50 rounded-3xl p-6 shadow-xl mb-auto">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-700/50 pb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Resumo Gerado</h3>
                <p className="text-xs text-primary">Análise dos últimos {periodo} dias</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
              <p>
                <strong className="text-gray-100">Visão Geral:</strong> O paciente manteve boa estabilidade na maior parte do período, com episódios pontuais de <em>Ansiedade</em> nas manhãs de terça-feira.
              </p>
              <p>
                <strong className="text-gray-100">Aderência:</strong> Relatou uso contínuo da medicação (50mg) sem faltas no período analisado.
              </p>
              <p>
                <strong className="text-gray-100">Sono:</strong> Média de 6:30h dormidas, reportando qualidade "Regular" a "Boa". Há indícios de piora na qualidade do sono nos dias que antecederam picos de ansiedade.
              </p>
              <p>
                <strong className="text-gray-100">Atenção:</strong> No dia 3, o registro livre mencionou desconforto significativo no ambiente de trabalho. Recomendado explorar o gatilho na próxima sessão.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button 
              onClick={handleCompartilhar}
              className="w-full bg-primary hover:bg-[#8ab08f] text-[#1A1A1A] font-nunito font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>📤</span> Compartilhar PDF com Psiquiatra
            </button>
            <button 
              onClick={() => setRelatorioPronto(false)}
              className="w-full text-gray-400 hover:text-white font-medium text-sm py-3 transition-colors"
            >
              Gerar novo período
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
