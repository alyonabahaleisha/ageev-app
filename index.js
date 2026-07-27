/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import { Linking } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Тап по уведомлению, когда приложение в фоне: диплинк из data.url уходит в
// обычный обработчик ссылок (App.tsx), когда приложение поднимется.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS && detail.notification?.data?.url) {
    Linking.openURL(String(detail.notification.data.url)).catch(() => {});
  }
});

AppRegistry.registerComponent(appName, () => App);
