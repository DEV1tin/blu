'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getPerfilUsuario } from '../actions';

export default function Perfil() {
  const router = useRouter();
  const { user, loading, logout, updateUserProfile } = useAuth();

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [medicoResponsavel, setMedicoResponsavel] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    if (user) {
      setNome(user.displayName || '');
      setEmail(user.email || '');

      // Buscar dados extras do Firestore (médico responsável)
      getPerfilUsuario(user.uid).then(perfil => {
        if (perfil?.medicoResponsavel) {
          setMedicoResponsavel(perfil.medicoResponsavel);
        }
      }).catch(console.error);
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      const res = await updateUserProfile({
        nome,
        email,
        senha: novaSenha ? novaSenha : undefined,
        medicoResponsavel,
      });

      if (res.success) {
        setMensagemSucesso('Cadastro atualizado com sucesso!');
        setNovaSenha('');
        setTimeout(() => {
          setEditando(false);
          setMensagemSucesso('');
        }, 1500);
      } else {
        setMensagemErro(res.message || 'Falha ao atualizar dados.');
      }
    } catch {
      setMensagemErro('Ocorreu um erro ao salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen overflow-y-auto pb-12">
      <header className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => {
            if (editando) setEditando(false);
            else router.back();
          }} 
          className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {editando ? 'Editar Cadastro' : 'Meu Perfil'}
          </h1>
        </div>
      </header>

      {/* MODO VISUALIZAÇÃO */}
      {!editando ? (
        <>
          <div className="flex flex-col items-center mb-6 animate-fade-in-up">
            <div className="w-24 h-24 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner">
              👤
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {user?.displayName || 'Paciente'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          </div>

          <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 mb-4 animate-fade-in-up">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Dados Clínicos</h3>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/50 mb-3">
              <span className="text-gray-400 text-sm">Médico Responsável</span>
              <span className="text-white font-medium text-sm">
                {medicoResponsavel || 'Não vinculado (Testes)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Acompanhamento</span>
              <span className="text-white font-medium text-sm">Ativo</span>
            </div>
          </div>

          <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 mb-6 animate-fade-in-up">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Conta de Acesso</h3>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/50 mb-3">
              <span className="text-gray-400 text-sm">Login / E-mail</span>
              <span className="text-white font-medium text-sm truncate max-w-[200px]">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/50 mb-3">
              <span className="text-gray-400 text-sm">Senha</span>
              <span className="text-gray-400 font-mono text-sm">••••••••</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Status</span>
              <span className="text-green-400 font-medium text-xs bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">Conectado</span>
            </div>
          </div>

          <div className="space-y-3 mt-auto animate-fade-in-up">
            <button 
              onClick={() => {
                setEditando(true);
                setMensagemErro('');
                setMensagemSucesso('');
              }}
              className="w-full bg-primary hover:bg-[#8ab08f] text-[#1A1A1A] font-nunito font-bold py-3.5 rounded-2xl text-base transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>✏️</span> Editar Cadastro
            </button>

            <button 
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3.5 rounded-2xl text-sm transition-colors border border-red-500/30 flex items-center justify-center gap-2"
            >
              <span>🚪</span> Sair da Conta
            </button>
          </div>
        </>
      ) : (
        /* MODO EDIÇÃO DO FORMULÁRIO */
        <form onSubmit={handleSalvar} className="animate-fade-in flex flex-col flex-1 space-y-4">
          <div className="bg-surface border border-gray-700/50 rounded-3xl p-5 space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">
                Nome Completo
              </label>
              <input 
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">
                Médico Responsável
              </label>
              <input 
                type="text"
                value={medicoResponsavel}
                onChange={(e) => setMedicoResponsavel(e.target.value)}
                placeholder="Ex: Dr. Bruno (ou deixe vazio se não tiver)"
                className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">
                E-mail (Login)
              </label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-nunito font-bold text-gray-400 uppercase tracking-wider ml-1">
                Nova Senha (Opcional)
              </label>
              <input 
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                className="w-full bg-background/50 border border-gray-700/50 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <p className="text-[11px] text-gray-500 ml-1">Mínimo 6 caracteres se for alterar.</p>
            </div>

          </div>

          {mensagemErro && (
            <div className="text-red-400 text-xs text-center font-inter bg-red-500/10 py-3 px-3 rounded-2xl border border-red-500/20 leading-relaxed animate-fade-in">
              {mensagemErro}
            </div>
          )}

          {mensagemSucesso && (
            <div className="text-green-400 text-xs text-center font-inter bg-green-500/10 py-3 px-3 rounded-2xl border border-green-500/20 leading-relaxed animate-fade-in">
              {mensagemSucesso}
            </div>
          )}

          <div className="space-y-3 pt-2 mt-auto">
            <button 
              type="submit"
              disabled={salvando}
              className="w-full bg-primary hover:bg-[#8ab08f] disabled:opacity-70 text-[#1A1A1A] font-nunito font-bold py-3.5 rounded-2xl text-base transition-all shadow-md flex items-center justify-center gap-2"
            >
              {salvando ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setEditando(false);
                setMensagemErro('');
                setMensagemSucesso('');
              }}
              className="w-full bg-surface/70 hover:bg-gray-700 text-gray-300 font-semibold py-3.5 rounded-2xl text-sm transition-colors border border-gray-700/50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
