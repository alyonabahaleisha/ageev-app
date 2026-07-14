import React, {useRef, useState} from 'react';
import {
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import Share, {Social} from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {ICON_CLOSE_PLAYER} from '../assets/icons';
import {
  SHARE_ICON_COPY,
  SHARE_ICON_INSTAGRAM,
  SHARE_ICON_MORE,
  SHARE_ICON_SAVE,
  SHARE_ICON_TELEGRAM,
  SHARE_ICON_VK,
  SHARE_ICON_WHATSAPP,
} from '../assets/icons/share';
import LinearGradient from './LinearGradient';
import {RemoteImage} from './RemoteImage';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {fonts, typography} from '../theme/typography';

// Экран «Поделиться» для аффирмаций (Figma 448:10293): сторис-карточка
// 210×450 с текстом и логотипом (вариант 448:10359), соцсети и действия.
// Карточка снимается через ViewShot и уходит в шаринг картинкой.

export type ShareAffirmationItem = {
  text: string;
  /** Фон карточки; без него — стандартный фон аффирмаций. */
  backgroundUrl?: string;
};

type Props = {
  item: ShareAffirmationItem | null;
  onClose: () => void;
};

const CARD_W = 210;
const CARD_H = 450;

export function ShareAffirmationModal({item, onClose}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const t = useUIStrings();
  const shotRef = useRef<React.ElementRef<typeof ViewShot>>(null);
  // Короткая подпись-обратная связь («Сохранено» / «Скопировано»).
  const [feedback, setFeedback] = useState('');
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!item) return null;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(''), 2500);
  };

  const capture = async (): Promise<string | null> => {
    try {
      const uri = await shotRef.current?.capture?.();
      return uri ?? null;
    } catch {
      return null;
    }
  };

  // Конкретная соцсеть; если её нет на устройстве или шаринг в неё падает —
  // открываем системный лист, там пользователь выберет её сам. Ссылка на
  // приложение уходит текстом там, где это поддерживается (Telegram,
  // WhatsApp, системный лист); Instagram игнорирует текст — там ссылка
  // отрисована на самой картинке.
  const shareTo = async (social?: (typeof Social)[keyof typeof Social]) => {
    const url = await capture();
    if (!url) return;
    const message = t('share_app_url', 'https://mikhail-ageev.ru');
    try {
      if (social) {
        await Share.shareSingle({
          social,
          url,
          message,
          type: 'image/png',
        } as any);
      } else {
        await Share.open({url, message, type: 'image/png', failOnCancel: false});
      }
    } catch {
      Share.open({url, message, type: 'image/png', failOnCancel: false}).catch(
        () => {},
      );
    }
  };

  // Instagram убрал выбор ассета через instagram://library (открывает Reels
  // на последнем видео). Единственный поддерживаемый путь — «Поделиться в
  // сторис» через пастборд: композер сторис открывается сразу с нашей
  // карточкой как фоном.
  const shareToInstagram = async () => {
    const url = await capture();
    if (!url) return;
    try {
      if (!(await Linking.canOpenURL('instagram-stories://share'))) {
        throw new Error('instagram unavailable');
      }
      await Share.shareSingle({
        social: Social.InstagramStories,
        appId: t('share_instagram_app_id', '0'),
        backgroundImage: url,
      } as any);
    } catch {
      // Instagram не установлен или отказал — системный лист.
      shareTo();
    }
  };

  const saveImage = async () => {
    const url = await capture();
    if (!url) return;
    try {
      await CameraRoll.saveAsset(url, {type: 'photo'});
      showFeedback(t('share_saved', 'Сохранено в галерею'));
    } catch {
      showFeedback(t('share_save_error', 'Не удалось сохранить'));
    }
  };

  const copyText = () => {
    Clipboard.setString(item.text);
    showFeedback(t('share_copied', 'Текст скопирован'));
  };

  const socials = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon: SHARE_ICON_INSTAGRAM,
      onPress: shareToInstagram,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: SHARE_ICON_TELEGRAM,
      onPress: () => shareTo(Social.Telegram),
    },
    // У VK нет прямого канала в react-native-share — системный лист.
    {key: 'vk', label: 'VK', icon: SHARE_ICON_VK, onPress: () => shareTo()},
    {
      key: 'whatsapp',
      label: 'Whatsapp',
      icon: SHARE_ICON_WHATSAPP,
      onPress: () => shareTo(Social.Whatsapp),
    },
  ];

  const actions = [
    {
      key: 'save',
      label: t('share_action_save', 'Сохранить изображение'),
      icon: SHARE_ICON_SAVE,
      onPress: saveImage,
    },
    {
      key: 'copy',
      label: t('share_action_copy', 'Скопировать текст'),
      icon: SHARE_ICON_COPY,
      onPress: copyText,
    },
    {
      key: 'more',
      label: t('share_action_more', 'Ещё'),
      icon: SHARE_ICON_MORE,
      onPress: () => shareTo(),
    },
  ];

  return (
    <Modal
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <LinearGradient
        colors={['#22618D', '#347FB3', '#165079', '#165079']}
        locations={[0, 0.34, 0.68, 1]}
        start={{x: 0.3, y: 0}}
        end={{x: 0.7, y: 1}}
        style={styles.root}>
        {/* Шапка: крестик + заголовок */}
        <View style={[styles.header, {paddingTop: top + 7}]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.closeBtn}>
            <SvgXml xml={ICON_CLOSE_PLAYER} width={30} height={30} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('share_title', 'Поделиться')}</Text>
          <View style={styles.closeBtn} />
        </View>

        {/* Предпросмотр — он же снимается в картинку (вариант с лого). */}
        <View style={styles.previewWrap}>
          <ViewShot
            ref={shotRef}
            options={{format: 'png', quality: 1}}
            style={styles.card}>
            {item.backgroundUrl ? (
              <RemoteImage
                source={{uri: item.backgroundUrl}}
                style={styles.cardBg}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../assets/images/affirmation-bg.png')}
                style={styles.cardBg}
                resizeMode="cover"
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'rgba(102,102,102,0.25)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.cardBg}
              pointerEvents="none"
            />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardText}>{item.text}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Image
                source={require('../assets/images/share-logo.png')}
                style={styles.cardLogo}
                resizeMode="contain"
              />
              {/* Ссылка на приложение — «вшита» в картинку: Instagram не
                  позволяет прикладывать ссылки к шарингу изображений. */}
              <Text style={styles.cardLink}>
                {t('share_app_link', 'mikhail-ageev.ru')}
              </Text>
            </View>
          </ViewShot>
        </View>

        {/* Нижний лист с целями шаринга */}
        <View style={[styles.sheet, {paddingBottom: bottom + 16}]}>
          {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
          <View style={styles.socialRow}>
            {socials.map(s => (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.8}
                onPress={s.onPress}
                style={styles.socialItem}>
                <SvgXml xml={s.icon} width={48} height={48} />
                <Text style={styles.socialLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionsRow}>
            {actions.map(a => (
              <TouchableOpacity
                key={a.key}
                activeOpacity={0.8}
                onPress={a.onPress}
                style={styles.actionItem}>
                <SvgXml xml={a.icon} width={48} height={48} />
                <Text style={styles.socialLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    flex: 1,
    textAlign: 'center',
  },
  previewWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  cardBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardTextBox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cardText: {
    fontFamily: fonts.manrope.medium,
    fontSize: 12,
    lineHeight: 14.4,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
  },
  cardFooter: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  cardLogo: {
    width: 32,
    height: 32,
  },
  cardLink: {
    fontFamily: fonts.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: '#22618D',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 24,
    paddingHorizontal: 35,
    gap: 24,
  },
  feedback: {
    ...typography.small,
    color: colors.white,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: -12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialItem: {
    width: 62,
    alignItems: 'center',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionItem: {
    width: 84,
    alignItems: 'center',
    gap: 8,
  },
  socialLabel: {
    ...typography.small,
    color: colors.white,
    textAlign: 'center',
  },
});
