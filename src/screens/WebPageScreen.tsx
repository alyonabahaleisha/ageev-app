import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_BACK} from '../assets/icons';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {useBackHandler} from '../hooks/useBackHandler';
import {useHideMiniPlayer} from '../context/PlayerContext';
import {useUIStrings} from '../services/uiStrings';

type Props = {
  url: string;
  title: string;
  onBack: () => void;
};

// Простой встроенный браузер: шапка «назад + заголовок» и WebView на весь
// экран. Используется для Донейшн и прочих внешних страниц, которые должны
// открываться внутри приложения.
export function WebPageScreen({url, title, onBack}: Props) {
  const {top} = useSafeAreaInsets();
  const t = useUIStrings();
  const webRef = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const [failed, setFailed] = useState(false);
  const [webKey, setWebKey] = useState(0);
  // Мини-бар перекрывал бы верх страницы сайта.
  useHideMiniPlayer();

  // Системное «назад»: сначала история страницы, потом закрытие экрана.
  useBackHandler(() => {
    if (canGoBack.current && !failed) {
      webRef.current?.goBack();
      return;
    }
    onBack();
  });

  function retry() {
    setFailed(false);
    canGoBack.current = false;
    setWebKey(k => k + 1);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, {paddingTop: top + 7}]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backBtn}>
          <SvgXml xml={ICON_BACK} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>
      {failed ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>
            {t('web_error', 'Не удалось загрузить страницу. Проверьте подключение к интернету.')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={retry}
            style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('common_retry', 'Повторить')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          key={webKey}
          ref={webRef}
          source={{uri: url}}
          style={styles.web}
          startInLoadingState
          // Кэш: повторное открытие не качает заново статику страницы.
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          onNavigationStateChange={nav => {
            canGoBack.current = nav.canGoBack;
          }}
          onError={() => setFailed(true)}
          // На Android onHttpError приходит только для основного документа
          // страницы, не для картинок и скриптов внутри неё.
          onHttpError={e => {
            if (e.nativeEvent.statusCode >= 400) {
              setFailed(true);
            }
          }}
          // Процесс рендера убит системой — пересоздаём WebView, а не
          // оставляем мёртвую в дереве.
          onRenderProcessGone={() => retry()}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  web: {
    flex: 1,
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.white,
  },
  errorText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  retryText: {
    ...typography.body,
    color: colors.white,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
