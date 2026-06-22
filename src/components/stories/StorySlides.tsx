import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Defs, RadialGradient, Rect, Stop, SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_HEART, ICON_SHARE} from '../../assets/icons';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

const MARGIN = 24;

type SlideProps = {onCta: () => void; onReady?: () => void};

// Slides set their root to `box-none` and every non-interactive layer to
// `none`, so taps on empty areas fall through to the viewer's nav zones while
// CTAs keep capturing their own presses.

// ── Slide 1 — quote over a photo ──────────────────────────────────────────────
function QuoteSlide({onReady}: SlideProps) {
  const {top} = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Image
        source={require('../../assets/images/stories/story1-bg.png')}
        style={StyleSheet.absoluteFill as any}
        resizeMode="cover"
        onLoad={onReady}
      />
      <View style={[styles.quoteColumn, {top: top + 113}]}>
        <Image
          source={require('../../assets/images/stories/story1-quote-card.png')}
          style={styles.quotePhoto}
          resizeMode="cover"
        />
        <View style={styles.quoteText}>
          <Text style={styles.quoteMark}>“</Text>
          <Text style={styles.h2}>
            Интерес – это голос высшего “Я”, ведущий к призванию
          </Text>
          <Text style={styles.author}>Михаил Агеев</Text>
        </View>
      </View>
    </View>
  );
}

// ── Slide 2 — "Духовный завтрак", full-bleed photo + CTA ──────────────────────
function MorningSlide({onCta, onReady}: SlideProps) {
  const {top, bottom} = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Image
          source={require('../../assets/images/stories/story2-bg.png')}
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
          onLoad={onReady}
        />
      </View>
      <Text style={[styles.title, {top: top + 97}]} pointerEvents="none">
        Духовный завтрак
      </Text>
      <View style={[styles.centerBlock, {top: top + 319}]} pointerEvents="none">
        <Text style={styles.body}>
          То, как вы определяете себя в начале дня, создаёт события вашей
          реальности. Спросите себя:
        </Text>
        <Text style={styles.h1Mid}>Кто ты сегодня?</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onCta}
        style={[styles.cta, {bottom: bottom + 34}]}>
        <Text style={styles.ctaText}>Начать практику</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Slide 3 — "Аффирмация дня", full-bleed photo + heart/share ────────────────
function AffirmationSlide({onReady}: SlideProps) {
  const {top} = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Image
        source={require('../../assets/images/stories/story3-bg.png')}
        style={StyleSheet.absoluteFill as any}
        resizeMode="cover"
        onLoad={onReady}
      />
      <Text style={[styles.title, {top: top + 97}]}>Аффирмация дня</Text>
      <View style={[styles.centerBlock, {top: top + 297}]}>
        <Text style={styles.h1}>
          Я доверяю жизни и чувствую поддержку в каждом шаге
        </Text>
        <View style={styles.iconRow}>
          <SvgXml xml={ICON_HEART} width={24} height={24} />
          <SvgXml xml={ICON_SHARE} width={24} height={24} />
        </View>
      </View>
    </View>
  );
}

// ── Slide 4 — "Сегодня можно начать с малого", portrait + CTA ─────────────────
function StartSmallSlide({onCta, onReady}: SlideProps) {
  const {top} = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Image
        source={require('../../assets/images/stories/story4-bg.png')}
        style={StyleSheet.absoluteFill as any}
        resizeMode="cover"
        onLoad={onReady}
      />
      {/* Soft radial halo behind the figure (Figma: radial gradient with a
          140px blur). Rendered as an svg radial gradient that fades to
          transparent so it reads as a glow, not a hard-edged disc. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="story4Glow" cx="50%" cy="42%" rx="52%" ry="42%">
            <Stop offset="0" stopColor="#7BC4F3" stopOpacity="0.45" />
            <Stop offset="0.55" stopColor="#7BC4F3" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#7BC4F3" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#story4Glow)" />
      </Svg>
      <View
        style={[styles.startColumn, {top: top + 103}]}
        pointerEvents="box-none">
        <Image
          source={require('../../assets/images/stories/story4-portrait.png')}
          style={styles.portrait}
          resizeMode="cover"
        />
        <Text style={[styles.h2, styles.startTitle]}>
          Сегодня можно начать с малого
        </Text>
        <Text style={[styles.body, styles.startBody]}>
          Начните путь к лучшей версии себя – через практики, осознанность и
          заботу о своём внутреннем состоянии.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCta}
          style={styles.ctaInline}>
          <Text style={styles.ctaText}>Все практики</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export type StorySlide = {
  key: string;
  // Whether the viewer's top-right circular share button is shown for this slide.
  headerShare: boolean;
  Component: (p: SlideProps) => React.JSX.Element;
};

export const STORY_SLIDES: StorySlide[] = [
  {key: 'quote', headerShare: true, Component: QuoteSlide},
  {key: 'morning', headerShare: true, Component: MorningSlide},
  {key: 'affirmation', headerShare: false, Component: AffirmationSlide},
  {key: 'start', headerShare: true, Component: StartSmallSlide},
];

const styles = StyleSheet.create({
  // Slide 1 — absolute column (same pattern as the other slides; a flex
  // column here left the quote text unrendered on Fabric).
  quoteColumn: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    alignItems: 'center',
  },
  quotePhoto: {
    width: 342,
    height: 300,
    borderRadius: 20,
  },
  quoteText: {
    width: 344,
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  quoteMark: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 40,
    lineHeight: 40,
    color: colors.white,
  },
  author: {
    ...typography.bodyMedium,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },

  // Shared text
  title: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    ...typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
  },
  centerBlock: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    alignItems: 'center',
    gap: 24,
  },
  h1: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
  },
  h1Mid: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  h2: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
  },

  // Slide 4
  startColumn: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    alignItems: 'center',
  },
  portrait: {
    width: 150,
    height: 180,
    borderRadius: 16,
  },
  startTitle: {
    marginTop: 18,
  },
  startBody: {
    marginTop: 12,
    opacity: 0.65,
  },

  // CTA buttons
  cta: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    height: 52,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaInline: {
    alignSelf: 'stretch',
    marginTop: 24,
    height: 52,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.lighter,
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: {
    ...typography.button,
    fontSize: 15,
    color: colors.dark,
  },
});
