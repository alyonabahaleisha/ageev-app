import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {ICON_CLOSE_30} from '../assets/icons';
import {PrimaryButton} from './PrimaryButton';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const {height: SCREEN_H} = Dimensions.get('window');
// Карточка в макете стоит на y:266 из 844 (411:7142)
const CARD_TOP = SCREEN_H * (266 / 844);

function ModalCard({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.overlay}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.dim} />
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <SvgXml xml={ICON_CLOSE_30} width={30} height={30} />
        </TouchableOpacity>
        <View style={styles.cardBody}>{children}</View>
      </View>
    </View>
  );
}

type DeleteProps = {
  onCancel: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

/** Подтверждение удаления аккаунта (Figma 411:7142). */
export function DeleteAccountModal({onCancel, onDelete, deleting}: DeleteProps) {
  const t = useUIStrings();
  return (
    <ModalCard onClose={onCancel}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>
          {t('account_delete_title', 'Вы уверены, что хотите удалить аккаунт?')}
        </Text>
        <Text style={styles.subtitle}>
          {t('account_delete_subtitle', 'Ваши данные будут безвозвратно удалены.')}
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title={t('account_delete_cancel', 'Отмена')}
          onPress={onCancel}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onDelete}
          disabled={deleting}
          style={styles.linkHit}>
          <Text style={styles.link}>
            {deleting
              ? t('account_deleting', 'Удаляем…')
              : t('account_delete_confirm', 'Удалить аккаунт')}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalCard>
  );
}

type AccountProps = {
  email: string;
  onSignOut: () => void;
  onDelete: () => void;
  onClose: () => void;
};

/** Лист «Аккаунт»: выйти или удалить (открывается из «Настройки»). */
export function AccountSheet({email, onSignOut, onDelete, onClose}: AccountProps) {
  const t = useUIStrings();
  return (
    <ModalCard onClose={onClose}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t('account_title', 'Аккаунт')}</Text>
        <Text style={styles.subtitle}>{email}</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title={t('account_signout', 'Выйти из аккаунта')}
          onPress={onSignOut}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onDelete}
          style={styles.linkHit}>
          <Text style={styles.link}>
            {t('account_delete_confirm', 'Удалить аккаунт')}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalCard>
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
  card: {
    position: 'absolute',
    top: CARD_TOP,
    left: 24,
    right: 24,
    backgroundColor: colors.brand.primary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: 'flex-end',
    gap: 12,
    // shadow/bottom sheet
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -12},
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  cardBody: {
    alignSelf: 'stretch',
    gap: 24,
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
    maxWidth: 238,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
  },
  linkHit: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  link: {
    ...typography.body,
    color: colors.brand.pale,
  },
});
