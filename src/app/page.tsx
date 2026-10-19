'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  addRegistro,
  updateRegistro,
  deleteRegistro,
  getRegistrosDeHoje,
  getWidgetsUsuario,
  getWoopDeHoje,
  excluirWoop,
} from './actions';
import { UserWidgetConfig } from '../types/widgets';
import { RegistroData, WoopData } from '../types/database';
import { DEFAULT_USER_WIDGETS } from '../lib/widgetDefaults';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { WheelPickerModal, WheelOption } from '../components/WheelPickerModal';
import { VoiceListeningModal } from '../components/VoiceListeningModal';
import { OnboardingTour } from '../components/OnboardingTour';
import { triggerHaptic } from '../lib/haptics';

// Configuração do Médico / Sentimentos
const configMedico = {
  nomeMedico: 'Bruno',
  sentimentosConfigurados: [
    { label: 'Ansiedade', color: 'text-red-300 border-red-500/40', activeBg: 'bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]' },
    { label: 'Taquicardia', color: 'text-orange-300 border-orange-500/40', activeBg: 'bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
    { label: 'Eufórico/Acelerado', color: 'text-purple-300 border-purple-500/40', activeBg: 'bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
    { label: 'Irritabilidade', color: 'text-yellow-300 border-yellow-500/40', activeBg: 'bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]' },
    { label: 'Fadiga', color: 'text-slate-300 border-slate-400/40', activeBg: 'bg-slate-500/25 shadow-[0_0_15px_rgba(148,163,184,0.12)]' },
  ],
};

// Opções de Dosagem: de 10mg a 200mg (de 10 em 10mg)
const MEDICACAO_MG_OPTIONS: WheelOption[] = Array.from({ length: 20 }, (_, i) => {
  const mg = (i + 1) * 10;
  return {
    value: `${mg}mg`,
    label: `${mg} mg`,
  };
});

// Opções de Horas de Sono: de 30 em 30 min (Padrão: 6:00h)
const SONO_HORAS_OPTIONS: WheelOption[] = [
  '3:00h',
  '3:30h',
  '4:00h',
  '4:30h',
  '5:00h',
  '5:30h',
  '6:00h',
  '6:30h',
  '7:00h',
  '7:30h',
  '8:00h',
  '8:30h',
  '9:00h',
  '9:30h',
  '10:00h',
  '10:30h',
  '11:00h',
  '11:30h',
  '12:00h',
].map((h) => ({ value: h, label: h }));

// Opções de Qualidade do Sono (Benchmark Apple Health / Sleep Cycle: 5 níveis com Emoji + Descrição)
const SONO_QUALIDADE_OPTIONS: WheelOption[] = [
  { value: '😫 Péssimo', emoji: '😫', label: 'Péssimo', sublabel: 'Muito agitado' },
  { value: '😕 Ruim', emoji: '😕', label: 'Ruim', sublabel: 'Sono leve' },
  { value: '😐 Regular', emoji: '😐', label: 'Regular', sublabel: 'Interrompido' },
  { value: '🙂 Bom', emoji: '🙂', label: 'Bom', sublabel: 'Reparador' },
  { value: '🤩 Ótimo', emoji: '🤩', label: 'Ótimo', sublabel: 'Sono profundo' },
];

// Normaliza registros antigos que guardavam apenas o emoji
function normalizeQualidadeSono(raw: string): string {
  if (!raw) return '🙂 Bom';
  const matchExato = SONO_QUALIDADE_OPTIONS.find((o) => o.value === raw);
  if (matchExato) return matchExato.value;
  const matchEmoji = SONO_QUALIDADE_OPTIONS.find((o) => raw.includes(o.emoji || ''));
  return matchEmoji ? matchEmoji.value : raw;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { isListening, startListening, stopListening, syncManualText } = useSpeechRecognition();
  const [menuAberto, setMenuAberto] = useState(false);

  // Widgets configurados para o usuário (lista ordenada)
  const [widgets, setWidgets] = useState<UserWidgetConfig[]>(DEFAULT_USER_WIDGETS);

  // States: Bloco Principal (Sentimentos/Registro + Modal de Voz)
  const [sentimentosSelecionados, setSentimentosSelecionados] = useState<string[]>([]);
  const [registroTexto, setRegistroTexto] = useState('');
  const [textoAntesDoModal, setTextoAntesDoModal] = useState('');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [registroPrincipalFeito, setRegistroPrincipalFeito] = useState(false);
  const [outroHorarioAberto, setOutroHorarioAberto] = useState(false);
  const [horarioPersonalizado, setHorarioPersonalizado] = useState('12:00');

  // States: Medicação (Suporte a edição real sem duplicar + múltiplas doses se desejar)
  const [medicacoesHoje, setMedicacoesHoje] = useState<RegistroData[]>([]);
  const [modoFormMedicacao, setModoFormMedicacao] = useState<'novo' | 'editar' | 'oculto'>('novo');
  const [editandoMedicacaoId, setEditandoMedicacaoId] = useState<string | null>(null);
  const [medicacaoMg, setMedicacaoMg] = useState('50mg');
  const [medicacaoHora, setMedicacaoHora] = useState('08:00');
  const [pickerMedicacaoAberto, setPickerMedicacaoAberto] = useState(false);

  // States: Sono (Padrão 6:00h + Seletor de Roleta Apple)
  const [sonoFeito, setSonoFeito] = useState(false);
  const [sonoIdHoje, setSonoIdHoje] = useState<string | null>(null);
  const [sonoHoras, setSonoHoras] = useState('6:00h');
  const [sonoQualidade, setSonoQualidade] = useState('🙂 Bom');
  const [pickerSonoHorasAberto, setPickerSonoHorasAberto] = useState(false);
  const [pickerSonoQualidadeAberto, setPickerSonoQualidadeAberto] = useState(false);

  // States: WOOP Diário
  const [woopHoje, setWoopHoje] = useState<WoopData | null>(null);

  // States: Onboarding Tour com o Blu
  const [tourAberta, setTourAberta] = useState(false);

  const uid = user?.uid || 'usr_victor';

  // Gatilho do Onboarding (primeiro acesso ou ?tour=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const forcarTour = urlParams.get('tour') === 'true';
      const jaViu = localStorage.getItem('blu_onboarding_completed') === 'true';

      if (forcarTour || !jaViu) {
        setTourAberta(true);
        if (forcarTour) {
          window.history.replaceState({}, '', '/');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    if (user?.uid) {
      getWidgetsUsuario(user.uid).then(setWidgets).catch(console.error);

      getRegistrosDeHoje(user.uid)
        .then((hoje) => {
          const listaMeds = hoje.medicacoes || (hoje.medicacao ? [hoje.medicacao] : []);
          if (listaMeds.length > 0) {
            setMedicacoesHoje(listaMeds);
            setModoFormMedicacao('oculto');
            setMedicacaoMg(listaMeds[0].detalhe || '50mg');
            setMedicacaoHora(listaMeds[0].hora || '08:00');
          } else {
            setMedicacoesHoje([]);
            setModoFormMedicacao('novo');
          }

          if (hoje.sono) {
            setSonoFeito(true);
            setSonoIdHoje(hoje.sono.id || null);
            setSonoHoras(hoje.sono.detalhe.replace(' dormidas', '') || '6:00h');
            setSonoQualidade(normalizeQualidadeSono(hoje.sono.qualidade || '🙂 Bom'));
          } else {
            setSonoFeito(false);
            setSonoIdHoje(null);
            setSonoHoras('6:00h');
            setSonoQualidade('🙂 Bom');
          }
        })
        .catch(console.error);

      getWoopDeHoje(user.uid).then(setWoopHoje).catch(console.error);
    }
  }, [user, authLoading, router]);

  // Handlers
  const toggleSentimento = (label: string) => {
    triggerHaptic('light');
    setSentimentosSelecionados((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleRegistroPrincipal = async (textoOverride?: string) => {
    stopListening();
    setVoiceModalOpen(false);
    triggerHaptic('success');

    const textoFinal =
      typeof textoOverride === 'string' ? textoOverride.trim() : registroTexto.trim();

    setRegistroPrincipalFeito(true);
    try {
      await addRegistro(
        {
          tipo: 'TEXTO_SENTIMENTO',
          titulo:
            sentimentosSelecionados.length > 0
              ? sentimentosSelecionados.join(', ')
              : 'Registro Livre',
          detalhe: textoFinal || 'Nenhum detalhe adicional',
          emoji: sentimentosSelecionados.length > 0 ? '🧠' : '📝',
          hora: outroHorarioAberto
            ? horarioPersonalizado
            : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
        uid
      );
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setRegistroPrincipalFeito(false);
      setSentimentosSelecionados([]);
      setRegistroTexto('');
      setOutroHorarioAberto(false);
    }, 2800);
  };

  // Abre o Modal "Blu está te escutando"
  const handleAbrirModalVoz = () => {
    triggerHaptic('medium');
    setTextoAntesDoModal(registroTexto);
    setVoiceModalOpen(true);
    startListening((transcript) => {
      setRegistroTexto(transcript);
    }, registroTexto);
  };

  const handleCancelarModalVoz = () => {
    stopListening();
    setVoiceModalOpen(false);
    setRegistroTexto(textoAntesDoModal);
  };

  const handleManterTextoModalVoz = (finalText: string) => {
    stopListening();
    setVoiceModalOpen(false);
    setRegistroTexto(finalText);
  };

  // Salvar ou Atualizar Medicação
  const handleSalvarMedicacao = async () => {
    triggerHaptic('success');

    if (modoFormMedicacao === 'editar' && editandoMedicacaoId) {
      // Atualiza o registro existente sem duplicar!
      try {
        await updateRegistro(editandoMedicacaoId, {
          titulo: 'Medicação',
          detalhe: medicacaoMg,
          emoji: '💊',
          hora: medicacaoHora,
        });
        setMedicacoesHoje((prev) =>
          prev.map((m) =>
            m.id === editandoMedicacaoId
              ? { ...m, detalhe: medicacaoMg, hora: medicacaoHora }
              : m
          )
        );
      } catch (e) {
        console.error(e);
      }
      setEditandoMedicacaoId(null);
      setModoFormMedicacao('oculto');
    } else {
      // Cria um novo registro de medicação
      try {
        const novoReg = await addRegistro(
          {
            tipo: 'MEDICACAO',
            titulo: 'Medicação',
            detalhe: medicacaoMg,
            emoji: '💊',
            hora: medicacaoHora,
          },
          uid
        );
        setMedicacoesHoje((prev) => [novoReg, ...prev]);
      } catch (e) {
        console.error(e);
      }
      setEditandoMedicacaoId(null);
      setModoFormMedicacao('oculto');
    }
  };

  // Salvar ou Atualizar Sono
  const handleSalvarSono = async () => {
    if (!sonoQualidade) return;
    triggerHaptic('success');
    setSonoFeito(true);

    const horaAtual = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      if (sonoIdHoje) {
        await updateRegistro(sonoIdHoje, {
          titulo: 'Horas de Sono',
          detalhe: `${sonoHoras} dormidas`,
          emoji: '😴',
          qualidade: sonoQualidade,
          hora: horaAtual,
        });
      } else {
        const salvo = await addRegistro(
          {
            tipo: 'SONO',
            titulo: 'Horas de Sono',
            detalhe: `${sonoHoras} dormidas`,
            emoji: '😴',
            qualidade: sonoQualidade,
            hora: horaAtual,
          },
          uid
        );
        if (salvo?.id) setSonoIdHoje(salvo.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExcluirMedicacao = async (idParaExcluir?: string) => {
    const id = idParaExcluir || editandoMedicacaoId;
    if (!id) return;
    if (!window.confirm('Deseja realmente apagar este registro de medicação?')) return;
    triggerHaptic('medium');
    try {
      await deleteRegistro(id);
      setMedicacoesHoje((prev) => prev.filter((m) => m.id !== id));
      setEditandoMedicacaoId(null);
      setModoFormMedicacao('oculto');
    } catch (e) {
      console.error(e);
    }
  };

  const handleExcluirSono = async () => {
    if (!sonoIdHoje) return;
    if (!window.confirm('Deseja realmente apagar este registro de sono?')) return;
    triggerHaptic('medium');
    try {
      await deleteRegistro(sonoIdHoje);
      setSonoFeito(false);
      setSonoIdHoje(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Renderizador Dinâmico de Widgets
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'top_actions':
        return (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                triggerHaptic('light');
                router.push('/registros');
              }}
              className="flex-1 bg-surface/90 backdrop-blur-xl border border-white/10 hover:border-white/20 active:scale-[0.98] rounded-3xl p-4 flex flex-col items-center justify-center transition-all shadow-lg group"
            >
              <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center text-gray-200 group-hover:scale-110 transition-transform mb-2">
                📋
              </div>
              <span className="font-semibold text-gray-200 text-xs">Meus Registros</span>
            </button>
            <button
              id="tour-revisao"
              onClick={() => {
                triggerHaptic('light');
                router.push('/revisao');
              }}
              className="flex-[1.5] bg-gradient-to-br from-primary/90 to-[#7da382] border border-white/20 active:scale-[0.98] rounded-3xl p-4 flex flex-col items-center justify-center transition-all shadow-lg shadow-primary/20 group"
            >
              <div className="w-10 h-10 bg-black/15 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-2">
                ✨
              </div>
              <span className="font-extrabold text-[#121418] text-sm">Fazer Revisão do Dia</span>
            </button>
          </div>
        );

      case 'humor_rapido':
        return (
          <section id="tour-humor" className="mb-6 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            {!registroPrincipalFeito ? (
              <div className="relative z-10 animate-fade-in">
                <h2 className="text-base font-bold text-white mb-3.5 tracking-tight">
                  Como você está se sentindo agora?
                </h2>

                {/* Pills de Sentimentos (Padrão ergonômico Apple HIG) */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {configMedico.sentimentosConfigurados.map((s, i) => {
                    const isSelected = sentimentosSelecionados.includes(s.label);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleSentimento(s.label)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95 ${
                          isSelected
                            ? `${s.activeBg} ${s.color}`
                            : 'bg-white/[0.04] text-gray-300 border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Cápsula de Texto + Botão de Microfone que abre o Modal do Blu */}
                <div className="flex items-center gap-2 bg-[#111317] border border-white/10 focus-within:border-primary/50 rounded-2xl p-1.5 pl-4 mb-4 shadow-inner transition-colors">
                  <input
                    type="text"
                    value={registroTexto}
                    onChange={(e) => setRegistroTexto(e.target.value)}
                    placeholder="Digite ou toque no mic para desabafar..."
                    className="bg-transparent text-sm text-white placeholder-gray-500 flex-1 focus:outline-none py-1.5"
                  />
                  <button
                    type="button"
                    onClick={handleAbrirModalVoz}
                    title="Desabafar por voz com o Blu"
                    className="h-10 px-3.5 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
                  >
                    <span className="text-base leading-none">🎙️</span>
                    <span className="text-xs font-bold">Falar</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {!outroHorarioAberto ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRegistroPrincipal()}
                        className="w-full bg-primary hover:bg-[#8ab08f] active:scale-[0.98] text-[#121418] font-nunito font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20"
                      >
                        Fazer Registro
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setOutroHorarioAberto(true);
                        }}
                        className="w-full text-gray-400 hover:text-gray-200 text-xs py-1.5 font-medium transition-colors"
                      >
                        Registrar em outro horário
                      </button>
                    </>
                  ) : (
                    <div className="bg-[#111317] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-3 animate-fade-in">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Horário do Registro
                        </span>
                        <button
                          type="button"
                          onClick={() => setOutroHorarioAberto(false)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          ✕ Fechar
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={horarioPersonalizado}
                          onChange={(e) => setHorarioPersonalizado(e.target.value)}
                          className="bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white flex-1 focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRegistroPrincipal()}
                          className="bg-primary hover:bg-[#8ab08f] active:scale-95 text-[#121418] font-nunito font-bold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
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
                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-3xl mb-3 shadow-[0_0_30px_rgba(34,197,94,0.25)]">
                  ✓
                </div>
                <span className="text-green-400 font-bold text-lg">Registro realizado!</span>
                <span className="text-gray-400 text-xs mt-1">Salvo com sucesso no seu diário.</span>
              </div>
            )}
          </section>
        );

      case 'medicacao':
        return (
          <div id="tour-medicacao" className="mb-4 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-[24px] p-4 shadow-lg transition-all">
            {modoFormMedicacao !== 'oculto' ? (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                    <span>💊</span>
                    {modoFormMedicacao === 'editar'
                      ? 'Editar Medicação'
                      : medicacoesHoje.length > 0
                      ? 'Nova Dose / Medicação'
                      : 'Medicação (Hoje)'}
                  </h3>
                  {medicacoesHoje.length > 0 && (
                    <div className="flex items-center gap-2">
                      {modoFormMedicacao === 'editar' && (
                        <button
                          type="button"
                          onClick={() => handleExcluirMedicacao()}
                          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 transition-colors active:scale-95 flex items-center gap-1"
                        >
                          🗑️ Apagar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setEditandoMedicacaoId(null);
                          setModoFormMedicacao('oculto');
                        }}
                        className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded-lg"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Botão Seletor Roleta Apple (10mg a 200mg) */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPickerMedicacaoAberto(true);
                    }}
                    className="bg-[#111317] hover:bg-white/[0.04] active:scale-95 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-100 flex items-center justify-between gap-2 transition-all min-w-[105px]"
                  >
                    <span>{medicacaoMg}</span>
                    <span className="text-gray-400 text-xs">⌄</span>
                  </button>

                  {/* Seletor Nativo de Horário */}
                  <input
                    type="time"
                    value={medicacaoHora}
                    onChange={(e) => setMedicacaoHora(e.target.value)}
                    className="bg-[#111317] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-primary/50 flex-1 [color-scheme:dark]"
                  />

                  {/* Confirmar Medicação */}
                  <button
                    type="button"
                    onClick={handleSalvarMedicacao}
                    title={modoFormMedicacao === 'editar' ? 'Salvar alteração' : 'Confirmar medicação'}
                    className="w-11 h-10 bg-primary/20 hover:bg-primary/30 active:scale-95 border border-primary/40 rounded-xl flex items-center justify-center text-primary font-bold transition-all flex-shrink-0"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 animate-fade-in w-full">
                {medicacoesHoje.map((med, idx) => (
                  <div
                    key={med.id || idx}
                    className="flex items-center justify-between w-full py-0.5"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                      <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center text-[10px] text-green-400 flex-shrink-0">
                        ✓
                      </span>
                      <span className="text-xs font-semibold text-gray-200 truncate">
                        Medicação: <span className="text-primary">{med.detalhe}</span> às {med.hora}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setEditandoMedicacaoId(med.id || null);
                          setMedicacaoMg(med.detalhe || '50mg');
                          setMedicacaoHora(med.hora || '08:00');
                          setModoFormMedicacao('editar');
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] active:scale-95 rounded-xl transition-all text-xs"
                        title="Editar esta medicação"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirMedicacao(med.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 active:scale-95 rounded-xl transition-all text-xs"
                        title="Apagar esta medicação"
                      >
                        🗑️
                      </button>
                      {idx === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setEditandoMedicacaoId(null);
                            setModoFormMedicacao('novo');
                          }}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-white/[0.06] active:scale-95 rounded-xl transition-all text-lg font-bold leading-none"
                          title="Adicionar outra dose ou medicamento"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'sono':
        return (
          <div id="tour-sono" className="mb-4 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-[24px] p-4 shadow-lg transition-all">
            {!sonoFeito ? (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                    <span>😴</span> Como foi seu sono?
                  </h3>
                  {sonoIdHoje && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExcluirSono}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 transition-colors active:scale-95 flex items-center gap-1"
                      >
                        🗑️ Apagar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setSonoFeito(true);
                        }}
                        className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded-lg"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Seletor Roleta Apple: Horas de Sono (Padrão 6:00h, de 30 em 30 min) */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPickerSonoHorasAberto(true);
                    }}
                    className="bg-[#111317] hover:bg-white/[0.04] active:scale-95 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-100 flex items-center justify-between gap-2 transition-all min-w-[95px]"
                  >
                    <span>{sonoHoras}</span>
                    <span className="text-gray-400 text-xs">⌄</span>
                  </button>

                  {/* Seletor Roleta Apple: Qualidade do Sono (Emoji + Descrição) */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPickerSonoQualidadeAberto(true);
                    }}
                    className="bg-[#111317] hover:bg-white/[0.04] active:scale-95 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-100 flex items-center justify-between gap-2 transition-all flex-1 truncate"
                  >
                    <span className="truncate">{sonoQualidade}</span>
                    <span className="text-gray-400 text-xs flex-shrink-0">⌄</span>
                  </button>

                  {/* Botão Confirmar Sono */}
                  <button
                    type="button"
                    onClick={handleSalvarSono}
                    className="w-11 h-10 bg-primary/20 hover:bg-primary/30 active:scale-95 border border-primary/40 rounded-xl flex items-center justify-center text-primary font-bold transition-all flex-shrink-0"
                    title="Salvar registro de sono"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between animate-fade-in w-full">
                <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                  <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center text-[10px] text-green-400 flex-shrink-0">
                    ✓
                  </span>
                  <span className="text-xs font-semibold text-gray-200 truncate">
                    Sono: <span className="text-primary">{sonoHoras}</span> · {sonoQualidade}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSonoFeito(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] active:scale-95 rounded-xl transition-all text-xs"
                    title="Editar registro de sono"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={handleExcluirSono}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 active:scale-95 rounded-xl transition-all text-xs"
                    title="Apagar registro de sono"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'woop':
        return (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-2 ml-1">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Minhas Ferramentas
              </h2>
              {woopHoje && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  WOOP de Hoje Ativo
                </span>
              )}
            </div>

            {!woopHoje ? (
              <div
                onClick={() => {
                  triggerHaptic('light');
                  router.push('/woop');
                }}
                className="bg-surface/90 backdrop-blur-xl rounded-[28px] p-5 border border-white/10 cursor-pointer group hover:border-primary/40 active:scale-[0.99] transition-all shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🎯</span>
                    <h3 className="font-bold text-white text-sm">WOOP Diário</h3>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">Pendente hoje</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Defina um único desejo para hoje, antecipe obstáculos e trace um plano rápido.
                </p>
                <div className="w-full bg-white/[0.04] text-primary border border-primary/30 font-semibold py-2.5 rounded-xl text-xs text-center group-hover:bg-primary group-hover:text-[#121418] transition-all">
                  Definir WOOP de Hoje
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  triggerHaptic('light');
                  router.push('/woop');
                }}
                className="bg-surface/90 backdrop-blur-xl rounded-[28px] p-5 border border-primary/30 cursor-pointer group hover:border-primary/60 active:scale-[0.99] transition-all shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="font-bold text-white text-sm">Meu WOOP de Hoje</h3>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => router.push('/woop')}
                      className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 rounded-lg border border-white/10 text-xs transition-colors flex items-center gap-1"
                      title="Editar WOOP"
                    >
                      ✏️ <span className="text-[11px]">Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Deseja excluir o WOOP de hoje?')) {
                          if (woopHoje.id) {
                            await excluirWoop(woopHoje.id);
                            setWoopHoje(null);
                          }
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-white/10 hover:border-red-500/30 text-xs transition-colors"
                      title="Excluir WOOP"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-[#111317]/80 rounded-xl p-2.5 border border-primary/20">
                    <span className="text-primary font-bold uppercase tracking-wider block text-[10px] mb-0.5">
                      Wish (Desejo)
                    </span>
                    <p className="text-gray-100 font-medium leading-snug">{woopHoje.wish}</p>
                  </div>

                  {woopHoje.outcome && (
                    <div className="bg-[#111317]/60 rounded-xl p-2.5 border border-green-500/20">
                      <span className="text-green-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">
                        Outcome (Melhor Resultado)
                      </span>
                      <p className="text-gray-200 leading-snug">{woopHoje.outcome}</p>
                    </div>
                  )}

                  {woopHoje.obstacle && (
                    <div className="bg-[#111317]/60 rounded-xl p-2.5 border border-orange-500/20">
                      <span className="text-orange-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">
                        Obstacle (Obstáculo Interno)
                      </span>
                      <p className="text-gray-200 leading-snug">{woopHoje.obstacle}</p>
                    </div>
                  )}

                  {woopHoje.plan && (
                    <div className="bg-[#111317]/60 rounded-xl p-2.5 border border-blue-500/20">
                      <span className="text-blue-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">
                        Plan (Plano Se... Então...)
                      </span>
                      <p className="text-gray-200 leading-snug">{woopHoje.plan}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Toque no card para ver detalhes ou editar</span>
                  <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                    ↗
                  </span>
                </div>
              </div>
            )}
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <main className="flex-1 flex flex-col p-6 bg-background min-h-screen relative overflow-y-auto pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Header Fixo */}
      <header className="flex justify-between items-center mb-6 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 relative">
          {/* Botão Menu (Hamburger) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMenuAberto(!menuAberto);
            }}
            className="w-10 h-10 bg-surface/90 border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuAberto && (
            <div className="absolute top-12 left-0 w-52 bg-[#1C1F26]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setMenuAberto(false);
                  router.push('/registros');
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/[0.06] transition-colors"
              >
                📋 Meus Registros
              </button>
              <div className="h-px bg-white/10 w-full"></div>
              <button
                type="button"
                onClick={() => {
                  setMenuAberto(false);
                  router.push('/perfil');
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/[0.06] transition-colors"
              >
                👤 Meu Perfil
              </button>
              <div className="h-px bg-white/10 w-full"></div>
              <button
                type="button"
                onClick={() => {
                  setMenuAberto(false);
                  router.push('/ajuda');
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/[0.06] transition-colors"
              >
                ❓ Ajuda
              </button>
              <div className="h-px bg-white/10 w-full"></div>
              <button
                type="button"
                onClick={() => {
                  setMenuAberto(false);
                  router.push('/relatorio');
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/[0.06] transition-colors"
              >
                📄 Gerar Relatório
              </button>
              <div className="h-px bg-white/10 w-full"></div>
              <button
                type="button"
                onClick={async () => {
                  setMenuAberto(false);
                  await logout();
                  router.push('/login');
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                🚪 Sair
              </button>
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Olá, {user?.displayName ? user.displayName.trim().split(' ')[0] : 'Paciente'}
            </h1>
          </div>
        </div>

        {/* Avatar (Mascote) */}
        <div className="w-[68px] h-[68px] flex-shrink-0 relative">
          <img
            src="/mascote/mascote-sem-fundo.png"
            alt="Blu"
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </div>
      </header>

      {/* Renderização Dinâmica dos Widgets Ordenados */}
      <div className="flex flex-col">
        {widgets.map((widget) => (
          <div key={widget.id}>{renderWidget(widget.id)}</div>
        ))}
      </div>

      {/* Modal Imersivo de Voz: "Blu está te escutando... como está se sentindo?" */}
      <VoiceListeningModal
        isOpen={voiceModalOpen}
        isListening={isListening}
        transcriptText={registroTexto}
        onChangeText={(txt) => {
          setRegistroTexto(txt);
          syncManualText(txt);
        }}
        onCancel={handleCancelarModalVoz}
        onKeepInField={handleManterTextoModalVoz}
        onFinishAndSubmit={(finalText) => handleRegistroPrincipal(finalText)}
        submitLabel="Concluir e Enviar Registro"
      />

      {/* Seletor Roleta Apple: Dosagem de Medicação (10mg a 200mg) */}
      <WheelPickerModal
        isOpen={pickerMedicacaoAberto}
        onClose={() => setPickerMedicacaoAberto(false)}
        title="Dosagem da Medicação"
        subtitle="Arraste para selecionar os miligramas"
        options={MEDICACAO_MG_OPTIONS}
        selectedValue={medicacaoMg}
        onConfirm={(val) => setMedicacaoMg(val)}
      />

      {/* Seletor Roleta Apple: Horas de Sono (de 30 em 30 min, padrão 6:00h) */}
      <WheelPickerModal
        isOpen={pickerSonoHorasAberto}
        onClose={() => setPickerSonoHorasAberto(false)}
        title="Tempo de Sono"
        subtitle="Quantas horas você dormiu?"
        options={SONO_HORAS_OPTIONS}
        selectedValue={sonoHoras}
        onConfirm={(val) => setSonoHoras(val)}
      />

      {/* Seletor Roleta Apple: Qualidade do Sono (Emoji + Descrição) */}
      <WheelPickerModal
        isOpen={pickerSonoQualidadeAberto}
        onClose={() => setPickerSonoQualidadeAberto(false)}
        title="Qualidade do Sono"
        subtitle="Como você avalia o seu descanso?"
        options={SONO_QUALIDADE_OPTIONS}
        selectedValue={sonoQualidade}
        onConfirm={(val) => setSonoQualidade(val)}
      />

      {/* Onboarding Tour Interativo com Blu */}
      <OnboardingTour
        isOpen={tourAberta}
        onClose={() => setTourAberta(false)}
      />
    </main>
  );
}
