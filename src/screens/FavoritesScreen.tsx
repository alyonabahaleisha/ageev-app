import React, {useState} from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ICON_BACK,
  ICON_CLOCK,
  ICON_HEART_FILLED,
  ICON_PLAY_TRIANGLE,
  ICON_SHARE,
} from '../assets/icons';
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
import {GradientBackground} from '../components/GradientBackground';
import LinearGradient from '../components/LinearGradient';
import {PrimaryButton} from '../components/PrimaryButton';
import {RemoteImage} from '../components/RemoteImage';
import {usePlayer} from '../context/PlayerContext';
import {
  FavoriteItem,
  FavoriteKind,
  toggleFavorite,
  useFavorites,
} from '../services/favorites';
import {
  ShareAffirmationItem,
  ShareAffirmationModal,
} from '../components/ShareAffirmation';
import {formatDuration} from '../services/meditations';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const CARD_GAP = 12;
const MEDIA_CARD_W = 280;
const CARD_H = 170;
const AFF_CARD_H = 140;
const CARD_RADIUS = 20;
const CARD_PAD = 14;
const PLAY_BTN = 50;
const BTN_SIZE = 34;

type Props = {
  onBack: () => void;
  onGoPractices: () => void;
  onOpenAffirmation: (item: FavoriteItem) => void;
};

