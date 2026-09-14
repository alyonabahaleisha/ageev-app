import Config from 'react-native-config';

export type AppEnv = 'prod' | 'qa';

// Прод-значения зашиты как фолбэк: если сборка собрана без ENVFILE (старый
// скрипт, Xcode без пре-экшена), приложение должно вести себя как прод,
// а не падать с пустым конфигом Firebase.
const PROD_FIREBASE = {
  apiKey: 'AIzaSyCNUmsy_RQklwyvD2MK8GZZpFxPYY8YYI0',
  authDomain: 'mikhail-app.firebaseapp.com',
  projectId: 'mikhail-app',
  storageBucket: 'mikhail-app.firebasestorage.app',
  messagingSenderId: '188401884866',
  appId: '1:188401884866:web:f5a5a72d3fc65f785ca55b',
};

export const APP_ENV: AppEnv = Config.APP_ENV === 'qa' ? 'qa' : 'prod';

export const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY || PROD_FIREBASE.apiKey,
  authDomain: Config.FIREBASE_AUTH_DOMAIN || PROD_FIREBASE.authDomain,
  projectId: Config.FIREBASE_PROJECT_ID || PROD_FIREBASE.projectId,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET || PROD_FIREBASE.storageBucket,
  messagingSenderId:
    Config.FIREBASE_MESSAGING_SENDER_ID || PROD_FIREBASE.messagingSenderId,
  appId: Config.FIREBASE_APP_ID || PROD_FIREBASE.appId,
};

// Пусто, пока региональные зеркала не подняты (этапы 1/3 инфра-плана).
export const MEDIA_BASE_URL = Config.MEDIA_BASE_URL || '';
export const API_BASE_URL = Config.API_BASE_URL || '';
