'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [modoCadastro, setModoCadastro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (modoCadastro) {
        if (!firstName.trim()) {
          setErrorMsg('Por favor, informe seu primeiro nome.');
          setLoading(false);
          return;
        }
        const nomeCompleto = secondName.trim()
          ? `${firstName.trim()} ${secondName.trim()}`
          : firstName.trim();
        const res = await register(email, password, nomeCompleto);
        if (res.success) {
          router.push('/');
        } else {
          setErrorMsg(res.message || 'Falha ao criar conta.');
          setLoading(false);
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          router.push('/');
        } else {
          setErrorMsg(res.message || 'E-mail ou senha incorretos.');
          setLoading(false);
        }
      }
    } catch {
      setErrorMsg('Erro de comunicação. Tente novamente.');
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
        <div className="mb-6 text-center">
          <div className="w-36 h-36 mx-auto mb-2 relative group flex items-center justify-center">
            <img src="/mascote/mascote-sem-fundo.png" alt="Blu Mascot" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-3xl" />
            <div className="absolute inset-0 bg-blu-aura blur-2xl -z-10 opacity-20 group-hover:opacity-40 transition-opacity"></div>
          </div>
          <h1 className="text-4xl font-nunito font-bold text-foreground mb-1 tracking-tight">Blu.</h1>
          <p className="text-gray-400 text-sm font-inter">Seu espaço seguro e amigável</p>
        </div>

        {/* Form Container */}
        <div className="bg-surface/90 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 shadow-2xl w-full max-w-sm">
          
          {/* Seletor de Modo: Entrar / Criar Conta */}
          <div className="flex bg-background/60 p-1 rounded-2xl mb-5 border border-gray-700/40">
            <button
              type="button"
              onClick={() => { setModoCadastro(false); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-nunito font-bold rounded-xl transition-all ${
                !modoCadastro 
                  ? 'bg-primary text-[#1A1A1A] shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setModoCadastro(true); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-nunito font-bold rounded-xl transition-all ${
                modoCadastro 
                  ? 'bg-primary text-[#1A1A1A] shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {modoCadastro && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Primeiro Nome
                  </label>
                  <input 
                    type="text" 
                    required={modoCadastro}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: João"
                    className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-4 py-3.5 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-inter text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Sobrenome
                  </label>
                  <input 
                    type="text" 
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    placeholder="Ex: Silva"
                    className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-4 py-3.5 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-inter text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-5 py-3.5 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-inter text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-5 py-3.5 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-inter text-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-red-400 text-xs text-center font-inter bg-red-500/10 py-2.5 px-3 rounded-xl border border-red-500/20 animate-fade-in leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-[#8ab08f] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-[#1A1A1A] font-nunito font-bold rounded-2xl py-3.5 flex items-center justify-center shadow-lg transition-all relative overflow-hidden group text-base"
              >
                {loading ? (
                  <span className="animate-pulse">{modoCadastro ? 'Criando conta...' : 'Entrando...'}</span>
                ) : (
                  <>
                    <span>{modoCadastro ? 'Criar minha Conta' : 'Entrar no Blu.'}</span>
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </div>
            
          </form>

          {!modoCadastro && (
            <div className="mt-5 text-center">
              <button 
                type="button"
                onClick={() => alert('Em breve recuperação automática de senha via e-mail.')}
                className="text-xs font-nunito font-semibold text-gray-400 hover:text-primary transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 font-inter">
            Acompanhamento contínuo de saúde mental.
          </p>
        </div>
      </div>
    </main>
  );
}
