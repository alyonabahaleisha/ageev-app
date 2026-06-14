import {initializeApp, getApps} from 'firebase/app';
import {Firestore, getFirestore, initializeFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCNUmsy_RQklwyvD2MK8GZZpFxPYY8YYI0',
  authDomain: 'mikhail-app.firebaseapp.com',
  projectId: 'mikhail-app',
  storageBucket: 'mikhail-app.firebasestorage.app',
  messagingSenderId: '188401884866',
  appId: '1:188401884866:web:f5a5a72d3fc65f785ca55b',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

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
