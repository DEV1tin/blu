'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextType {
  user: { uid: string; email: string | null; displayName: string | null } | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, pass: string, name: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

function traduzirErroFirebase(code?: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente fazer login.';
    case 'auth/weak-password':
      return 'A senha deve conter no mínimo 6 caracteres.';
    case 'auth/invalid-email':
      return 'Formato de e-mail inválido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a internet. Verifique sua rede.';
    default:
      return `Erro na autenticação (${code || 'desconhecido'}). Tente novamente.`;
  }
}

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
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Paciente',
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
        const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
        const fbUser = credential.user;
        const loggedUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Paciente',
        };
        setUser(loggedUser);
        localStorage.setItem('auth_token', fbUser.uid);
        return { success: true };
      } catch (err: any) {
        return { 
          success: false, 
          message: traduzirErroFirebase(err?.code) 
        };
      }
    } else {
      localStorage.setItem('auth_token', 'usr_victor_simulated');
      setUser({
        uid: 'usr_victor',
        email,
        displayName: 'Vitor H.',
      });
      return { success: true };
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    if (isFirebaseConfigured) {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        const fbUser = credential.user;
        
        // Atualizar o nome do perfil no Firebase Auth
        await updateProfile(fbUser, { displayName: name.trim() });
        
        // Criar registro na coleção 'users' do Firestore
        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            uid: fbUser.uid,
            nome: name.trim(),
            email: fbUser.email,
            role: 'PACIENTE',
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('Erro ao salvar documento do usuário no Firestore:', dbErr);
        }

        const newUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: name.trim(),
        };
        setUser(newUser);
        localStorage.setItem('auth_token', fbUser.uid);
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          message: traduzirErroFirebase(err?.code)
        };
      }
    } else {
      localStorage.setItem('auth_token', 'usr_novo_simulated');
      setUser({
        uid: 'usr_novo',
        email,
        displayName: name,
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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
