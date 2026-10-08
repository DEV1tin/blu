'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '../../actions';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await authenticate(email, password);
      if (res.success) {
        localStorage.setItem('auth_token', 'simulated_token_123');
        router.push('/');
      } else {
        setErrorMsg(res.message);
        setLoading(false);
      }
    } catch (error) {
      setErrorMsg('Erro de comunicação com o servidor');
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center px-6 bg-background relative overflow-hidden font-inter min-h-screen">
      
      {/* Background Decorativo Glassmorphism */}
      <div className="absolute top-[-10%] left-[-20%] w-72 h-72 bg-blu-aura rounded-full blur-3xl opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-20%] w-72 h-72 bg-blu-base rounded-full blur-3xl opacity-10 pointer-events-none"></div>

      <div className="relative z-10 w-full animate-fade-in-up flex flex-col items-center">
        {/* Mascot / Logo */}
        <div className="mb-8 text-center">
          <div className="w-40 h-40 mx-auto mb-2 relative group flex items-center justify-center">
            <img src="/mascote/mascote-sem-fundo.png" alt="Blu Mascot" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-3xl" />
            <div className="absolute inset-0 bg-blu-aura blur-2xl -z-10 opacity-20 group-hover:opacity-40 transition-opacity"></div>
          </div>
          <h1 className="text-4xl font-nunito font-bold text-foreground mb-1 tracking-tight">Blu.</h1>
          <p className="text-gray-400 text-sm font-inter">Seu espaço seguro e amigável</p>
        </div>

        {/* Form Container */}
        <div className="bg-surface/90 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 shadow-2xl w-full max-w-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">Email ou Usuário</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="você@exemplo.com"
                  className="w-full bg-background/50 border border-gray-700/50 rounded-3xl px-5 py-4 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-inter text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">Senha de Acesso</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background/50 border border-gray-700/50 rounded-3xl px-5 py-4 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-inter text-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-red-400 text-sm text-center font-inter bg-red-500/10 py-2 rounded-xl border border-red-500/20">
                {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-[#8ab08f] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-[#1A1A1A] font-nunito font-bold rounded-3xl py-4 flex items-center justify-center shadow-lg transition-all relative overflow-hidden group text-lg"
              >
                {loading ? (
                  <span className="animate-pulse">Entrando...</span>
                ) : (
                  <>
                    <span>Entrar no Blu.</span>
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </div>
            
          </form>

          <div className="mt-6 text-center">
            <button className="text-sm font-nunito font-bold text-gray-400 hover:text-primary transition-colors">
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-inter">
            Acesso exclusivo para pacientes.
          </p>
        </div>
      </div>
    </main>
  );
}
