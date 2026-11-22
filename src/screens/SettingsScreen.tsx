import React, {useEffect} from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {Text} from '../components/Text';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_BACK, ICON_TEXT_SIZE} from '../assets/icons';
import {FixedHeader, useHeaderScrollPadding} from '../components/FixedHeader';
import {GradientBackground} from '../components/GradientBackground';
import {ToggleSwitch} from '../components/ToggleSwitch';
import {ReminderTime, TextSize, useAppSettings} from '../services/settings';
import {
  cancelDailyAffirmationNotifications,
  ensureDailyAffirmationNotifications,
  ensurePracticeReminders,
  hasNotificationPermission,
} from '../services/dailyNotifications';
import {track} from '../services/analytics';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {APP_ENV} from '../config/env';
import {
  getRegion,
  setRegionOverride,
  subscribeRegion,
} from '../services/mediaRegion';
import {useBackHandler} from '../hooks/useBackHandler';
import {
  describeDevice,
  uploadDiagnostics,
  DiagnosticsResult,
} from '../services/diagnosticsReport';

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
  useBackHandler(() => onBack());
  const {bottom} = useSafeAreaInsets();
  const scrollPad = useHeaderScrollPadding();
  const {settings, updateSettings} = useAppSettings();
  const t = useUIStrings();

  // Отчёт диагностики: состояние кнопки и код отправленного отчёта.
  const [diag, setDiag] = React.useState<
    {status: 'idle' | 'sending'} | ({status: 'done'} & DiagnosticsResult)
  >({status: 'idle'});
  const sendDiagnostics = async () => {
    if (diag.status === 'sending') return;
    setDiag({status: 'sending'});
    const res = await uploadDiagnostics('manual');
    setDiag({status: 'done', ...res});
  };

  // Регион медиа (QA-тумблер): перерисовываем экран при смене источника.
  const [region, setRegion] = React.useState(getRegion());
  useEffect(() => subscribeRegion(() => setRegion(getRegion())), []);

  // Появление и закрытие анимирует обёртка <Presented> в App.tsx.

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
    ensurePracticeReminders();
  }

  return (
    <View style={styles.fadeRoot}>
      <GradientBackground>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {paddingTop: scrollPad, paddingBottom: bottom + 40},
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.cards}>
            {/* Уведомления */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t('settings_notifications_title', 'Уведомления')}
              </Text>
              <View style={styles.cardBody}>
                {/* Аффирмация дня в 9:00 — включена по умолчанию; тумблер
                  управляет реальным расписанием локальных уведомлений. */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>
                    {t('settings_daily_affirmation', 'Аффирмация дня в 9:00')}
                  </Text>
                  <ToggleSwitch
                    value={settings.dailyAffirmationEnabled}
                    onChange={v => {
                      updateSettings({dailyAffirmationEnabled: v});
                      track('daily_affirmation_toggle', {enabled: v});
                      if (v) {
                        // Отказ в системном диалоге — тумблер возвращается в
                        // «выкл», чтобы не показывать включённым то, что не
                        // будет работать.
                        ensureDailyAffirmationNotifications(true)
                          .then(hasNotificationPermission)
                          .then(ok => {
                            if (!ok)
                              updateSettings({dailyAffirmationEnabled: false});
                          });
                      } else {
                        cancelDailyAffirmationNotifications();
                      }
                    }}
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>
                    {t('settings_reminders_label', 'Напоминания о практике')}
                  </Text>
                  <ToggleSwitch
                    value={settings.remindersEnabled}
                    onChange={v => {
                      updateSettings({remindersEnabled: v});
                      track('practice_reminders_toggle', {enabled: v});
                      // Отказ в системном диалоге — тумблер возвращается в «выкл».
                      ensurePracticeReminders(v)
                        .then(hasNotificationPermission)
                        .then(ok => {
                          if (v && !ok)
                            updateSettings({remindersEnabled: false});
                        });
                    }}
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
                {/* Масштаб применяется к тексту аффирмаций и плеера — пишем
                  это прямо, чтобы не казалось, что настройка не работает. */}
                <Text style={styles.rowHint}>
                  {t(
                    'settings_text_size_hint',
                    'Меняет размер текста во всём приложении',
                  )}
                </Text>
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

            {/* Диагностика: отчёт с журналом → Firestore `diagnostics`. */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t('settings_diag_title', 'Диагностика')}
              </Text>
              <Text style={styles.rowHint}>
                {t(
                  'settings_diag_hint',
                  'Если практики не играют — отправьте отчёт и назовите нам код.',
                )}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={sendDiagnostics}
                disabled={diag.status === 'sending'}
                style={[styles.chip, styles.diagBtn]}>
                <Text style={styles.chipText}>
                  {diag.status === 'sending'
                    ? t('settings_diag_sending', 'Отправляем…')
                    : t('settings_diag_send', 'Отправить отчёт')}
                </Text>
              </TouchableOpacity>
              {diag.status === 'done' && (
                <Text style={styles.rowHint}>
                  {diag.ok
                    ? `${t('settings_diag_sent', 'Отправлено · код')} ${
                        diag.code
                      }`
                    : `${t('settings_diag_failed', 'Не удалось отправить')} (${
                        diag.error ?? ''
                      })`}
                </Text>
              )}
              <Text style={styles.envBadge}>{describeDevice()}</Text>
            </View>

            {APP_ENV !== 'prod' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>QA: источник медиа</Text>
                <View style={styles.chipsRow}>
                  {(
                    [
                      ['ru', '🇷🇺 Россия (зеркало)'],
                      ['world', '🌍 Мир (Cloudflare R2)'],
                    ] as const
                  ).map(([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      active={region === value}
                      onPress={() => setRegionOverride(value)}
                    />
                  ))}
                </View>
                <Text style={styles.envBadge}>
                  {`Окружение: ${APP_ENV.toUpperCase()} · регион: ${region}`}
                </Text>
              </View>
            )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  fadeRoot: {flex: 1},
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

  envBadge: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 16,
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
    // Тень только на iOS: android-elevation просвечивает сквозь
    // полупрозрачную карточку белёсым ореолом.
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
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
  rowHint: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.7,
    marginTop: 6,
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
  diagBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 6,
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
