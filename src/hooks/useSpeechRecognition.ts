'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
}

export function useSpeechRecognition({
  lang = 'pt-BR',
  continuous = true,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const accumulatedFinalRef = useRef<string>('');
  const currentSessionFinalRef = useRef<string>('');
  const currentInterimRef = useRef<string>('');
  const onResultCallbackRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inicializa o reconhecimento se suportado
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Navegador sem suporte a reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognition.stop();
      } catch {}
    };
  }, [lang, continuous]);

  const startListening = useCallback(
    (
      onResultText: (text: string, isFinal: boolean) => void,
      initialBaseText: string = ''
    ) => {
      setError(null);
      const recognition = recognitionRef.current;

      if (!recognition) {
        alert(
          'O seu navegador atual não suporta ditado nativo por voz. Recomendamos o uso do Google Chrome ou Safari.'
        );
        return;
      }

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      shouldListenRef.current = true;
      accumulatedFinalRef.current = initialBaseText.trim();
      currentSessionFinalRef.current = '';
      currentInterimRef.current = '';
      onResultCallbackRef.current = onResultText;
      setIsListening(true);

      recognition.onstart = () => {
        if (shouldListenRef.current) {
          setIsListening(true);
        }
      };

      recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            sessionFinal += transcriptPiece + ' ';
          } else {
            sessionInterim += transcriptPiece;
          }
        }

        currentSessionFinalRef.current = sessionFinal.trim();
        currentInterimRef.current = sessionInterim.trim();

        const fullText = [
          accumulatedFinalRef.current,
          currentSessionFinalRef.current,
          currentInterimRef.current,
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (onResultCallbackRef.current) {
          onResultCallbackRef.current(fullText, Boolean(sessionFinal));
        }
      };

      recognition.onerror = (event: any) => {
        // Erros normais de pausa longa ('no-speech', 'aborted') são ignorados para manter a escuta ativa
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        console.warn('Speech Recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldListenRef.current = false;
          setIsListening(false);
          setError('Permissão de microfone negada no navegador.');
          alert('Por favor, permita o acesso ao microfone no navegador para usar o ditado.');
        }
      };

      recognition.onend = () => {
        // Consolida o que foi finalizado nesta sessão antes de reconectar
        if (currentSessionFinalRef.current || currentInterimRef.current) {
          const pieceToCommit = [
            currentSessionFinalRef.current,
            currentInterimRef.current,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();

          if (pieceToCommit) {
            accumulatedFinalRef.current = [
              accumulatedFinalRef.current,
              pieceToCommit,
            ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
          currentSessionFinalRef.current = '';
          currentInterimRef.current = '';
        }

        // Se o usuário NÃO clicou em parar, reconecta automaticamente!
        if (shouldListenRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (!shouldListenRef.current || !recognitionRef.current) return;
            try {
              recognitionRef.current.start();
            } catch {
              // Se já estiver iniciando, tenta novamente em 250ms
              restartTimerRef.current = setTimeout(() => {
                if (shouldListenRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch {}
                }
              }, 250);
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      try {
        recognition.start();
      } catch (err) {
        // Caso já esteja ativo, reinicia limpo
        try {
          recognition.stop();
        } catch {}
      }
    },
    []
  );

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  // Permite atualizar manualmente o texto base caso o usuário edite o texto dentro do modal
  const syncManualText = useCallback((manualText: string) => {
    accumulatedFinalRef.current = manualText.trim();
    currentSessionFinalRef.current = '';
    currentInterimRef.current = '';
  }, []);

  const toggleListening = useCallback(
    (
      currentValue: string,
      onChangeValue: (newVal: string) => void
    ) => {
      if (isListening) {
        stopListening();
      } else {
        startListening((transcript) => {
          onChangeValue(transcript);
        }, currentValue);
      }
    },
    [isListening, startListening, stopListening]
  );

  return {
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening,
    syncManualText,
  };
}
