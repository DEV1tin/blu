'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addRegistro } from './actions';

// Mock Config
const configMedico = {
  nomeMedico: "Bruno",
  paciente: "Vitor H.",
  modulosAtivos: {
    registroLivre: true,
    dosimetria: true,
    horasSono: true,
    sentimentos: true,
    woop: true
  },
  sentimentosConfigurados: [
    { label: "Ansiedade", color: "text-red-400 border-red-500/30", activeBg: "bg-red-500/20" },
    { label: "Taquicardia", color: "text-orange-400 border-orange-500/30", activeBg: "bg-orange-500/20" },
    { label: "Eufórico/Acelerado", color: "text-purple-400 border-purple-500/30", activeBg: "bg-purple-500/20" },
    { label: "Irritabilidade", color: "text-yellow-400 border-yellow-500/30", activeBg: "bg-yellow-500/20" },
    { label: "Fadiga", color: "text-gray-400 border-slate-500/30", activeBg: "bg-slate-500/20" }
  ]
};

export default function Home() {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  
  // States: Bloco Principal (Sentimentos/Registro)
  const [sentimentosSelecionados, setSentimentosSelecionados] = useState<string[]>([]);
  const [registroTexto, setRegistroTexto] = useState("");
  const [registroPrincipalFeito, setRegistroPrincipalFeito] = useState(false);
  const [outroHorarioAberto, setOutroHorarioAberto] = useState(false);
  const [horarioPersonalizado, setHorarioPersonalizado] = useState("12:00");

  // States: Medicação
  const [medicacaoFeita, setMedicacaoFeita] = useState(false);
  const [medicacaoMg, setMedicacaoMg] = useState("50mg");
  const [medicacaoHora, setMedicacaoHora] = useState("08:00");

  // States: Sono
  const [sonoFeito, setSonoFeito] = useState(false);
  const [sonoHoras, setSonoHoras] = useState("6:00h");
  const [sonoQualidade, setSonoQualidade] = useState("");

  // Handlers
  const toggleSentimento = (label: string) => {
    setSentimentosSelecionados(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleRegistroPrincipal = async () => {
    setRegistroPrincipalFeito(true);
    try {
      await addRegistro({
        tipo: 'TEXTO_SENTIMENTO',
        titulo: sentimentosSelecionados.length > 0 ? sentimentosSelecionados.join(', ') : 'Registro Livre',
        detalhe: registroTexto || 'Nenhum detalhe adicional',
        emoji: sentimentosSelecionados.length > 0 ? '🧠' : '📝',
        hora: outroHorarioAberto ? horarioPersonalizado : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setRegistroPrincipalFeito(false);
      setSentimentosSelecionados([]);
      setRegistroTexto("");
      setOutroHorarioAberto(false);
    }, 3000);
  };

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen relative overflow-y-auto pb-12">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 relative">
          {/* Botão Menu (Hamburger) */}
          <button 
            onClick={() => setMenuAberto(!menuAberto)}
            className="w-10 h-10 bg-surface border border-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {menuAberto && (
            <div className="absolute top-12 left-0 w-48 bg-surface/70 border border-gray-600/50 rounded-2xl shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => { setMenuAberto(false); router.push('/registros'); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                📋 Meus Registros
              </button>
              <div className="h-px bg-gray-700 w-full"></div>
              <button 
                onClick={() => { setMenuAberto(false); router.push('/perfil'); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                👤 Meu Perfil
              </button>
              <div className="h-px bg-gray-700 w-full"></div>
              <button 
                onClick={() => setMenuAberto(false)}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                🤖 Sobre o Blu
              </button>
              <div className="h-px bg-gray-700 w-full"></div>
              <button 
                onClick={() => { setMenuAberto(false); router.push('/ajuda'); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                ❓ Ajuda
              </button>
              <div className="h-px bg-gray-700 w-full"></div>
              <button 
                onClick={() => { setMenuAberto(false); router.push('/relatorio'); }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                📄 Gerar Relatório
              </button>
              <div className="h-px bg-gray-700 w-full"></div>
              <button 
                onClick={() => {
                  setMenuAberto(false);
                  localStorage.removeItem('auth_token');
                  router.push('/login');
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
              >
                🚪 Sair
              </button>
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Olá, {configMedico.paciente}</h1>
            <p className="text-xs text-gray-400">Dr. {configMedico.nomeMedico}</p>
          </div>
        </div>
        
        {/* Avatar (Mascote) */}
        <div className="w-[72px] h-[72px] flex-shrink-0 relative">
          <img src="/mascote/mascote-sem-fundo.png" alt="Blu" className="w-full h-full object-contain drop-shadow-xl" />
        </div>
      </header>

      {/* Botões do Topo (Registros e Revisão) */}
      <div className="flex gap-3 mb-8">
        <button 
          onClick={() => router.push('/registros')}
          className="flex-1 bg-surface border border-gray-700/50 hover:border-gray-600/50 rounded-2xl p-4 flex flex-col items-center justify-center transition-all group"
        >
          <div className="w-10 h-10 bg-surface/70 rounded-full flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform mb-2">
            📋
          </div>
          <span className="font-semibold text-gray-200 text-xs">Meus Registros</span>
        </button>
        <button 
          onClick={() => router.push('/revisao')}
          className="flex-[1.5] bg-gradient-to-br from-primary/80 to-primary border border-primary/30 hover:border-indigo-400/50 rounded-2xl p-4 flex flex-col items-center justify-center transition-all shadow-lg shadow-primary/20/30 group"
        >
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-2">
            ✨
          </div>
          <span className="font-bold text-white text-sm">Fazer Revisão do Dia</span>
        </button>
      </div>

      {/* Bloco Principal: Formulário de Registro */}
      {configMedico.modulosAtivos.sentimentos && (
        <section className="mb-8 bg-surface border border-gray-700/50 rounded-3xl p-5 shadow-lg relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          {!registroPrincipalFeito ? (
            <div className="relative z-10 animate-fade-in">
              <h2 className="text-base font-bold text-white mb-4">Como você está se sentindo agora?</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {configMedico.sentimentosConfigurados.map((s, i) => {
                  const isSelected = sentimentosSelecionados.includes(s.label);
                  return (
                    <button 
                      key={i}
                      onClick={() => toggleSentimento(s.label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 ${
                        isSelected 
                          ? `${s.activeBg} ${s.color} border-transparent` 
                          : `bg-surface/70/50 text-gray-400 border-gray-600/50 hover:bg-surface/70`
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 bg-background border border-gray-600/50/50 rounded-2xl p-1.5 pl-4 mb-5 shadow-inner focus-within:border-primary/50 transition-colors">
                <input 
                  type="text"
                  value={registroTexto}
                  onChange={(e) => setRegistroTexto(e.target.value)}
                  placeholder="Digite ou grave um áudio..."
                  className="bg-transparent text-sm text-white placeholder-slate-500 flex-1 focus:outline-none"
                />
                <button className="w-9 h-9 bg-surface/70 rounded-xl flex items-center justify-center text-white hover:bg-gray-700 transition-colors flex-shrink-0">
                  🎙️
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {!outroHorarioAberto ? (
                  <>
                    <button 
                      onClick={handleRegistroPrincipal}
                      className="w-full bg-primary hover:bg-[#8ab08f] text-[#1A1A1A] font-nunito font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-primary/20"
                    >
                      Fazer Registro
                    </button>
                    <button 
                      onClick={() => setOutroHorarioAberto(true)}
                      className="w-full text-gray-400 hover:text-gray-300 text-xs py-2 font-medium transition-colors"
                    >
                      Registrar em outro horário
                    </button>
                  </>
                ) : (
                  <div className="bg-background border border-gray-600/50/50 rounded-xl p-3 flex flex-col gap-3 animate-fade-in">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Horário do Registro</span>
                      <button onClick={() => setOutroHorarioAberto(false)} className="text-gray-500 hover:text-white text-xs">✕ Fechar</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="time" 
                        value={horarioPersonalizado}
                        onChange={(e) => setHorarioPersonalizado(e.target.value)}
                        className="bg-surface border border-gray-600/50 rounded-xl px-3 py-2 text-sm text-white flex-1 focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                      />
                      <button 
                        onClick={handleRegistroPrincipal}
                        className="bg-primary hover:bg-[#8ab08f] text-[#1A1A1A] font-nunito font-bold px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 animate-fade-in relative z-10">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-3xl mb-3 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                ✓
              </div>
              <span className="text-green-400 font-bold text-lg">Registro realizado!</span>
              <span className="text-gray-400 text-xs mt-1">Salvo com sucesso no seu diário.</span>
            </div>
          )}
        </section>
      )}

      {/* Registros Rápidos (Medicação e Sono) */}
      {(configMedico.modulosAtivos.dosimetria || configMedico.modulosAtivos.horasSono) && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Registros Rápidos</h2>
          <div className="space-y-3">
            
            {/* Bloco: Medicação */}
            {configMedico.modulosAtivos.dosimetria && (
              <div className="bg-surface border border-gray-700/50 rounded-2xl p-4 transition-all">
                {!medicacaoFeita ? (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <span>💊</span> Medicação
                    </h3>
                    <div className="flex items-center gap-2">
                      <select 
                        value={medicacaoMg}
                        onChange={(e) => setMedicacaoMg(e.target.value)}
                        className="bg-background border border-gray-700/50 rounded-xl px-2 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary/50 appearance-none"
                      >
                        <option>10mg</option>
                        <option>20mg</option>
                        <option>50mg</option>
                        <option>100mg</option>
                      </select>
                      <input 
                        type="time" 
                        value={medicacaoHora}
                        onChange={(e) => setMedicacaoHora(e.target.value)}
                        className="bg-background border border-gray-700/50 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary/50 flex-1 [color-scheme:dark]"
                      />
                      <button 
                        onClick={async () => {
                          setMedicacaoFeita(true);
                          try {
                            await addRegistro({
                              tipo: 'MEDICACAO',
                              titulo: 'Medicação',
                              detalhe: `${medicacaoMg}`,
                              emoji: '💊',
                              hora: medicacaoHora
                            });
                          } catch (e) { console.error(e); }
                        }}
                        className="w-10 h-10 bg-primary/10 hover:bg-[#8ab08f]/20 border border-primary/20 rounded-xl flex items-center justify-center text-primary transition-colors flex-shrink-0"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between animate-fade-in w-full">
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center text-[10px] text-green-400 flex-shrink-0">✓</span>
                      <span className="text-[11px] font-medium text-gray-400 truncate">Medicação: {medicacaoHora} - {medicacaoMg}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setMedicacaoFeita(false)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-surface/70 rounded-lg transition-colors text-xs" title="Editar registro">✏️</button>
                      <button onClick={() => setMedicacaoFeita(false)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-surface/70 rounded-lg transition-colors text-lg font-bold leading-none" title="Adicionar nova medicação">+</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bloco: Sono */}
            {configMedico.modulosAtivos.horasSono && (
              <div className="bg-surface border border-gray-700/50 rounded-2xl p-4 transition-all">
                {!sonoFeito ? (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <span>😴</span> Como foi seu sono?
                    </h3>
                    <div className="flex items-center gap-2">
                      <select 
                        value={sonoHoras}
                        onChange={(e) => setSonoHoras(e.target.value)}
                        className="bg-background border border-gray-700/50 rounded-xl px-2 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary/50 flex-1 appearance-none"
                      >
                        {['4:00h', '4:30h', '5:00h', '5:30h', '6:00h', '6:30h', '7:00h', '7:30h', '8:00h', '8:30h', '9:00h+'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      
                      {/* Seletor de Qualidade (Emojis) */}
                      <div className="flex gap-0.5 bg-background border border-gray-700/50 rounded-xl p-1">
                        {[
                          { id: 'ruim', emoji: '😫' },
                          { id: 'regular', emoji: '😐' },
                          { id: 'bom', emoji: '🙂' },
                          { id: 'otimo', emoji: '🤩' }
                        ].map(q => (
                          <button
                            key={q.id}
                            onClick={() => setSonoQualidade(q.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all ${
                              sonoQualidade === q.id 
                                ? 'bg-primary/20 scale-110 opacity-100 grayscale-0' 
                                : 'hover:bg-surface/70 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                            }`}
                          >
                            {q.emoji}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={async () => {
                          if(!sonoQualidade) return;
                          setSonoFeito(true);
                          try {
                            await addRegistro({
                              tipo: 'SONO',
                              titulo: 'Horas de Sono',
                              detalhe: `${sonoHoras} dormidas`,
                              emoji: '😴',
                              qualidade: sonoQualidade === 'ruim' ? '😫' : sonoQualidade === 'regular' ? '😐' : sonoQualidade === 'bom' ? '🙂' : sonoQualidade === 'otimo' ? '🤩' : '',
                              hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            });
                          } catch (e) { console.error(e); }
                        }}
                        disabled={!sonoQualidade}
                        className="w-10 h-10 bg-primary/10 hover:bg-[#8ab08f]/20 disabled:opacity-50 disabled:bg-surface/70 border border-primary/20 disabled:border-gray-600/50 rounded-xl flex items-center justify-center text-primary disabled:text-gray-500 transition-colors flex-shrink-0"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between animate-fade-in w-full">
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center text-[10px] text-green-400 flex-shrink-0">✓</span>
                      <span className="text-[11px] font-medium text-gray-400 truncate">
                        Sono: {sonoHoras} {sonoQualidade === 'ruim' ? '😫' : sonoQualidade === 'regular' ? '😐' : sonoQualidade === 'bom' ? '🙂' : sonoQualidade === 'otimo' ? '🤩' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setSonoFeito(false)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-surface/70 rounded-lg transition-colors text-xs" title="Editar registro">✏️</button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </section>
      )}

      {/* Minhas Ferramentas (WOOP) */}
      {configMedico.modulosAtivos.woop && (
        <section className="mb-auto">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Minhas Ferramentas</h2>
          <div 
            onClick={() => router.push('/woop')}
            className="bg-surface rounded-3xl p-5 border border-gray-700/50 cursor-pointer group hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🎯</span>
              <h3 className="font-bold text-white">WOOP Diário</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Qual seu desejo principal para hoje e o que te impede?</p>
            <div className="w-full bg-surface/70 text-gray-300 font-semibold py-2.5 rounded-xl text-xs text-center group-hover:bg-gray-700 transition-colors">
              Preencher Ferramenta
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
