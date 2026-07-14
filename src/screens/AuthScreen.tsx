import React, {useState} from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ICON_AUTH_APPLE,
  ICON_AUTH_GOOGLE,
  ICON_AUTH_VK,
  ICON_CLOSE_30,
} from '../assets/icons';
import {PrimaryButton} from '../components/PrimaryButton';
import {authErrorMessage, resetPassword, signIn, signUp} from '../context/AuthContext';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const SHEET_RADIUS = 30;

type View_ = 'signin' | 'signup' | 'reset';

type Props = {onClose: () => void};

/**
 * Авторизация (Figma 411:6496) и восстановление пароля (411:6483).
 * Полноэкранный оверлей: затемнение + нижний лист от статус-бара до низа.
 */
export function AuthScreen({onClose}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const t = useUIStrings();

  const [view, setView] = useState<View_>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isSignup = view === 'signup';

  function switchView(next: View_) {
    setView(next);
    setError('');
    setResetSent(false);
  }

  async function handleContinue() {
    if (loading) return;
    Keyboard.dismiss();
    if (!email.trim()) {
      setError(t('auth_error_no_email', 'Введите email'));
      return;
    }
    if (view !== 'reset' && !password) {
      setError(t('auth_error_no_password', 'Введите пароль'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (view === 'signin') {
        await signIn(email, password);
        onClose();
      } else if (view === 'signup') {
        await signUp(email, password);
        onClose();
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function handleSocial(name: string) {
    Alert.alert(
      t('auth_social_soon_title', 'Скоро'),
      t('auth_social_soon_text', `Вход через ${name} появится в ближайшем обновлении`),
    );
  }

  function openLink(url: string) {
    if (url) Linking.openURL(url).catch(() => {});
  }

  // ── Восстановление пароля: два «стопкой» лежащих листа (411:6483) ─────────
  if (view === 'reset') {
    return (
      <View style={styles.overlay}>
        <View style={styles.dim} />
        {/* Задний лист выглядывает сверху на 10px */}
        <View style={[styles.backSheet, {top}]} />
        <View style={[styles.sheet, styles.resetSheet, {top: top + 10}]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => switchView('signin')}
            style={styles.closeBtn}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <SvgXml xml={ICON_CLOSE_30} width={30} height={30} />
          </TouchableOpacity>

          <View style={styles.resetContent}>
            <Text style={styles.resetTitle}>
              {t('auth_reset_title', 'Восстановить пароль')}
            </Text>
            {resetSent ? (
              <>
                <Text style={styles.resetSentText}>
                  {t(
                    'auth_reset_sent',
                    'Мы отправили письмо со ссылкой для восстановления пароля на',
                  )}{' '}
                  {email.trim()}
                </Text>
                <PrimaryButton
                  title={t('auth_reset_done', 'Готово')}
                  onPress={() => switchView('signin')}
                  style={styles.resetButton}
                />
              </>
            ) : (
              <>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth_email_placeholder', 'Email')}
                  placeholderTextColor="rgba(255,255,255,0.65)"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!!error && <Text style={styles.error}>{error}</Text>}
                <PrimaryButton
                  title={t('auth_continue', 'Продолжить')}
                  onPress={handleContinue}
                  loading={loading}
                  style={styles.resetButton}
                />
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Вход / регистрация (411:6496) ──────────────────────────────────────────
  return (
    <View style={styles.overlay}>
      <View style={styles.dim} />
      <View style={[styles.sheet, {top}]}>
        <ScrollView
          contentContainerStyle={[styles.sheetContent, {paddingBottom: bottom + 48}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <SvgXml xml={ICON_CLOSE_30} width={30} height={30} />
          </TouchableOpacity>

          <View style={styles.form}>
            {/* Заголовок + переключение входа/регистрации */}
            <View style={styles.titleBlock}>
              <Text style={styles.title}>
                {isSignup
                  ? t('auth_signup_title', 'Регистрация')
                  : t('auth_signin_title', 'Войти')}
              </Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {isSignup
                    ? t('auth_have_account', 'Уже есть аккаунт? ')
                    : t('auth_no_account', 'Нет аккаунта? ')}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => switchView(isSignup ? 'signin' : 'signup')}
                  style={styles.linkHit}>
                  <Text style={styles.link}>
                    {isSignup
                      ? t('auth_signin_link', 'Войти')
                      : t('auth_signup_link', 'Зарегистрироваться')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Поля */}
            <View style={styles.inputBlock}>
              <View style={styles.inputs}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth_email_placeholder', 'Email')}
                  placeholderTextColor="rgba(255,255,255,0.65)"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth_password_placeholder', 'Пароль')}
                  placeholderTextColor="rgba(255,255,255,0.65)"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              {!isSignup && (
                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>
                    {t('auth_forgot', 'Забыли пароль? ')}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => switchView('reset')}
                    style={styles.linkHit}>
                    <Text style={styles.link}>
                      {t('auth_forgot_link', 'Восстановить')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <PrimaryButton
              title={t('auth_continue', 'Продолжить')}
              onPress={handleContinue}
              loading={loading}
            />

            {/* Соцсети */}
            <View style={styles.social}>
              <Text style={styles.socialLabel}>{t('auth_or', 'Или')}</Text>
              <View style={styles.socialRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSocial('Apple')}
                  style={styles.socialBtn}>
                  <SvgXml xml={ICON_AUTH_APPLE} width={52} height={52} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSocial('Google')}
                  style={styles.socialBtn}>
                  <SvgXml xml={ICON_AUTH_GOOGLE} width={52} height={52} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSocial('VK')}
                  style={styles.socialBtn}>
                  <SvgXml xml={ICON_AUTH_VK} width={52} height={52} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Пропустить + соглашения — прижаты к низу листа */}
          <View style={styles.bottomBlock}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.skipHit}>
              <Text style={styles.skip}>{t('auth_skip', 'Пропустить')}</Text>
            </TouchableOpacity>
            <View style={styles.terms}>
              <Text style={styles.termsText}>
                {t('auth_terms_prefix', 'Продолжая, вы соглашаетесь с')}{' '}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openLink(t('auth_terms_url', ''))}>
                <Text style={styles.termsLink}>
                  {t('auth_terms_link', 'Условиями использования')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> {t('auth_terms_and', 'и')} </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openLink(t('auth_privacy_url', ''))}>
                <Text style={styles.termsLink}>
                  {t('auth_privacy_link', 'Политикой конфиденциальности')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.brand.primary,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
    // shadow/bottom sheet: 0px -12px 32px rgba(0,0,0,0.2)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -12},
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  backSheet: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    backgroundColor: colors.brand.primary,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sheetContent: {
    flexGrow: 1,
    paddingHorizontal: SECTION_MARGIN,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    marginTop: 24,
    width: 30,
    height: 30,
  },
  form: {
    marginTop: 24, // close(24+30) + 24 = 78 от верха листа, как y125 в макете
    gap: 30,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchText: {
    ...typography.body,
    color: colors.white,
  },
  linkHit: {
    paddingVertical: 4,
  },
  link: {
    ...typography.body,
    color: colors.brand.pale,
  },
  inputBlock: {
    gap: 16,
  },
  inputs: {
    gap: 8,
  },
  input: {
    height: 52,
    paddingVertical: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.white,
    ...typography.body,
    color: colors.white,
  },
  error: {
    ...typography.small,
    color: '#FFB4A9',
  },
  social: {
    alignItems: 'center',
    gap: 16,
  },
  socialLabel: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 10,
    // shadow/primary button на белых плитках соцвхода
    shadowColor: colors.brand.lighter,
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 8,
    backgroundColor: colors.white,
  },
  bottomBlock: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 40,
  },
  skipHit: {
    padding: 4,
  },
  skip: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
  terms: {
    marginTop: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 0,
    columnGap: 4,
  },
  termsText: {
    ...typography.small,
    color: colors.white,
  },
  termsLink: {
    ...typography.small,
    color: colors.brand.pale,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.pale,
  },
  resetSheet: {
    paddingHorizontal: SECTION_MARGIN,
  },
  resetContent: {
    marginTop: 24, // 78 от верха переднего листа (y135 в макете)
    gap: 18,
  },
  resetTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  resetSentText: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 12, // input→button gap 30 (18 от колонки + 12)
  },
});
