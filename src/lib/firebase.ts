import {initializeApp, getApps} from 'firebase/app';
import {Firestore, getFirestore, initializeFirestore} from 'firebase/firestore';
import {firebaseConfig} from '../config/env';

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// React Native's network stack doesn't reliably support Firestore's default
// WebChannel streaming transport (reads silently hang, especially on iOS), so
// force long-polling. Guarded so a hot-reload re-import falls back to the
// existing instance instead of throwing "Firestore already initialized".
let firestore: Firestore;
try {
  firestore = initializeFirestore(app, {experimentalForceLongPolling: true});
} catch {
  firestore = getFirestore(app);
}

export const db = firestore;

// Аутентификации в приложении нет (решение 2026-11: не храним данные
// пользователей). Firestore — только публичное чтение контента и анонимные
// отчёты диагностики; избранное живёт локально (services/favorites.ts).
