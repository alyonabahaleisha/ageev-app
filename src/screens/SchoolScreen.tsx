import React from 'react';
import {
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
import {ICON_BACK} from '../assets/icons';
import {GradientBackground} from '../components/GradientBackground';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const BTN_SIZE = 34;

type Section = {title: string; body: string};

const INTRO =
  'Школа Михаила Агеева – это пространство практик для работы с внутренним ' +
  'состоянием и качеством жизни. Здесь человек учится лучше понимать себя и ' +
  'выстраивать более гармоничное состояние через регулярные практики.';

const SECTIONS: Section[] = [
  {
    title: 'Философия',
    body:
      'В основе школы – идея, что качество жизни начинается с внутреннего ' +
      'состояния. Развивая осознанность и внимание к себе, человек может ' +
      'менять своё восприятие, реакции и жизненный путь.',
  },
  {
    title: 'Подход',
    body:
      'Обучение строится через практику: медитации, упражнения и работу с ' +
      'состояниями. Основной фокус – не теория, а личный опыт и постепенное ' +
      'изменение внутреннего состояния.',
  },
  {
    title: 'Кто такой Михаил',
    body:
      'Михаил Агеев – основатель школы и автор системы практик по работе с ' +
      'состоянием и осознанностью. Более 17 лет он развивает направления ' +
      'психологии и духовных практик, объединяя их в единую систему.',
  },
];

const STATS: {value: string; label: string}[] = [
  {value: '>500', label: 'личных сессий'},
  {value: '>5000', label: 'учеников по всему миру'},
  {value: '>100', label: 'живых семинаров'},
];

type Props = {onBack: () => void};

export function SchoolScreen({onBack}: Props) {
  const {top, bottom} = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {paddingTop: top + 7 + BTN_SIZE + 20, paddingBottom: bottom + 130},
          ]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>{INTRO}</Text>

          <Image
            source={require('../assets/images/club-hero-0d641b.jpg')}
            style={styles.hero}
            resizeMode="cover"
          />

          {SECTIONS.map(section => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          <Image
            source={require('../assets/images/club-mikhail-04aa6f.png')}
            style={styles.portrait}
            resizeMode="cover"
          />

          <View style={styles.statsRow}>
            {STATS.map(stat => (
              <View key={stat.value} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.button}>
            <Text style={styles.buttonText}>Подробнее</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Fixed header overlay */}
        <View
          style={[styles.header, {paddingTop: top + 7}]}
          pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={styles.backBtn}>
            <SvgXml xml={ICON_BACK} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>О школе</Text>
          <View style={styles.backBtn} />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SECTION_MARGIN,
    gap: 24,
  },

  intro: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },

  section: {
    gap: 12,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  sectionBody: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
  },

  portrait: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    gap: 3,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
  },
  statLabel: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },

  button: {
    backgroundColor: colors.white,
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 14},
        shadowOpacity: 0.35,
        shadowRadius: 40,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    ...typography.button,
    color: colors.dark,
  },

  // ── Fixed header ──────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
});
