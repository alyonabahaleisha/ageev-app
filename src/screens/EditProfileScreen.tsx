import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_CLOSE_PLAYER, ICON_USER_30} from '../assets/icons';
import {DeleteAccountModal} from '../components/AccountModals';
import {GradientBackground} from '../components/GradientBackground';
import {PrimaryButton} from '../components/PrimaryButton';
import {RemoteImage} from '../components/RemoteImage';
import {
  authErrorMessage,
  deleteAccount,
  resetPassword,
  updateAccountProfile,
  useAuth,
} from '../context/AuthContext';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;

// «Изменить профиль» (Figma 507:10649): открывается по кнопке-карандашу в
// Профиле. Имя и почта, «Изменить пароль» шлёт письмо для сброса,
// «Удалить аккаунт» — подтверждение как в макете.

type Props = {onClose: () => void};

export function EditProfileScreen({onClose}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const {user} = useAuth();
  const t = useUIStrings();

  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      await updateAccountProfile(name, email);
      onClose();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function handleChangePassword() {
    const to = user?.email ?? '';
    if (!to) return;
    resetPassword(to)
      .then(() => setResetSent(true))
      .catch(e => setError(authErrorMessage(e)));
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      setShowDelete(false);
      onClose();
    } catch (e) {
      setShowDelete(false);
      Alert.alert(t('account_error', 'Ошибка'), authErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.root}>
      <GradientBackground>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {paddingTop: top + 7, paddingBottom: bottom + 40},
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Крестик + заголовок */}
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={styles.closeBtn}>
                <SvgXml xml={ICON_CLOSE_PLAYER} width={30} height={30} />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>
              {t('edit_profile_title', 'Изменить профиль')}
            </Text>

            {/* Аватар (фото приходит от Google/Apple) */}
            <View style={styles.avatar}>
              {user?.photoURL ? (
                <RemoteImage
                  source={{uri: user.photoURL}}
                  style={styles.avatarPhoto}
                  resizeMode="cover"
                />
              ) : (
                <SvgXml xml={ICON_USER_30} width={44} height={44} />
              )}
            </View>

            {/* Поля */}
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t('edit_profile_name', 'Имя')}
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('edit_profile_name_placeholder', 'Имя')}
                  placeholderTextColor="rgba(255,255,255,0.65)"
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t('edit_profile_email', 'Электронная почта')}
                </Text>
                <TextInput
                  value={email}
                  onChangeText={v => setEmail(v.replace(/\s+/g, ''))}
                  placeholder="email"
                  placeholderTextColor="rgba(255,255,255,0.65)"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleChangePassword}
                style={styles.linkHit}>
                <Text style={styles.link}>
                  {resetSent
                    ? t(
                        'edit_profile_password_sent',
                        'Письмо для смены пароля отправлено',
                      )
                    : t('edit_profile_password', 'Изменить пароль')}
                </Text>
              </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton
              title={
                saving
                  ? t('edit_profile_saving', 'Сохраняем…')
                  : t('edit_profile_save', 'Сохранить')
              }
              onPress={handleSave}
              style={styles.saveBtn}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDelete(true)}
              style={[styles.linkHit, styles.deleteHit]}>
              <Text style={[styles.link, styles.linkDanger]}>
                {t('account_delete_confirm', 'Удалить аккаунт')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {showDelete && (
          <DeleteAccountModal
            onCancel={() => setShowDelete(false)}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // Поверх fixed-заголовка Профиля (zIndex 10) — как лист авторизации.
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SECTION_MARGIN,
  },
  header: {
    flexDirection: 'row',
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginTop: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  fields: {
    marginTop: 32,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    ...typography.small,
    color: colors.white,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...typography.body,
    color: colors.white,
  },
  linkHit: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  link: {
    ...typography.body,
    color: colors.brand.pale,
  },
  linkDanger: {
    color: '#FFB4A9',
  },
  error: {
    ...typography.small,
    color: '#FFB4A9',
    marginTop: 12,
  },
  saveBtn: {
    marginTop: 28,
  },
  deleteHit: {
    alignSelf: 'center',
    marginTop: 20,
  },
});
