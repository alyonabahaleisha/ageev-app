import React, {useRef, useState} from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';
import {ICON_CLOSE_PLAYER} from '../assets/icons';
import LinearGradient from './LinearGradient';
import {RemoteImage} from './RemoteImage';
import {PlayerTrack} from '../context/PlayerContext';
import {buildShareLink} from '../services/deepLinks';
import {formatDuration} from '../services/meditations';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {fonts, typography} from '../theme/typography';

// Экраны «Поделиться»: сторис-карточка 210×450 (Figma 448:10359) снимается
// через ViewShot, единственная кнопка открывает системный лист шаринга —
// сохранение, копирование, мессенджеры и Instagram там уже есть.
// ShareAffirmationModal — текстовая карточка аффирмации;
// ShareTrackModal — карточка медитации/вебинара/завтрака с обложкой.

export type ShareAffirmationItem = {
  text: string;
  /** Id аффирмации из общего списка — для диплинка в сообщении. */
  id?: string;
  /** Фон карточки; без него — стандартный фон аффирмаций. */
  backgroundUrl?: string;
};

const CARD_W = 210;
const CARD_H = 450;

// Общий каркас: шапка с крестиком, превью-карточка (она же снимается в
// картинку) и кнопка системного листа. Ссылка на приложение уходит текстом
// там, где лист это поддерживает; Instagram текст игнорирует — поэтому
// ссылка продублирована на самой картинке.
function ShareModalShell({
  onClose,
  message,
  link,
  children,
}: {
  onClose: () => void;
  message: string;
  /** Диплинк — копируется в буфер при шаринге (для стикера «Ссылка» в
   *  Instagram: прикладывать ссылки к картинкам Instagram не даёт). */
  link: string;
  children: React.ReactNode;
}) {
  const {top, bottom} = useSafeAreaInsets();
  const t = useUIStrings();
  const shotRef = useRef<React.ElementRef<typeof ViewShot>>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const openShareSheet = async () => {
    let url: string | null = null;
    try {
      url = (await shotRef.current?.capture?.()) ?? null;
    } catch {
      url = null;
    }
    if (!url) return;
    // Правки (Figma 489:11217): ViewShot может вернуть путь без схемы —
    // без «file://» мессенджеры (Telegram) получали текстовый путь к файлу
    // вместо самой картинки.
    const fileUrl = url.startsWith('file://') ? url : `file://${url}`;
    Clipboard.setString(link);
    setLinkCopied(true);
    Share.open({
      url: fileUrl,
      message,
      type: 'image/png',
      failOnCancel: false,
    }).catch(() => {});
  };

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

        {/* Предпросмотр — он же снимается в картинку. */}
        <View style={styles.previewWrap}>
          <ViewShot
            ref={shotRef}
            options={{format: 'png', quality: 1}}
            style={styles.card}>
            {children}
          </ViewShot>
        </View>

        {/* Нижний лист: единственная кнопка — системный лист шаринга */}
        <View style={[styles.sheet, {paddingBottom: bottom + 16}]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openShareSheet}
            style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>
              {t('share_title', 'Поделиться')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.sheetHint}>
            {linkCopied
              ? t(
                  'share_link_copied',
                  'Ссылка скопирована — в сторис Instagram добавьте её через стикер «Ссылка»',
                )
              : t(
                  'share_instagram_hint',
                  'Ссылка скопируется автоматически — для сторис Instagram вставьте её через стикер «Ссылка»',
                )}
          </Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}

function CardFooter({link}: {link: string}) {
  return (
    <View style={styles.cardFooter}>
      <Image
        source={require('../assets/images/share-logo.png')}
        style={styles.cardLogo}
        resizeMode="contain"
      />
      {/* Ссылка «вшита» в картинку: Instagram не позволяет прикладывать
          ссылки к шарингу изображений. */}
      <Text style={styles.cardLink}>{link}</Text>
    </View>
  );
}

export function ShareAffirmationModal({
  item,
  onClose,
}: {
  item: ShareAffirmationItem | null;
  onClose: () => void;
}) {
  const t = useUIStrings();
  if (!item) return null;

  const link = item.id
    ? buildShareLink('affirmation', item.id)
    : t('share_app_url', 'https://mikhail-ageev.ru');

  return (
    <ShareModalShell onClose={onClose} message={link} link={link}>
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
      <CardFooter link={t('share_app_link', 'mikhail-ageev.ru')} />
    </ShareModalShell>
  );
}

export function ShareTrackModal({
  track,
  onClose,
}: {
  track: PlayerTrack | null;
  onClose: () => void;
}) {
  const t = useUIStrings();
  if (!track) return null;

  const kindLabel =
    track.kind === 'meditation'
      ? t('player_kind_meditation', 'Медитация')
      : track.kind === 'webinar'
      ? t('player_kind_webinar', 'Вебинар')
      : track.kind === 'breakfast'
      ? t('player_kind_breakfast', 'Духовный завтрак')
      : '';
  // «Медитация „Название“»; у завтраков тип уже в названии — не дублируем.
  const messageTitle =
    kindLabel &&
    !track.title.toLowerCase().startsWith(kindLabel.toLowerCase())
      ? `${kindLabel} «${track.title}»`
      : track.title;
  const link = track.kind
    ? buildShareLink(track.kind, track.id)
    : t('share_app_url', 'https://mikhail-ageev.ru');
  const chip = [
    kindLabel,
    track.durationSeconds ? formatDuration(track.durationSeconds) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ShareModalShell
      onClose={onClose}
      message={`${messageTitle}\n${link}`}
      link={link}>
      {!!track.coverUrl && (
        <RemoteImage
          source={{uri: track.coverUrl}}
          style={styles.cardBg}
          resizeMode="cover"
        />
      )}
      {/* Равномерное затемнение, чтобы текст в центре читался на любой
          обложке. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.55)']}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
        style={styles.cardBg}
        pointerEvents="none"
      />
      <View style={styles.trackInfo}>
        {!!chip && <Text style={styles.trackKind}>{chip}</Text>}
        <Text style={styles.trackTitle} numberOfLines={4}>
          {track.title}
        </Text>
      </View>
      <CardFooter link={t('share_app_link', 'mikhail-ageev.ru')} />
    </ShareModalShell>
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
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  trackKind: {
    fontFamily: fonts.manrope.medium,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.white,
    opacity: 0.8,
    marginBottom: 6,
  },
  trackTitle: {
    fontFamily: fonts.manrope.semiBold,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
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
  shareBtn: {
    backgroundColor: colors.white,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnText: {
    ...typography.h2,
    color: '#165079',
  },
  sheetHint: {
    ...typography.small,
    color: colors.white,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: -8,
  },
});
