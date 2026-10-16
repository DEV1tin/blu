'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextType {
  user: { uid: string; email: string | null; displayName: string | null } | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || 'Paciente',
          });
          localStorage.setItem('auth_token', fbUser.uid);
        } else {
          setUser(null);
          localStorage.removeItem('auth_token');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Modo Mock/Offline enquanto não há chaves no .env.local
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        setUser({
          uid: 'usr_victor',
          email: 'victor@exemplo.com',
          displayName: 'Vitor H.',
        });
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    if (isFirebaseConfigured) {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, pass);
        setUser({
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName || 'Paciente',
        });
        localStorage.setItem('auth_token', credential.user.uid);
        return { success: true };
      } catch (err: any) {
        return { 
          success: false, 
          message: err.message || 'Erro ao realizar login no Firebase' 
        };
      }
    } else {
      // Fallback para desenvolvimento inicial
      localStorage.setItem('auth_token', 'usr_victor_simulated');
      setUser({
        uid: 'usr_victor',
        email,
        displayName: 'Vitor H.',
      });
      return { success: true };
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await fbSignOut(auth);
    }
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
