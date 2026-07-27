import {Platform} from 'react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  UserCredential,
} from 'firebase/auth';
import {auth} from '../lib/firebase';

// Вход через Google и Apple → Firebase Auth (signInWithCredential).
// OAuth-клиенты проекта mikhail-app создаются Firebase автоматически при
// включении Google-провайдера (Authentication → Sign-in method).
const WEB_CLIENT_ID =
  '188401884866-0sal29m5ag8vd7h4d654r69u9ivg45dd.apps.googleusercontent.com';
const IOS_CLIENT_ID =
  '188401884866-jj14sur0ob037i8bpkp8cf2e1okqo17t.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
});

/**
 * Вход через Google. Возвращает null, если пользователь закрыл окно выбора
 * аккаунта (это не ошибка).
 */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  }
  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') {
    return null;
  }
  const idToken = result.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in returned no idToken');
  }
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

/** Вход через Apple доступен только на iOS 13+. */
export const appleSignInSupported = Platform.OS === 'ios' && appleAuth.isSupported;

/**
 * Вход через Apple. Возвращает null при отмене пользователем.
 * Библиотека сама генерирует nonce (SHA-256 уходит Apple, сырой — Firebase).
 */
export async function signInWithApple(): Promise<UserCredential | null> {
  try {
    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });
    if (!response.identityToken) {
      throw new Error('Apple sign-in returned no identityToken');
    }
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: response.identityToken,
      rawNonce: response.nonce,
    });
    return await signInWithCredential(auth, credential);
  } catch (e) {
    // 1001 = ASAuthorizationError.canceled
    if ((e as {code?: string})?.code === appleAuth.Error.CANCELED) {
      return null;
    }
    throw e;
  }
}
