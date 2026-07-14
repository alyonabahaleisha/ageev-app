import React, {useState} from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ICON_CHEVRON_RIGHT,
  ICON_EDIT,
  ICON_INSTAGRAM,
  ICON_LOCK,
  ICON_SEARCH,
  ICON_TELEGRAM,
  ICON_USER_30,
  ICON_YOUTUBE,
} from '../assets/icons';
import {AccountSheet, DeleteAccountModal} from '../components/AccountModals';
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
import {PrimaryButton} from '../components/PrimaryButton';
import {
  authErrorMessage,
  deleteAccount,
  signOutUser,
  useAuth,
  userDisplayName,
} from '../context/AuthContext';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const BTN_SIZE = 47;

type Props = {
  onOpenAuth: () => void;
  onOpenFavorites: () => void;
  onOpenSettings: () => void;
  onOpenDonation: () => void;
  onOpenCourses: () => void;
};

/** Профиль (Figma 411:7252) и гостевой режим (411:7181). */
export function ProfileScreen({
  onOpenAuth,
  onOpenFavorites,
  onOpenSettings,
  onOpenDonation,
  onOpenCourses,
}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const {user} = useAuth();
  const t = useUIStrings();
  const [modal, setModal] = useState<'none' | 'account' | 'delete'>('none');
  const [deleting, setDeleting] = useState(false);

  const loggedIn = !!user;

  function openUrl(url: string) {
    if (url) Linking.openURL(url).catch(() => {});
  }

  async function handleSignOut() {
    setModal('none');
    try {
      await signOutUser();
    } catch (e) {
      Alert.alert(t('account_error', 'Ошибка'), authErrorMessage(e));
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      setModal('none');
    } catch (e) {
      setModal('none');
      Alert.alert(t('account_error', 'Ошибка'), authErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  // Строки списка. Разделы без своих экранов пока никуда не ведут; в гостевом
  // режиме «закрытые» разделы открывают авторизацию.
  const rows: {key: string; label: string; locked?: boolean; onPress?: () => void}[] = [
    {
      key: 'favorites',
      label: t('profile_tab_favorites', 'Избранное'),
      locked: !loggedIn,
      onPress: loggedIn ? onOpenFavorites : onOpenAuth,
    },
    {
      key: 'events',
      label: t('profile_tab_events', 'Курсы и события'),
      onPress: onOpenCourses,
    },
    {
      key: 'donation',
      label: t('profile_tab_donation', 'Донейшн'),
      onPress: onOpenDonation,
    },
    {
      key: 'settings',
      label: t('profile_tab_settings', 'Настройки'),
      onPress: onOpenSettings,
    },
  ];

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {paddingTop: headerScrollPadding(top), paddingBottom: bottom + 110},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Аватар + приветствие */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <SvgXml xml={ICON_USER_30} width={30} height={30} />
          </View>
          <View style={styles.profileText}>
            {loggedIn ? (
              <>
                <Text style={styles.welcomeLine}>
                  {t('profile_welcome', 'Добро пожаловать,')}
                </Text>
                <Text style={styles.nameLine}>{userDisplayName(user)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.nameLine}>
                  {t('profile_guest_title', 'Вы не вошли в аккаунт')}
                </Text>
                <Text style={styles.guestSubtitle}>
                  {t('profile_guest_subtitle', 'Сохраните практики и прогресс')}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Гость: кнопка входа */}
        {!loggedIn && (
          <PrimaryButton
            title={t('profile_signin_button', 'Войти / создать аккаунт')}
            onPress={onOpenAuth}
            style={styles.signInButton}
          />
        )}

        {/* Разделы */}
        <View style={styles.tabs}>
          {rows.map(row => (
            <TouchableOpacity
              key={row.key}
              activeOpacity={row.onPress ? 0.8 : 1}
              onPress={row.onPress}
              style={styles.tabRow}>
              <View style={styles.tabLeft}>
                {row.locked && (
                  <SvgXml xml={ICON_LOCK} width={20} height={20} />
                )}
                <Text style={styles.tabLabel}>{row.label}</Text>
              </View>
              <SvgXml xml={ICON_CHEVRON_RIGHT} width={24} height={24} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Мы на связи + поддержка */}
        <View style={styles.bottomBlock}>
          <View style={styles.social}>
            <Text style={styles.socialTitle}>
              {t('profile_social_title', 'Мы на связи')}
            </Text>
            <View style={styles.socialRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openUrl(t('social_instagram_url', ''))}
                style={styles.socialBtn}>
                <SvgXml xml={ICON_INSTAGRAM} width={20} height={20} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openUrl(t('social_youtube_url', ''))}
                style={styles.socialBtn}>
                <SvgXml xml={ICON_YOUTUBE} width={25} height={16} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openUrl(t('social_telegram_url', ''))}
                style={styles.socialBtn}>
                <SvgXml xml={ICON_TELEGRAM} width={22} height={22} />
              </TouchableOpacity>
            </View>
          </View>
          {loggedIn && (
            <PrimaryButton
              title={t('profile_support_button', 'Связаться с поддержкой')}
              onPress={() => openUrl(t('profile_support_url', ''))}
            />
          )}
        </View>
      </ScrollView>

      {/* Шапка: Профиль + поиск/редактирование */}
      <FixedHeader>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile_title', 'Профиль')}</Text>
          <View style={styles.headerButtons}>
            <View style={styles.headerBtn}>
              <SvgXml xml={ICON_SEARCH} width={24} height={24} />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={loggedIn ? () => setModal('account') : onOpenAuth}
              style={styles.headerBtn}>
              <SvgXml xml={ICON_EDIT} width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
      </FixedHeader>

      {modal === 'account' && user && (
        <AccountSheet
          email={user.email ?? ''}
          onSignOut={handleSignOut}
          onDelete={() => setModal('delete')}
          onClose={() => setModal('none')}
        />
      )}
      {modal === 'delete' && (
        <DeleteAccountModal
          onCancel={() => setModal('none')}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {
    flexGrow: 1,
    paddingHorizontal: SECTION_MARGIN,
  },

  // ── Шапка ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SECTION_MARGIN,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.white,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Аватар и приветствие ───────────────────────────────────────────────────
  profileRow: {
    marginTop: 18, // y119 = низ шапки (101) + 18
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.brand.lighter,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    // shadow/card
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 10,
  },
  profileText: {
    flex: 1,
    gap: 5,
  },
  welcomeLine: {
    ...typography.body,
    color: colors.white,
  },
  nameLine: {
    ...typography.bodyLarge,
    color: colors.white,
  },
  guestSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
  },

  signInButton: {
    marginTop: 18,
  },

  // ── Разделы ────────────────────────────────────────────────────────────────
  tabs: {
    marginTop: 18,
    gap: 8,
  },
  tabRow: {
    height: 56,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 10,
    gap: 12,
    // shadow/soft
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  tabLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabLabel: {
    ...typography.bodyMedium,
    color: colors.white,
  },

  // ── Мы на связи / поддержка ────────────────────────────────────────────────
  bottomBlock: {
    marginTop: 18,
    gap: 24,
  },
  social: {
    gap: 10,
  },
  socialTitle: {
    ...typography.h2,
    color: colors.white,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 8,
  },
  socialBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
