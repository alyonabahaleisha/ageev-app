import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_BACK, ICON_TEXT_SIZE} from '../assets/icons';
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
import {GradientBackground} from '../components/GradientBackground';
import {ToggleSwitch} from '../components/ToggleSwitch';
import {
  ReminderTime,
  TextSize,
  useAppSettings,
} from '../services/settings';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const BTN_SIZE = 34;

type Props = {onBack: () => void};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** Настройки (Figma 448:10501). */
export function SettingsScreen({onBack}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const {settings, updateSettings} = useAppSettings();
  const t = useUIStrings();

  const reminderTimes: {key: ReminderTime; label: string}[] = [
    {key: 'morning', label: t('settings_reminder_morning', 'Утро')},
    {key: 'day', label: t('settings_reminder_day', 'День')},
    {key: 'evening', label: t('settings_reminder_evening', 'Вечер')},
  ];
  const textSizes: {key: TextSize; label: string}[] = [
    {key: 'small', label: t('settings_text_small', 'Маленький')},
    {key: 'standard', label: t('settings_text_standard', 'Стандарт')},
    {key: 'large', label: t('settings_text_large', 'Крупный')},
  ];

  function toggleReminderTime(key: ReminderTime) {
    const times = settings.reminderTimes.includes(key)
      ? settings.reminderTimes.filter(x => x !== key)
      : [...settings.reminderTimes, key];
    updateSettings({reminderTimes: times});
  }

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {paddingTop: headerScrollPadding(top), paddingBottom: bottom + 40},
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.cards}>
          {/* Уведомления */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t('settings_notifications_title', 'Уведомления')}
            </Text>
            <View style={styles.cardBody}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {t('settings_reminders_label', 'Напоминания о практике')}
                </Text>
                <ToggleSwitch
                  value={settings.remindersEnabled}
                  onChange={v => updateSettings({remindersEnabled: v})}
                />
              </View>
              <View
                style={[
                  styles.subBlock,
                  !settings.remindersEnabled && styles.dimmed,
                ]}
                pointerEvents={settings.remindersEnabled ? 'auto' : 'none'}>
                <Text style={styles.rowLabel}>
                  {t('settings_reminders_when', 'Когда напоминать:')}
                </Text>
                <View style={styles.chipsRow}>
                  {reminderTimes.map(rt => (
                    <Chip
                      key={rt.key}
                      label={rt.label}
                      active={settings.reminderTimes.includes(rt.key)}
                      onPress={() => toggleReminderTime(rt.key)}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Интерфейс */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t('settings_interface_title', 'Интерфейс')}
            </Text>
            <View style={styles.cardBody}>
              <View style={styles.labelRow}>
                <SvgXml xml={ICON_TEXT_SIZE} width={19} height={11} />
                <Text style={styles.rowLabel}>
                  {t('settings_text_size', 'Размер текста')}
                </Text>
              </View>
              <View style={styles.chipsRow}>
                {textSizes.map(ts => (
                  <Chip
                    key={ts.key}
                    label={ts.label}
                    active={settings.textSize === ts.key}
                    onPress={() => updateSettings({textSize: ts.key})}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Ангел-помощник */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t('settings_angel_title', 'Ангел-помощник')}
            </Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                {t('settings_angel_label', 'Показывать на главном экране')}
              </Text>
              <ToggleSwitch
                value={settings.angelOnHome}
                onChange={v => updateSettings({angelOnHome: v})}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Шапка: назад + заголовок по центру */}
      <FixedHeader>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={styles.backBtn}>
            <SvgXml xml={ICON_BACK} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('settings_title', 'Настройки')}
          </Text>
          <View style={styles.backBtn} />
        </View>
      </FixedHeader>
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

  // ── Карточки настроек ─────────────────────────────────────────────────────
  cards: {
    marginTop: 14,
    marginHorizontal: SECTION_MARGIN,
    gap: 12,
  },
  card: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 16,
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
  cardTitle: {
    ...typography.bodyLarge,
    color: colors.white,
  },
  cardBody: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    ...typography.body,
    color: colors.white,
    flexShrink: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subBlock: {
    gap: 12,
  },
  dimmed: {
    opacity: 0.45,
  },

  // ── Чипы ──────────────────────────────────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  chipText: {
    ...typography.small,
    color: colors.white,
  },
  chipTextActive: {
    color: '#2C2C2C',
  },
});
