import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DocumentData,
  DocumentReference,
  Query,
  Unsubscribe,
  onSnapshot,
} from 'firebase/firestore';
import {APP_ENV} from '../config/env';

// Дисковый кэш контента: веб-SDK Firestore в RN не имеет offline-persistence,
// поэтому холодный старт без сети давал пустые экраны. Здесь: мгновенная
// выдача последнего снапшота из AsyncStorage + живая подписка поверх
// (тот же паттерн, что вручную сделан в clubs.ts).
//
// Ключи скоупятся окружением: dev-переключение .env не должно показывать
// QA-контент в прод-сборке и наоборот.
const PREFIX = `contentCache:v1:${APP_ENV}:`;

/**
 * Подписка на коллекцию с кэшем. Контент-доки целиком JSON-сериализуемы
 * (строки/числа/массивы — Timestamp в контенте не используется); появись
 * несериализуемое поле, кэш просто молча не запишется.
 *
 * `onError` получает hasData: true — данные уже показаны (кэш или живые),
 * ошибку можно не показывать пользователю.
 */
export function subscribeCachedQuery<T extends {id: string}>(
  key: string,
  q: Query,
  onDocs: (docs: T[]) => void,
  onError?: (message: string, hasData: boolean) => void,
): Unsubscribe {
  let hasData = false;
  AsyncStorage.getItem(PREFIX + key)
    .then(raw => {
      if (!raw || hasData) {
        return;
      }
      const cached = JSON.parse(raw) as T[];
      if (Array.isArray(cached) && !hasData) {
        hasData = true;
        onDocs(cached);
      }
    })
    .catch(() => {});
  return onSnapshot(
    q,
    snapshot => {
      const docs = snapshot.docs.map(
        d => ({id: d.id, ...d.data()}) as T,
      );
      hasData = true;
      onDocs(docs);
      AsyncStorage.setItem(PREFIX + key, JSON.stringify(docs)).catch(() => {});
    },
    err => {
      console.log(`FETCHCHECK ${key} ERROR`, err.message);
      onError?.(err.message, hasData);
    },
  );
}

/** То же для одиночного документа (config/ui_strings и т.п.). */
export function subscribeCachedDoc<T extends DocumentData>(
  key: string,
  ref: DocumentReference,
  onData: (data: T | null) => void,
  onError?: (message: string, hasData: boolean) => void,
): Unsubscribe {
  let hasData = false;
  AsyncStorage.getItem(PREFIX + key)
    .then(raw => {
      if (!raw || hasData) {
        return;
      }
      const cached = JSON.parse(raw) as T;
      if (!hasData) {
        hasData = true;
        onData(cached);
      }
    })
    .catch(() => {});
  return onSnapshot(
    ref,
    snap => {
      const data = (snap.data() as T | undefined) ?? null;
      hasData = true;
      onData(data);
      if (data) {
        AsyncStorage.setItem(PREFIX + key, JSON.stringify(data)).catch(
          () => {},
        );
      }
    },
    err => {
      console.log(`FETCHCHECK ${key} ERROR`, err.message);
      onError?.(err.message, hasData);
    },
  );
}
