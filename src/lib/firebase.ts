import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Corrige automaticamente caso a variável de ambiente tenha sido colada com '01y' (zero) em vez de 'O1y' (letra O)
const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCBSv9RqMpW-O1yDuldFVzLZcLPcoopARA';
const sanitizedApiKey = rawApiKey.replace('-01yDuld', '-O1yDuld');

const firebaseConfig = {
  apiKey: sanitizedApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'blu-app-psiq.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'blu-app-psiq',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'blu-app-psiq.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '734277458116',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:734277458116:web:d91ede3fc73ca5dcda1191',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
