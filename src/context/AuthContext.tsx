'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { atualizarPerfilUsuario } from '../lib/dbService';

interface AuthContextType {
  user: { uid: string; email: string | null; displayName: string | null } | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, pass: string, name: string) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (dados: {
    nome?: string;
    email?: string;
    senha?: string;
    medicoResponsavel?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  updateUserProfile: async () => ({ success: false }),
  logout: async () => {},
});

function traduzirErroFirebase(code?: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado em outra conta.';
    case 'auth/weak-password':
      return 'A nova senha deve conter no mínimo 6 caracteres.';
    case 'auth/invalid-email':
      return 'Formato de e-mail inválido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a internet. Verifique sua rede.';
    case 'auth/requires-recent-login':
      return 'Por segurança, para alterar e-mail ou senha você precisa ter feito login recentemente. Faça logout e login novamente para continuar.';
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
            medicoResponsavel: '',
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

  const updateUserProfile = async (dados: {
    nome?: string;
    email?: string;
    senha?: string;
    medicoResponsavel?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (isFirebaseConfigured && auth.currentUser) {
      const fbUser = auth.currentUser;
      try {
        // 1. Atualizar Nome
        if (dados.nome && dados.nome.trim() !== fbUser.displayName) {
          await updateProfile(fbUser, { displayName: dados.nome.trim() });
        }

        // 2. Atualizar E-mail
        if (dados.email && dados.email.trim() !== fbUser.email) {
          await updateEmail(fbUser, dados.email.trim());
        }

        // 3. Atualizar Senha
        if (dados.senha && dados.senha.trim().length >= 6) {
          await updatePassword(fbUser, dados.senha.trim());
        }

        // 4. Atualizar Firestore
        await atualizarPerfilUsuario(fbUser.uid, {
          nome: dados.nome?.trim(),
          email: dados.email?.trim() || fbUser.email || '',
          medicoResponsavel: dados.medicoResponsavel?.trim(),
        });

        // 5. Atualizar estado local do React
        setUser({
          uid: fbUser.uid,
          email: dados.email?.trim() || fbUser.email,
          displayName: dados.nome?.trim() || fbUser.displayName || 'Paciente',
        });

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          message: traduzirErroFirebase(err?.code),
        };
      }
    } else if (user) {
      // Modo offline fallback
      setUser({
        uid: user.uid,
        email: dados.email || user.email,
        displayName: dados.nome || user.displayName,
      });
      await atualizarPerfilUsuario(user.uid, {
        nome: dados.nome,
        email: dados.email,
        medicoResponsavel: dados.medicoResponsavel,
      });
      return { success: true };
    }
    return { success: false, message: 'Usuário não autenticado.' };
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await fbSignOut(auth);
    }
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
