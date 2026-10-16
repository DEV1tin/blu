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
      try {
        recognition.stop();
      } catch {}
    };
  }, [lang, continuous]);

  const startListening = useCallback(
    (onResultText: (text: string, isFinal: boolean) => void) => {
      setError(null);
      const recognition = recognitionRef.current;

      if (!recognition) {
        alert(
          'O seu navegador atual não suporta ditado nativo por voz. Recomendamos o uso do Google Chrome ou Safari.'
        );
        return;
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          onResultText(currentText, Boolean(finalTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Permissão de microfone negada no navegador.');
          alert('Por favor, permita o acesso ao microfone no navegador para usar o ditado.');
        } else if (event.error !== 'no-speech') {
          setError(`Erro no reconhecimento: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (err) {
        console.warn('Erro ao iniciar reconhecimento:', err);
        setIsListening(false);
      }
    },
    []
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(
    (
      currentValue: string,
      onChangeValue: (newVal: string) => void
    ) => {
      if (isListening) {
        stopListening();
      } else {
        const baseText = currentValue.trim();
        startListening((transcript) => {
          // Concatena o texto já digitado com a fala
          const novoTexto = baseText
            ? `${baseText} ${transcript.trim()}`
            : transcript.trim();
          onChangeValue(novoTexto);
        });
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
  };
}
