import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {auth} from '../lib/firebase';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  initializing: true,
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setInitializing(false);
    });
  }, []);

  const value = useMemo(() => ({user, initializing}), [user, initializing]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Имя для приветствия: displayName, иначе часть email до @. */
export function userDisplayName(user: User): string {
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  return user.email ? user.email.split('@')[0] : '';
}

// Русские сообщения для кодов ошибок Firebase Auth.
const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Некорректный email',
  'auth/missing-password': 'Введите пароль',
  'auth/user-not-found': 'Неверный email или пароль',
  'auth/wrong-password': 'Неверный email или пароль',
  'auth/invalid-credential': 'Неверный email или пароль',
  'auth/email-already-in-use': 'Аккаунт с таким email уже существует',
  'auth/weak-password': 'Пароль должен быть не короче 6 символов',
  'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
  'auth/network-request-failed': 'Нет соединения с интернетом',
  'auth/user-disabled': 'Аккаунт заблокирован',
  'auth/requires-recent-login':
    'Для этого действия нужно войти заново',
};

export function authErrorMessage(err: unknown): string {
  const code = (err as {code?: string})?.code ?? '';
  return ERROR_MESSAGES[code] ?? 'Что-то пошло не так. Попробуйте ещё раз';
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function signOutUser() {
  return signOut(auth);
}

export function deleteAccount() {
  const user = auth.currentUser;
  if (!user) {
    return Promise.resolve();
  }
  return deleteUser(user);
}
