import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Настройки приложения (Figma 448:10501): напоминания о практике, размер
// текста и ангел-помощник на главном экране. Общие для всех аккаунтов.

export type ReminderTime = 'morning' | 'day' | 'evening';
export type TextSize = 'small' | 'standard' | 'large';

export type AppSettings = {
  remindersEnabled: boolean;
  reminderTimes: ReminderTime[];
  textSize: TextSize;
  angelOnHome: boolean;
};

const DEFAULTS: AppSettings = {
  remindersEnabled: false,
  reminderTimes: ['morning'],
  textSize: 'standard',
  angelOnHome: true,
};

/** Множитель для длинных читаемых текстов (аффирмации, описания). */
export const TEXT_SCALES: Record<TextSize, number> = {
  small: 0.85,
  standard: 1,
  large: 1.2,
};

const KEY = 'app_settings_v1';

let settings: AppSettings = DEFAULTS;
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then(raw => {
    if (!raw) return;
    settings = {...DEFAULTS, ...JSON.parse(raw)};
    listeners.forEach(l => l());
  })
  .catch(() => {});

export function updateSettings(patch: Partial<AppSettings>) {
  settings = {...settings, ...patch};
  AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
  listeners.forEach(l => l());
}

export function useAppSettings() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick(t => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {settings, updateSettings};
}
