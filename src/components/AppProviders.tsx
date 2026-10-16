'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { PwaInstallPrompt } from './PwaInstallPrompt';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <PwaInstallPrompt />
    </AuthProvider>
  );
}
