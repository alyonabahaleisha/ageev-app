import {Platform} from 'react-native';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {collection, doc, getDoc, getDocs} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {
  affirmationDocsToByKey,
  buildAffirmationList,
  AreaDoc,
} from './affirmations';
import {ReminderTime, settingsReady} from './settings';
import {uiString} from './uiStrings';

// Ежедневный пуш с аффирмацией в 9:00 локального времени. Без сервера:
// при каждом запуске приложение перепланирует локальные уведомления на месяц
// вперёд. Текст дня — аффирмация из сторис (dailyStories → storyAffirmations),
// если админ её запланировал; иначе — «мысль на сегодня» из общей библиотеки
// (тот же детерминированный ротатор, что и карточка на главной).

const ID_PREFIX = 'daily-aff-';
const DAYS_AHEAD = 30;
const FIRE_HOUR = 9;

function dateKey(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function fetchLibrary() {
  const [affSnap, areasSnap] = await Promise.all([
    getDocs(collection(db, 'affirmations')),
    getDocs(collection(db, 'lifeAreas')),
  ]);
  const areas: Record<string, AreaDoc> = {};
  areasSnap.docs.forEach(d => {
    areas[d.id] = d.data() as AreaDoc;
  });
  return buildAffirmationList(affirmationDocsToByKey(affSnap.docs), areas);
}

/** Тексты сторис-аффирмаций по датам (только для дней, настроенных в CMS). */
async function fetchStoryTexts(
  keys: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  await Promise.all(
    keys.map(async key => {
      const daySnap = await getDoc(doc(db, 'dailyStories', key));
      if (!daySnap.exists()) return;
      const day = daySnap.data() as {
        affirmationId?: string;
        affirmationText?: string;
      };
      let text = '';
      if (day.affirmationId) {
        const aff = await getDoc(
          doc(db, 'storyAffirmations', day.affirmationId),
        );
        if (aff.exists()) text = ((aff.data() as {text?: string}).text || '').trim();
      }
      if (!text) text = (day.affirmationText || '').trim();
      if (text) result[key] = text;
    }),
  );
  return result;
}

/**
 * Запросить разрешение и перепланировать уведомления на DAYS_AHEAD дней.
 * Вызывается на каждом старте приложения — так тексты подтягивают свежие
 * данные CMS, а расписание не истощается, пока приложением пользуются.
 */
export async function ensureDailyAffirmationNotifications(): Promise<void> {
  try {
    if (!(await settingsReady()).dailyAffirmationEnabled) {
      return;
    }
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
      return;
    }

    const channelId =
      Platform.OS === 'android'
        ? await notifee.createChannel({
            id: 'daily-affirmation',
            name: 'Ежедневная аффирмация',
            importance: AndroidImportance.DEFAULT,
          })
        : undefined;

    // Старое расписание под снос — тексты могли обновиться в CMS.
    const pending = await notifee.getTriggerNotificationIds();
    await Promise.all(
      pending
        .filter(id => id.startsWith(ID_PREFIX))
        .map(id => notifee.cancelTriggerNotification(id)),
    );

    const now = new Date();
    const dates: Date[] = [];
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + i,
        FIRE_HOUR,
        0,
        0,
      );
      if (d.getTime() > Date.now()) dates.push(d);
    }

    const [library, storyTexts] = await Promise.all([
      fetchLibrary().catch(() => []),
      fetchStoryTexts(dates.map(dateKey)).catch(
        () => ({} as Record<string, string>),
      ),
    ]);

    const title = uiString('notif_daily_title', 'Аффирмация на сегодня');
    for (const d of dates) {
      const key = dateKey(d);
      let body = storyTexts[key];
      let linkId: string | undefined;
      if (!body && library.length) {
        // Тот же ротатор, что dailyAffirmationIndex на главной: номер дня
        // (UTC) по модулю размера библиотеки.
        const idx =
          Math.floor(
            Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
          ) % library.length;
        body = library[idx].text;
        linkId = library[idx].id;
      }
      if (!body) continue;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: d.getTime(),
      };
      await notifee.createTriggerNotification(
        {
          id: ID_PREFIX + key,
          title,
          body,
          data: linkId ? {url: `ageev://affirmation/${linkId}`} : {},
          ios: {sound: 'default'},
          android: channelId
            ? {channelId, pressAction: {id: 'default'}}
            : undefined,
        },
        trigger,
      );
    }
  } catch (e) {
    console.log('FETCHCHECK notifications ERROR', (e as Error)?.message);
  }
}

/** Выключение тумблера в настройках: снять всё запланированное. */
export async function cancelDailyAffirmationNotifications(): Promise<void> {
  try {
    const pending = await notifee.getTriggerNotificationIds();
    await Promise.all(
      pending
        .filter(id => id.startsWith(ID_PREFIX))
        .map(id => notifee.cancelTriggerNotification(id)),
    );
  } catch {}
}

// ── Напоминания о практике (Настройки → Уведомления) ─────────────────────────
// Правки (Figma 489:11217): тумблер и чипы «Утро/День/Вечер» раньше ничего не
// планировали. Локальные уведомления на месяц вперёд, как у аффирмации дня.

const PRACTICE_PREFIX = 'practice-rem-';
const PRACTICE_HOURS: Record<ReminderTime, number> = {
  morning: 8,
  day: 14,
  evening: 20,
};

/** Перепланировать напоминания о практике по текущим настройкам. */
export async function ensurePracticeReminders(): Promise<void> {
  try {
    const appSettings = await settingsReady();
    // Старое расписание под снос в любом случае — настройки могли измениться.
    const pending = await notifee.getTriggerNotificationIds();
    await Promise.all(
      pending
        .filter(id => id.startsWith(PRACTICE_PREFIX))
        .map(id => notifee.cancelTriggerNotification(id)),
    );
    if (!appSettings.remindersEnabled || appSettings.reminderTimes.length === 0) {
      return;
    }
    const perm = await notifee.requestPermission();
    if (perm.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
      return;
    }

    const channelId =
      Platform.OS === 'android'
        ? await notifee.createChannel({
            id: 'practice-reminders',
            name: 'Напоминания о практике',
            importance: AndroidImportance.DEFAULT,
          })
        : undefined;

    const title = uiString('notif_practice_title', 'Время практики');
    const body = uiString(
      'notif_practice_body',
      'Уделите несколько минут себе — выберите практику на сегодня',
    );
    const now = new Date();
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      for (const time of appSettings.reminderTimes) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + i,
          PRACTICE_HOURS[time],
          0,
          0,
        );
        if (d.getTime() <= Date.now()) continue;
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: d.getTime(),
        };
        await notifee.createTriggerNotification(
          {
            id: `${PRACTICE_PREFIX}${dateKey(d)}-${time}`,
            title,
            body,
            ios: {sound: 'default'},
            android: channelId
              ? {channelId, pressAction: {id: 'default'}}
              : undefined,
          },
          trigger,
        );
      }
    }
  } catch (e) {
    console.log('FETCHCHECK practice reminders ERROR', (e as Error)?.message);
  }
}

