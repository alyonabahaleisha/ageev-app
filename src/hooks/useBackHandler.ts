import {createContext, useContext, useEffect, useRef} from 'react';
import {BackHandler} from 'react-native';

/**
 * Вкладки в App.tsx не размонтируются при переключении (только прячутся),
 * поэтому вложенные экраны неактивной вкладки не должны перехватывать «назад».
 * App оборачивает каждую вкладку в провайдер со значением «вкладка активна».
 */
export const BackHandlerActiveContext = createContext(true);

/**
 * Системная кнопка / жест «Назад» на Android.
 *
 * BackHandler вызывает подписчиков в обратном порядке подписки, поэтому экран,
 * открытый последним (верхний оверлей), получает «назад» первым. Подписка
 * создаётся только при смене `enabled`: обработчик хранится в ref, чтобы
 * повторные рендеры не переносили экран наверх стека.
 *
 * handler возвращает false, если не обработал нажатие (тогда оно уходит
 * следующему экрану); undefined/void считается обработанным.
 */
export function useBackHandler(
  handler: () => boolean | void,
  enabled: boolean = true,
) {
  const ref = useRef(handler);
  ref.current = handler;
  const active = useContext(BackHandlerActiveContext) && enabled;

  useEffect(() => {
    if (!active) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const res = ref.current();
      return res !== false;
    });
    return () => sub.remove();
  }, [active]);
}
