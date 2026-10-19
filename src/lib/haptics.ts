'use client';

/**
 * Utilitário de Feedback Háptico (Padrão Apple / Mobile)
 * Emite micro-vibrações táteis discretas em dispositivos compatíveis.
 */
export function triggerHaptic(type: 'tick' | 'light' | 'medium' | 'success' = 'light') {
  if (typeof window === 'undefined') return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'tick':
          navigator.vibrate(6);
          break;
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(22);
          break;
        case 'success':
          navigator.vibrate([15, 50, 25]);
          break;
      }
    }
  } catch {
    // Silencioso caso o navegador bloqueie ou não suporte
  }
}
