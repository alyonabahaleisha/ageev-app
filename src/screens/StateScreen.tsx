import React, {useMemo, useRef, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ICON_BACK,
  ICON_CLOCK,
  ICON_CLOSE,
  ICON_HEART,
  ICON_PLAY_TRIANGLE,
  ICON_SHARE,
} from '../assets/icons';
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
import {GradientBackground} from '../components/GradientBackground';
import LinearGradient from '../components/LinearGradient';
import {RemoteImage} from '../components/RemoteImage';
import {usePlayer} from '../context/PlayerContext';
import {
  MindsetAffirmation,
  MindsetState,
  MindsetStateExercise,
} from '../services/mindsetStates';
import {formatDuration, useMeditations} from '../services/meditations';
import {useWebinars} from '../services/webinars';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const {width: SCREEN_W} = Dimensions.get('window');
const SECTION_MARGIN = 24;
const MEDIA_W = 280;
const MEDIA_H = 170;
const AFF_W = Math.min(320, SCREEN_W - 73);
const AFF_H = 160;

// YouTube video id → thumbnail (covers youtube.com/live/ID, watch?v=ID, youtu.be/ID).
function youtubeThumb(url: string): string {
  const m = url.match(
    /(?:youtube\.com\/(?:live\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
}

function MediaCard({
  coverUrl,
  title,
  durationSeconds = 0,
  onPress,
}: {
  coverUrl: string;
  title: string;
  durationSeconds?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.mediaGlow}
      onPress={onPress}>
      <View style={styles.mediaShadow}>
        <View style={styles.mediaClip}>
          {!!coverUrl && (
            <RemoteImage
              source={{uri: coverUrl}}
              style={styles.mediaBg}
              resizeMode="cover"
            />
          )}
          <View style={styles.mediaOverlay} />
          <View style={styles.mediaContent}>
            <Text style={styles.mediaTitle} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.mediaFooter}>
              {durationSeconds > 0 ? (
                <View style={styles.timeRow}>
                  <SvgXml xml={ICON_CLOCK} width={18} height={18} />
                  <Text style={styles.timeText}>
                    {formatDuration(durationSeconds)}
                  </Text>
                </View>
              ) : (
                <View />
              )}
              <View style={styles.playBtn}>
                <SvgXml xml={ICON_PLAY_TRIANGLE} width={16} height={16} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Full-width row card used for the spiritual breakfast (plays audio) and for
// external webinar/meditation links (opens the URL).
function RowCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.rowCard}
      onPress={onPress}>
      <Text style={styles.rowTitle} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.playBtn}>
        <SvgXml xml={icon} width={16} height={16} />
      </View>
    </TouchableOpacity>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type Props = {state: MindsetState; onBack: () => void};

export function StateScreen({state, onBack}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const {openPlayer} = usePlayer();
  const {meditations} = useMeditations();
  const {webinars} = useWebinars();
  const [flowOpen, setFlowOpen] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const stateMeditations = useMemo(
    () =>
      state.meditationIds
        .map(id => meditations.find(m => m.id === id))
        .filter((m): m is NonNullable<typeof m> => !!m),
    [state.meditationIds, meditations],
  );
  const stateWebinars = useMemo(
    () =>
      state.webinarIds
        .map(id => webinars.find(w => w.id === id))
        .filter((w): w is NonNullable<typeof w> => !!w),
    [state.webinarIds, webinars],
  );

  const ex = state.exercise;
  const exerciseImage = ex.image || state.coverImage;
  const affBg = state.affirmationsBackground || state.coverImage;
  const canStartExercise =
    ex.steps.length > 0 || ex.recommendations.length > 0;
  const hasExercise = !!(ex.title || ex.description || canStartExercise);

  return (
    <GradientBackground style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {paddingTop: headerScrollPadding(top), paddingBottom: bottom + 120},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Title + subtitle */}
        <View style={styles.headerText}>
          <Text style={styles.title}>{state.title}</Text>
          {!!state.subtitle && (
            <Text style={styles.subtitle}>{state.subtitle}</Text>
          )}
        </View>

        {/* Упражнение дня — compact card */}
        {hasExercise && (
          <View style={styles.exerciseWrap}>
            <View style={styles.exerciseCard}>
              <View style={styles.exerciseTitleBlock}>
                <Text style={styles.exerciseDescriptor}>Упражнение дня</Text>
                {!!ex.title && (
                  <Text style={styles.exerciseTitle}>{ex.title}</Text>
                )}
              </View>
              <View style={styles.exerciseMetaBlock}>
                {!!ex.durationText && (
                  <View style={styles.timeRow}>
                    <SvgXml xml={ICON_CLOCK} width={18} height={18} />
                    <Text style={styles.timeText}>{ex.durationText}</Text>
                  </View>
                )}
                {!!ex.description && (
                  <Text style={styles.exerciseDesc}>{ex.description}</Text>
                )}
              </View>
              {canStartExercise && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.primaryBtn}
                  onPress={() => setExerciseOpen(true)}>
                  <Text style={styles.primaryBtnText}>Начать</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Аффирмации */}
        {state.affirmations.length > 0 && (
          <Section title="Аффирмации">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}>
              {state.affirmations.map((a, i) => {
                const cardBg = a.background || affBg;
                return (
                <View key={i} style={styles.affShadow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.affCard}
                    onPress={() => setFlowOpen(true)}>
                    {!!cardBg && (
                      <RemoteImage
                        source={{uri: cardBg}}
                        style={styles.affBg}
                        resizeMode="cover"
                      />
                    )}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.4)', 'rgba(102,102,102,0.4)']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.affBg}
                    />
                    <View style={styles.affCardInner}>
                      <View style={styles.affTextBlock}>
                        <Text style={styles.affText} numberOfLines={2}>
                          {a.text}
                        </Text>
                        <Text style={styles.affMore}>Читать полностью</Text>
                      </View>
                      <View style={styles.affIcons}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                          onPress={() =>
                            setLiked(prev => ({...prev, [i]: !prev[i]}))
                          }
                          style={liked[i] ? undefined : styles.iconDim}>
                          <SvgXml xml={ICON_HEART} width={22} height={22} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                          onPress={() =>
                            Share.share({message: a.text}).catch(() => {})
                          }
                          style={styles.iconDim}>
                          <SvgXml xml={ICON_SHARE} width={22} height={22} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
                );
              })}
            </ScrollView>
            <View style={styles.affBtnWrap}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.primaryBtn}
                onPress={() => setFlowOpen(true)}>
                <Text style={styles.primaryBtnText}>
                  Погрузиться в поток аффирмаций
                </Text>
              </TouchableOpacity>
            </View>
          </Section>
        )}

        {/* Духовный завтрак */}
        {!!state.breakfastUrl && (
          <Section title="Духовный завтрак">
            <View style={styles.rowWrap}>
              <RowCard
                title={state.breakfastTitle || 'Духовный завтрак'}
                icon={ICON_PLAY_TRIANGLE}
                onPress={() =>
                  openPlayer({
                    id: `${state.id}_breakfast`,
                    title: state.breakfastTitle || 'Духовный завтрак',
                    description: state.title,
                    audioUrl: state.breakfastUrl,
                    coverUrl: state.coverImage,
                    durationSeconds: 0,
                  })
                }
              />
            </View>
          </Section>
        )}

        {/* Вебинары и медитации (внешние ссылки) — cards per design */}
        {state.externalLinks.length > 0 && (
          <Section title="Вебинары и медитации">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}>
              {state.externalLinks.map((l, i) => (
                <MediaCard
                  key={i}
                  title={l.title}
                  coverUrl={l.image || youtubeThumb(l.url) || affBg}
                  onPress={() => Linking.openURL(l.url).catch(() => {})}
                />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Медитации */}
        {stateMeditations.length > 0 && (
          <Section title="Медитации">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}>
              {stateMeditations.map(m => (
                <MediaCard
                  key={m.id}
                  title={m.title}
                  coverUrl={m.coverUrl}
                  durationSeconds={m.durationSeconds}
                  onPress={() =>
                    openPlayer({
                      id: m.id,
                      title: m.title,
                      description: m.description,
                      audioUrl: m.audioUrl,
                      coverUrl: m.coverUrl,
                      durationSeconds: m.durationSeconds,
                    })
                  }
                />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Вебинары */}
        {stateWebinars.length > 0 && (
          <Section title="Вебинары">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}>
              {stateWebinars.map(w => (
                <MediaCard
                  key={w.id}
                  title={w.title}
                  coverUrl={w.coverUrl}
                  durationSeconds={w.durationSeconds}
                  onPress={() =>
                    openPlayer({
                      id: w.id,
                      title: w.title,
                      description: w.description,
                      audioUrl: w.audioUrl,
                      coverUrl: w.coverUrl,
                      durationSeconds: w.durationSeconds,
                    })
                  }
                />
              ))}
            </ScrollView>
          </Section>
        )}
      </ScrollView>

      {/* Fixed header with back button */}
      <FixedHeader>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <SvgXml xml={ICON_BACK} width={28} height={28} />
          </TouchableOpacity>
        </View>
      </FixedHeader>

      {flowOpen && (
        <AffirmationFlow
          items={state.affirmations}
          background={affBg}
          onClose={() => setFlowOpen(false)}
        />
      )}

      {exerciseOpen && (
        <ExerciseFlow
          exercise={ex}
          backgroundUrl={exerciseImage}
          onClose={() => setExerciseOpen(false)}
        />
      )}
    </GradientBackground>
  );
}

// ── Immersive affirmation pager ──────────────────────────────────────────────
function fontForText(text: string): {fontSize: number; lineHeight: number} {
  const len = text.length;
  if (len <= 60) return {fontSize: 26, lineHeight: 34};
  if (len <= 120) return {fontSize: 23, lineHeight: 31};
  if (len <= 220) return {fontSize: 20, lineHeight: 27};
  if (len <= 340) return {fontSize: 18, lineHeight: 24};
  return {fontSize: 16, lineHeight: 22};
}

function AffirmationFlow({
  items,
  background,
  onClose,
}: {
  items: MindsetAffirmation[];
  background?: string;
  onClose: () => void;
}) {
  const {top, bottom} = useSafeAreaInsets();
  const listRef = useRef<FlatList<MindsetAffirmation>>(null);
  return (
    <View style={styles.flowRoot}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({item}) => {
          const f = fontForText(item.text);
          const pageBg = item.background || background;
          return (
            <View style={styles.flowPage}>
              {!!pageBg && (
                <>
                  <RemoteImage
                    source={{uri: pageBg}}
                    style={styles.flowBg}
                    resizeMode="cover"
                  />
                  <View style={styles.flowOverlay} />
                </>
              )}
              <View
                style={[
                  styles.flowPageInner,
                  {paddingTop: top, paddingBottom: bottom},
                ]}>
                <Text
                  style={[
                    styles.flowText,
                    {fontSize: f.fontSize, lineHeight: f.lineHeight},
                  ]}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onClose}
        style={[styles.flowClose, {top: top + 7}]}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <SvgXml xml={ICON_CLOSE} width={24} height={24} />
      </TouchableOpacity>
    </View>
  );
}

// A step body is authored as paragraphs separated by a blank line; each becomes
// a centered point with a fading divider between (Figma 411-7591).
function splitPoints(body?: string): string[] {
  return (body || '')
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

// ── Guided exercise flow (intro → steps → recommendations) ───────────────────
type FlowPage =
  | {kind: 'intro'}
  | {kind: 'step'; idx: number}
  | {kind: 'recs'};

function ExerciseFlow({
  exercise,
  backgroundUrl,
  onClose,
}: {
  exercise: MindsetStateExercise;
  backgroundUrl: string;
  onClose: () => void;
}) {
  const {top, bottom} = useSafeAreaInsets();
  const {title, intro, steps, recommendations: recs} = exercise;
  const stepBg = exercise.stepsBackground || backgroundUrl;

  const pages: FlowPage[] = [];
  if (intro || title || backgroundUrl) pages.push({kind: 'intro'});
  steps.forEach((_, i) => pages.push({kind: 'step', idx: i}));
  if (recs.length) pages.push({kind: 'recs'});

  const [index, setIndex] = useState(0);
  const page = pages[index] ?? {kind: 'intro'};
  const next = () => setIndex(i => Math.min(i + 1, pages.length - 1));
  const back = () => (index === 0 ? onClose() : setIndex(i => i - 1));
  const isLastStep =
    page.kind === 'step' &&
    (index === pages.length - 1 || pages[index + 1]?.kind === 'recs');

  const isIntro = page.kind === 'intro';

  return (
    <GradientBackground style={styles.exFlowRoot}>
      {/* Steps & recommendations sit over a photo background; the intro is on
          the plain gradient (Figma 411-6871 / 411-7591). */}
      {!isIntro && !!stepBg && (
        <>
          <RemoteImage
            source={{uri: stepBg}}
            style={styles.exFlowBg}
            resizeMode="cover"
          />
          <View style={styles.exFlowOverlay} />
        </>
      )}

      {/* Top bar: close + step progress */}
      <View style={[styles.exTopBar, {paddingTop: top + 10}]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <SvgXml xml={ICON_CLOSE} width={30} height={30} />
        </TouchableOpacity>
        {page.kind === 'step' && (
          <Text style={styles.exProgress}>
            {page.idx + 1} / {steps.length}
          </Text>
        )}
        <View style={{width: 30}} />
      </View>

      {isIntro ? (
        // Intro screen — title, text, button, then a contained image.
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.exIntroScroll, {paddingBottom: bottom + 24}]}
          showsVerticalScrollIndicator={false}>
          {!!title && <Text style={styles.exTitle}>{title}</Text>}
          {!!intro && <Text style={styles.exIntroBody}>{intro}</Text>}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={next}>
            <Text style={styles.primaryBtnText}>Начать упражнение</Text>
          </TouchableOpacity>
          {!!backgroundUrl && (
            <RemoteImage
              source={{uri: backgroundUrl}}
              style={styles.exIntroImg}
              resizeMode="cover"
            />
          )}
        </ScrollView>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.exScroll}
            showsVerticalScrollIndicator={false}>
            {page.kind === 'step' && (
              <>
                {!!steps[page.idx]?.title && (
                  <Text style={styles.exStepTitle}>
                    {steps[page.idx].title}
                  </Text>
                )}
                <View style={styles.exPoints}>
                  {splitPoints(steps[page.idx]?.body).map((p, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <LinearGradient
                          colors={[
                            'rgba(255,255,255,0)',
                            'rgba(255,255,255,0.6)',
                            'rgba(255,255,255,0)',
                          ]}
                          start={{x: 0, y: 0.5}}
                          end={{x: 1, y: 0.5}}
                          style={styles.exDivider}
                        />
                      )}
                      <Text style={styles.exPointText}>{p}</Text>
                    </React.Fragment>
                  ))}
                </View>
              </>
            )}
            {page.kind === 'recs' && (
              <>
                <Text style={styles.exTitle}>Рекомендации по выполнению</Text>
                {recs.map((r, i) => (
                  <View key={i} style={styles.exRecItem}>
                    {!!r.title && (
                      <Text style={styles.exRecTitle}>{r.title}</Text>
                    )}
                    {!!r.body && <Text style={styles.exRecBody}>{r.body}</Text>}
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          {/* Bottom navigation */}
          <View style={[styles.exNav, {paddingBottom: bottom + 16}]}>
            {page.kind === 'recs' ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.primaryBtn}
                onPress={onClose}>
                <Text style={styles.primaryBtnText}>Вернуться к практике</Text>
              </TouchableOpacity>
            ) : isLastStep ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.primaryBtn}
                onPress={() => (index < pages.length - 1 ? next() : onClose())}>
                <Text style={styles.primaryBtnText}>Завершить</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.exNavRow}>
                <TouchableOpacity activeOpacity={0.8} onPress={back}>
                  <Text style={styles.exNavText}>← Назад</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={next}>
                  <Text style={styles.exNavText}>Далее →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </GradientBackground>
  );
}

const cardShadowIOS: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 8},
  shadowOpacity: 0.12,
  shadowRadius: 24,
};

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  content: {flexGrow: 1, gap: 24},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 28,
  },

  headerText: {
    marginTop: 16,
    marginHorizontal: SECTION_MARGIN,
    gap: 12,
    alignItems: 'center',
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
  },

  // Упражнение дня — compact card (Figma 411-6835)
  exerciseWrap: {paddingHorizontal: SECTION_MARGIN},
  exerciseCard: {
    padding: 18,
    gap: 12,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  exerciseTitleBlock: {alignItems: 'center', gap: 5},
  exerciseMetaBlock: {alignItems: 'center', gap: 5},
  exerciseDescriptor: {
    ...typography.bodyMedium,
    color: colors.white,
    textAlign: 'center',
  },
  exerciseTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  exerciseDesc: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },

  // Guided exercise flow
  exFlowRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  exFlowBg: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  exIntroScroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 24,
  },
  exIntroBody: {
    ...typography.body,
    lineHeight: 24,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  exIntroImg: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },
  exFlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,21,32,0.32)',
  },
  exTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  exProgress: {...typography.bodyLarge, color: colors.white, opacity: 0.9},
  exScroll: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  exTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Step screen: title + centered points separated by fading dividers
  exStepTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 28,
  },
  exPoints: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 36,
  },
  exDivider: {
    alignSelf: 'stretch',
    height: 1,
    opacity: 0.6,
  },
  exPointText: {
    ...typography.bodyLarge,
    lineHeight: 26,
    color: colors.white,
    textAlign: 'center',
  },
  exRecItem: {marginBottom: 24, alignSelf: 'stretch', alignItems: 'center'},
  exRecTitle: {
    ...typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  exRecBody: {
    ...typography.body,
    lineHeight: 23,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  exNav: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  exNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exNavText: {...typography.button, color: colors.white},

  primaryBtn: {
    alignSelf: 'stretch',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 14},
        shadowOpacity: 0.35,
        shadowRadius: 40,
      },
    }),
  },
  primaryBtnText: {
    ...typography.button,
    color: '#2C2C2C',
  },

  // Sections
  section: {gap: 16},
  sectionTitle: {
    ...typography.bodyLarge,
    color: colors.white,
    paddingHorizontal: SECTION_MARGIN,
  },
  hScroll: {
    paddingHorizontal: SECTION_MARGIN,
    gap: 12,
  },

  // Affirmation cards
  affShadow: {
    width: AFF_W,
    height: AFF_H,
    borderRadius: 20,
    ...Platform.select({ios: cardShadowIOS}),
  },
  affCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  affBg: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  affCardInner: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    gap: 12,
  },
  affTextBlock: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10},
  affText: {
    ...typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
  },
  affMore: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.7,
    textDecorationLine: 'underline',
  },
  affIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconDim: {opacity: 0.65},
  affBtnWrap: {paddingHorizontal: SECTION_MARGIN},

  // Full-width row cards (breakfast / external links)
  rowWrap: {paddingHorizontal: SECTION_MARGIN, gap: 12},
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({ios: cardShadowIOS}),
  },
  rowTitle: {
    ...typography.bodyMedium,
    color: colors.white,
    flex: 1,
  },

  // Media cards (meditation / webinar)
  mediaGlow: {
    width: MEDIA_W,
    height: MEDIA_H,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  mediaShadow: {
    width: MEDIA_W,
    height: MEDIA_H,
    borderRadius: 20,
    ...Platform.select({ios: cardShadowIOS, android: {elevation: 4}}),
  },
  mediaClip: {
    width: MEDIA_W,
    height: MEDIA_H,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mediaBg: {position: 'absolute', width: MEDIA_W, height: MEDIA_H},
  mediaOverlay: {
    position: 'absolute',
    width: MEDIA_W,
    height: MEDIA_H,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  mediaContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    justifyContent: 'space-between',
  },
  mediaTitle: {...typography.bodyMedium, color: colors.white},
  mediaFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  timeText: {...typography.small, color: colors.white},

  // Affirmation flow
  flowRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: colors.background,
  },
  flowBg: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  flowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,21,32,0.5)',
  },
  flowPage: {
    width: SCREEN_W,
    flex: 1,
  },
  flowPageInner: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowText: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  flowClose: {
    position: 'absolute',
    right: 20,
  },
});
