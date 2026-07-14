import React, {useState} from 'react';
import {
  Dimensions,
  Image,
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
import {ICON_BACK, ICON_CLOSE, ICON_SEARCH} from '../assets/icons';
import {GradientBackground} from '../components/GradientBackground';
import {RemoteImage} from '../components/RemoteImage';
import {usePlayer} from '../context/PlayerContext';
import {useBreakfasts} from '../services/breakfasts';
import {formatDuration, useMeditations} from '../services/meditations';
import {useUIStrings} from '../services/uiStrings';
import {useWebinars} from '../services/webinars';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const THUMB = 80;
const CHIP_GAP = 16;

export type SearchCategory =
  | 'meditations'
  | 'affirmations'
  | 'webinars'
  | 'breakfasts';

// Same chips as the Практики format picker (design «Быстрые категории»).
const CATEGORIES: {
  id: SearchCategory;
  label: string;
  icon: number;
  iconW: number;
  iconH: number;
}[] = [
  {
    id: 'meditations',
    label: 'Медитации',
    icon: require('../assets/images/format-meditation-6a1889.png'),
    iconW: 30,
    iconH: 34,
  },
  {
    id: 'affirmations',
    label: 'Аффирмации',
    icon: require('../assets/images/format-affirmations-56586a.png'),
    iconW: 30,
    iconH: 30,
  },
  {
    id: 'webinars',
    label: 'Вебинары',
    icon: require('../assets/images/format-webinar-56586b-56586a.png'),
    iconW: 30,
    iconH: 23,
  },
  {
    id: 'breakfasts',
    label: 'Духовные завтраки',
    icon: require('../assets/images/format-breakfast.png'),
    iconW: 30,
    iconH: 31,
  },
];

type Playable = {
  id: string;
  title: string;
  description?: string;
  audioUrl: string;
  coverUrl: string;
  durationSeconds: number;
};

function ResultRow({
  item,
  kind,
}: {
  item: Playable;
  kind?: 'meditation' | 'webinar';
}) {
  const {openPlayer} = usePlayer();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.row}
      onPress={() =>
        openPlayer({
          id: item.id,
          title: item.title,
          description: item.description || '',
          audioUrl: item.audioUrl,
          coverUrl: item.coverUrl,
          durationSeconds: item.durationSeconds,
          kind,
        })
      }>
      {item.coverUrl ? (
        <RemoteImage
          source={{uri: item.coverUrl}}
          style={styles.rowThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.rowThumb, styles.rowThumbEmpty]} />
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.durationSeconds > 0 && (
          <Text style={styles.rowDuration}>
            {formatDuration(item.durationSeconds)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

type Props = {
  onBack: () => void;
  onOpenCategory: (id: SearchCategory) => void;
};

export function SearchScreen({onBack, onOpenCategory}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const {meditations} = useMeditations();
  const {webinars} = useWebinars();
  const {breakfasts} = useBreakfasts();
  const t = useUIStrings();

  const trimmed = query.trim().toLowerCase();
  const match = (title: string) => title.toLowerCase().includes(trimmed);
  const sections = trimmed
    ? [
        {
          key: 'meditations',
          title: t('meditations_title', 'Медитации'),
          items: meditations.filter(m => match(m.title)) as Playable[],
        },
        {
          key: 'webinars',
          title: t('webinars_title', 'Вебинары'),
          items: webinars.filter(w => match(w.title)) as Playable[],
        },
        {
          key: 'breakfasts',
          title: t('breakfasts_title', 'Духовные завтраки'),
          items: breakfasts.filter(b => match(b.title)) as Playable[],
        },
      ].filter(s => s.items.length > 0)
    : [];
  const hasResults = sections.length > 0;

  return (
    <GradientBackground>
      {/* Header — back chevron + centered title (design 448:11117) */}
      <View style={[styles.header, {marginTop: top + 7}]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backBtn}>
          <SvgXml xml={ICON_BACK} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('search_title', 'Поиск')}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Search pill */}
      <View style={styles.pill}>
        <SvgXml xml={ICON_SEARCH} width={20} height={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search_placeholder', 'Что хотите найти?')}
          placeholderTextColor="rgba(255,255,255,0.65)"
          style={styles.pillInput}
          autoCorrect={false}
          returnKeyType="search"
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            onPress={() => setQuery('')}>
            <SvgXml xml={ICON_CLOSE} width={20} height={20} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {paddingBottom: bottom + 24}]}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        {trimmed.length > 0 && hasResults && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              {t('search_results', 'Результаты поиска')}
            </Text>
            {sections.map((s, i) => (
              <React.Fragment key={s.key}>
                {i > 0 && <View style={styles.sectionDivider} />}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{s.title}</Text>
                  <View style={styles.sectionList}>
                    {s.items.map(item => (
                      <ResultRow
                        key={item.id}
                        item={item}
                        kind={
                          s.key === 'meditations'
                            ? 'meditation'
                            : s.key === 'webinars'
                            ? 'webinar'
                            : undefined
                        }
                      />
                    ))}
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {trimmed.length > 0 && !hasResults && (
          <View style={styles.empty}>
            <View style={styles.emptyText}>
              <Text style={styles.emptyTitle}>
                {t('search_empty_title', 'Ничего не найдено')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t(
                  'search_empty_subtitle',
                  'Попробуйте изменить запрос или выбрать категорию ниже.',
                )}
              </Text>
            </View>
            <View style={styles.categories}>
              <Text style={styles.emptyTitle}>
                {t('search_quick_categories', 'Быстрые категории')}
              </Text>
              <View style={styles.chipGrid}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.85}
                    style={styles.chip}
                    onPress={() => onOpenCategory(c.id)}>
                    <Image
                      source={c.icon}
                      style={{width: c.iconW, height: c.iconH}}
                      resizeMode="contain"
                    />
                    <Text style={styles.chipLabel}>
                      {t(`practices_format_${c.id}`, c.label)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SECTION_MARGIN,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },

  // ── Search pill ──────────────────────────────────────────────────────────
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginHorizontal: SECTION_MARGIN,
    padding: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  pillInput: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    padding: 0,
  },

  // ── Results ──────────────────────────────────────────────────────────────
  results: {
    marginTop: 23,
    marginHorizontal: SECTION_MARGIN,
    gap: 18,
  },
  resultsTitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 18,
    lineHeight: 21.6,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.65,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 18,
    lineHeight: 21.6,
    fontWeight: '500',
    color: colors.white,
  },
  sectionList: {
    gap: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 15,
  },
  rowThumbEmpty: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  rowText: {
    flex: 1,
    gap: 5,
  },
  rowTitle: {
    ...typography.body,
    color: colors.white,
  },
  rowDuration: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  empty: {
    marginTop: 18,
    marginHorizontal: SECTION_MARGIN,
    gap: 24,
  },
  emptyText: {
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 18,
    lineHeight: 21.6,
    fontWeight: '500',
    color: colors.white,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
  },
  categories: {
    gap: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_GAP,
  },
  chip: {
    width: (Dimensions.get('window').width - SECTION_MARGIN * 2 - CHIP_GAP) / 2,
    height: 140,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  chipLabel: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
});
