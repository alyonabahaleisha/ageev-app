import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_PLAY_POLYGON} from '../assets/icons';
import {GradientBackground} from '../components/GradientBackground';
import LinearGradient from '../components/LinearGradient';
import {PrimaryButton} from '../components/PrimaryButton';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const {width: SCREEN_W} = Dimensions.get('window');
const COVER_SIZE = SCREEN_W - SECTION_MARGIN * 2; // 342 на макете 390

type Props = {
  onStart: () => void;
  onSignIn: () => void;
};

/** Welcome (Figma 411:6531) — первый запуск: обложка, приветствие, Начать. */
export function WelcomeScreen({onStart, onSignIn}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const t = useUIStrings();

  return (
    <GradientBackground>
      <View style={[styles.content, {paddingTop: top + 25, paddingBottom: bottom + 34}]}>
        {/* Видео-обложка с кнопкой play */}
        <View style={styles.coverGlow}>
          <View style={styles.coverCard}>
            <Image
              source={require('../assets/images/welcome-cover.jpg')}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                'rgba(8,21,32,0.02)',
                'rgba(13,34,51,0.04)',
                'rgba(13,34,51,0.08)',
                'rgba(8,21,32,0.18)',
              ]}
              locations={[0, 0.21, 0.49, 1]}
              start={{x: 0, y: 0}}
              end={{x: 0.7, y: 1}}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.playButton}>
              <SvgXml xml={ICON_PLAY_POLYGON} width={18} height={21} />
            </View>
          </View>
        </View>

        {/* Приветствие */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            {t('welcome_title', 'Добро пожаловать')}
          </Text>
          <Text style={styles.subtitle}>
            {t(
              'welcome_subtitle',
              'Пространство для спокойствия и внутреннего баланса.',
            )}
          </Text>
        </View>

        {/* Кнопки */}
        <View style={styles.buttons}>
          <PrimaryButton
            title={t('welcome_start', 'Начать')}
            onPress={onStart}
            style={styles.startButton}
          />
          <View style={styles.signInRow}>
            <Text style={styles.signInText}>
              {t('welcome_registered', 'Уже зарегистрированы? ')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onSignIn}
              style={styles.linkHit}>
              <Text style={styles.link}>{t('welcome_signin', 'Войти')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SECTION_MARGIN,
    alignItems: 'center',
  },
  // Голубое свечение позади обложки (эллипс с blur 110 в макете)
  coverGlow: {
    shadowColor: colors.brand.lighter,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 55,
    elevation: 12,
  },
  coverCard: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.dark,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4, // оптическое центрирование треугольника
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 32,
  },
  textBlock: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    width: 252,
  },
  buttons: {
    marginTop: 'auto',
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
  },
  startButton: {
    alignSelf: 'stretch',
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signInText: {
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
});