// Карточка медитации/вебинара — как в списках практик; в горизонтальной
// ленте фиксированные 280, в списке «Посмотреть все» — на всю ширину.
function MediaCard({item, wide}: {item: FavoriteItem; wide?: boolean}) {
  const {openPlayer} = usePlayer();
  const onPress = () =>
    openPlayer({
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      audioUrl: item.audioUrl ?? '',
      coverUrl: item.coverUrl ?? '',
      durationSeconds: item.durationSeconds ?? 0,
      kind: item.kind === 'affirmation' ? undefined : item.kind,
    });
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.mediaShadow, !wide && {width: MEDIA_CARD_W}]}>
      <View style={styles.mediaClip}>
        <RemoteImage
          source={{uri: item.coverUrl ?? ''}}
          style={styles.cardBg}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(102,102,102,0.25)']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.cardBg}
          pointerEvents="none"
        />
        <View style={styles.mediaContent}>
          <View style={styles.mediaLeft}>
            <View style={styles.mediaTextBlock}>
              <Text style={styles.mediaTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.mediaSubtitle} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            {!!item.durationSeconds && (
              <View style={styles.timeRow}>
                <SvgXml xml={ICON_CLOCK} width={18} height={18} />
                <Text style={styles.timeText}>
                  {formatDuration(item.durationSeconds)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.playBtn}>
            <SvgXml xml={ICON_PLAY_TRIANGLE} width={16} height={16} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Карточка аффирмации (Figma 389:5822): фон, текст по центру, сердце + шер.
// Тап по карточке открывает пейджер аффирмаций на этой аффирмации.
function AffirmationFavCard({
  item,
  wide,
  onOpen,
  onShare,
}: {
  item: FavoriteItem;
  wide?: boolean;
  onOpen: (item: FavoriteItem) => void;
  onShare: (item: FavoriteItem) => void;
}) {
  // В горизонтальной ленте карточка на всю ширину контента (342 в макете 390).
  const width = wide
    ? undefined
    : Dimensions.get('window').width - SECTION_MARGIN * 2;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onOpen(item)}
      style={[styles.mediaShadow, styles.affShadow, {width}]}>
      <View style={styles.mediaClip}>
        {item.coverUrl ? (
          <RemoteImage
            source={{uri: item.coverUrl}}
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
        <View style={styles.affContent}>
          <Text style={styles.affText} numberOfLines={3}>
            {item.title}
          </Text>
          <View style={styles.affIcons}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={() => toggleFavorite(item)}>
              <SvgXml xml={ICON_HEART_FILLED} width={24} height={24} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={() => onShare(item)}>
              <SvgXml xml={ICON_SHARE} width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function renderCard(
  item: FavoriteItem,
  onOpenAffirmation: (item: FavoriteItem) => void,
  onShareAffirmation: (item: FavoriteItem) => void,
  wide?: boolean,
) {
  return item.kind === 'affirmation' ? (
    <AffirmationFavCard
      key={item.id}
      item={item}
      wide={wide}
      onOpen={onOpenAffirmation}
      onShare={onShareAffirmation}
    />
  ) : (
    <MediaCard key={item.id} item={item} wide={wide} />
  );
}

/** Избранное (Figma 448:10703, пустое — 448:10681, списки — 448:10692). */
export function FavoritesScreen({onBack, onGoPractices, onOpenAffirmation}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const {items, loaded} = useFavorites();
  const t = useUIStrings();
  // «Посмотреть все» открывает вертикальный список одного раздела.
  const [listKind, setListKind] = useState<FavoriteKind | null>(null);
  const [shareItem, setShareItem] = useState<ShareAffirmationItem | null>(
    null,
  );
  const shareAffirmation = (i: FavoriteItem) =>
    setShareItem({text: i.title, backgroundUrl: i.coverUrl});

  const sections: {kind: FavoriteKind; title: string; items: FavoriteItem[]}[] =
    [
      {
        kind: 'meditation',
        title: t('favorites_meditations', 'Медитации'),
        items: items.filter(i => i.kind === 'meditation'),
      },
      {
        kind: 'webinar',
        title: t('favorites_webinars', 'Вебинары'),
        items: items.filter(i => i.kind === 'webinar'),
      },
      {
        kind: 'breakfast',
        title: t('favorites_breakfasts', 'Духовные завтраки'),
        items: items.filter(i => i.kind === 'breakfast'),
      },
      {
        kind: 'affirmation',
        title: t('favorites_affirmations', 'Аффирмации'),
        items: items.filter(i => i.kind === 'affirmation'),
      },
    ];

  const openSection = sections.find(s => s.kind === listKind);
  const empty = loaded && items.length === 0;

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {paddingTop: headerScrollPadding(top), paddingBottom: bottom + 40},
        ]}
        showsVerticalScrollIndicator={false}>
        {empty ? (
          // Пустое состояние (448:10681)
          <View style={styles.emptyBlock}>
            <View style={styles.emptyText}>
              <Text style={styles.emptyTitle}>
                {t('favorites_empty_title', 'Пока ничего не сохранено')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t(
                  'favorites_empty_subtitle',
                  'Добавляйте медитации, аффирмации и материалы, к которым хочется возвращаться.',
                )}
              </Text>
            </View>
            <PrimaryButton
              title={t('favorites_empty_button', 'Перейти к практикам')}
              onPress={onGoPractices}
              style={styles.emptyButton}
            />
          </View>
        ) : openSection ? (
          // Вертикальный список раздела (448:10692)
          <View style={styles.fullList}>
            {openSection.items.map(i =>
              renderCard(i, onOpenAffirmation, shareAffirmation, true),
            )}
          </View>
        ) : (
          // Разделы с горизонтальными лентами (448:10703)
          <View style={styles.sections}>
            {sections
              .filter(s => s.items.length > 0)
              .map(s => (
                <View key={s.kind} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{s.title}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                      onPress={() => setListKind(s.kind)}>
                      <Text style={styles.sectionLink}>
                        {t('favorites_see_all', 'Посмотреть все')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.hScroll}
                    contentContainerStyle={styles.hScrollContent}>
                    {s.items.map(i =>
                      renderCard(i, onOpenAffirmation, shareAffirmation),
                    )}
                  </ScrollView>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Шапка: назад + заголовок по центру */}
      <FixedHeader>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openSection ? () => setListKind(null) : onBack}
            style={styles.backBtn}>
            <SvgXml xml={ICON_BACK} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {openSection ? openSection.title : t('favorites_title', 'Избранное')}
          </Text>
          <View style={styles.backBtn} />
        </View>
      </FixedHeader>

      {/* «Поделиться» (448:10293) */}
      <ShareAffirmationModal
        item={shareItem}
        onClose={() => setShareItem(null)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {flexGrow: 1},

  // ── Шапка ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SECTION_MARGIN,
  },
  backBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },

  // ── Пустое состояние ───────────────────────────────────────────────────────
  emptyBlock: {
    marginTop: 33,
    marginHorizontal: SECTION_MARGIN,
    alignItems: 'center',
    gap: 24,
  },
  emptyText: {
    alignSelf: 'stretch',
    gap: 12,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  emptyButton: {
    alignSelf: 'stretch',
  },

  // ── Разделы ────────────────────────────────────────────────────────────────
  sections: {
    marginTop: 7,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SECTION_MARGIN,
  },
  sectionTitle: {
    ...typography.bodyLarge,
    color: colors.white,
  },
  sectionLink: {
    ...typography.body,
    color: colors.brand.pale,
  },
  hScroll: {
    flexGrow: 0,
  },
  hScrollContent: {
    paddingHorizontal: SECTION_MARGIN,
    gap: CARD_GAP,
  },

  // ── Вертикальный список раздела ───────────────────────────────────────────
  fullList: {
    marginTop: 7,
    marginHorizontal: SECTION_MARGIN,
    gap: CARD_GAP,
  },

  // ── Медиа-карточка ────────────────────────────────────────────────────────
  mediaShadow: {
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {elevation: 4},
    }),
  },
  mediaClip: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mediaContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: CARD_PAD,
    gap: 10,
  },
  mediaLeft: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mediaTextBlock: {
    gap: 12,
  },
  mediaTitle: {
    ...typography.body,
    color: colors.white,
    minHeight: 42,
  },
  mediaSubtitle: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    ...typography.small,
    color: colors.white,
  },
  playBtn: {
    width: PLAY_BTN,
    height: PLAY_BTN,
    borderRadius: PLAY_BTN / 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.2,
        shadowRadius: 32,
      },
    }),
  },

  // ── Карточка аффирмации ───────────────────────────────────────────────────
  affShadow: {
    height: AFF_CARD_H,
  },
  affContent: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  affText: {
    ...typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  affIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
