import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_BACK, ICON_CLOSE_PLAYER} from '../assets/icons';
import {GradientBackground} from '../components/GradientBackground';
import {PrimaryButton} from '../components/PrimaryButton';
import {WebPageScreen} from './WebPageScreen';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const BTN_SIZE = 34;

// Донейшн (Правки, Figma 489:11217 — «Нет этих окон, открывает ссылку на
// сайте»): нативная форма доброго пожертвования + экран «Спасибо». Сам платёж
// проходит на сайте школы (Тильда-форма) — после формы открывается встроенный
// браузер, по возврату показывается благодарность.

type Props = {onClose: () => void};

function Checkbox({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.checkTextWrap}>{children}</View>
    </TouchableOpacity>
  );
}

export function DonationScreen({onClose}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const t = useUIStrings();

  const [step, setStep] = useState<'form' | 'web' | 'thanks'>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('500');
  const [offerAgreed, setOfferAgreed] = useState(false);
  const [personalAgreed, setPersonalAgreed] = useState(false);
  const [error, setError] = useState('');

  const donateUrl = t(
    'profile_donation_url',
    'https://mikhail-ageev.ru/donate',
  );

  function openLink(url: string) {
    if (url) Linking.openURL(url).catch(() => {});
  }

  function handleSubmit() {
    if (!email.trim()) {
      setError(t('donation_error_email', 'Введите email'));
      return;
    }
    if (!Number(amount)) {
      setError(t('donation_error_amount', 'Введите сумму поддержки'));
      return;
    }
    if (!offerAgreed || !personalAgreed) {
      setError(
        t('donation_error_consent', 'Подтвердите согласие с условиями'),
      );
      return;
    }
    setError('');
    setStep('web');
  }

  if (step === 'web') {
    return (
      <WebPageScreen
        url={donateUrl}
        title={t('profile_tab_donation', 'Донейшн')}
        onBack={() => setStep('thanks')}
      />
    );
  }

  if (step === 'thanks') {
    return (
      <GradientBackground>
        <View style={[styles.thanksRoot, {paddingBottom: bottom + 40}]}>
          <View style={[styles.thanksHeader, {paddingTop: top + 7}]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.closeBtn}>
              <SvgXml xml={ICON_CLOSE_PLAYER} width={30} height={30} />
            </TouchableOpacity>
          </View>
          <View style={styles.thanksBody}>
            <Text style={styles.thanksTitle}>
              {t('donation_thanks_title', 'Спасибо за поддержку!')}
            </Text>
            <Text style={styles.thanksSubtitle}>
              {t('donation_thanks_subtitle', 'Вы помогаете школе развиваться.')}
            </Text>
            <PrimaryButton
              title={t('donation_thanks_button', 'Вернуться к практике')}
              onPress={onClose}
              style={styles.thanksButton}
            />
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: top + 7 + BTN_SIZE + 20, paddingBottom: bottom + 40},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            {t(
              'donation_intro',
              'Друзья, если вы хотите перевести донейшн в качестве благодарности, вы можете это сделать, указав любую сумму ниже.',
            )}
          </Text>

          <View style={styles.inputs}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('donation_first_name', 'Имя')}
              placeholderTextColor="rgba(255,255,255,0.65)"
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('donation_last_name', 'Фамилия')}
              placeholderTextColor="rgba(255,255,255,0.65)"
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TextInput
              value={email}
              onChangeText={v => setEmail(v.replace(/\s+/g, ''))}
              placeholder={t('donation_email', 'Адрес электронной почты')}
              placeholderTextColor="rgba(255,255,255,0.65)"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              {t('donation_amount_label', 'Введите сумму поддержки')}
            </Text>
            <TextInput
              value={amount}
              onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}
              style={styles.amountInput}
              keyboardType="number-pad"
              maxLength={7}
            />
            <Text style={styles.amountCurrency}>
              {t('donation_currency', 'руб.')}
            </Text>
          </View>

          <View style={styles.checks}>
            <Checkbox
              checked={offerAgreed}
              onToggle={() => setOfferAgreed(v => !v)}>
              <Text style={styles.checkText}>
                {t('donation_offer_prefix', 'Я согласен с условиями Оферты. С')}{' '}
                <Text
                  style={styles.checkLink}
                  onPress={() =>
                    openLink(
                      t(
                        'donation_offer_url',
                        'https://mikhail-ageev.ru/oferta-na-meroprijatija',
                      ),
                    )
                  }>
                  {t('donation_offer_link', 'Договором оферты')}
                </Text>{' '}
                {t('donation_offer_suffix', 'ознакомлен')}
              </Text>
            </Checkbox>
            <Checkbox
              checked={personalAgreed}
              onToggle={() => setPersonalAgreed(v => !v)}>
              <Text style={styles.checkText}>
                {t(
                  'donation_personal_prefix',
                  'Я согласен на обработку моих персональных данных. С',
                )}{' '}
                <Text
                  style={styles.checkLink}
                  onPress={() =>
                    openLink(
                      t(
                        'donation_personal_url',
                        'https://mikhail-ageev.ru/politika-obrabotki-personalnih-dannih',
                      ),
                    )
                  }>
                  {t(
                    'donation_personal_link',
                    'Политикой обработки персональных данных',
                  )}
                </Text>{' '}
                {t('donation_personal_suffix', 'ознакомлен')}
              </Text>
            </Checkbox>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            title={t('donation_submit', 'Отблагодарить')}
            onPress={handleSubmit}
          />
        </ScrollView>

        {/* Шапка: назад + заголовок */}
        <View
          style={[styles.header, {paddingTop: top + 7}]}
          pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.backBtn}>
            <SvgXml xml={ICON_BACK} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {t('profile_tab_donation', 'Донейшн')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t('donation_subtitle', '(добровольное пожертвование, подарок)')}
            </Text>
          </View>
          <View style={styles.backBtn} />
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SECTION_MARGIN,
    gap: 24,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SECTION_MARGIN,
  },
  backBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  intro: {
    ...typography.body,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 24,
  },
  inputs: {
    gap: 8,
  },
  input: {
    height: 52,
    paddingVertical: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.white,
    ...typography.body,
    color: colors.white,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountLabel: {
    ...typography.body,
    color: colors.white,
    flexShrink: 1,
  },
  amountInput: {
    minWidth: 72,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
  amountCurrency: {
    ...typography.body,
    color: colors.white,
  },
  checks: {
    gap: 14,
  },
  checkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.white,
  },
  checkmark: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
  },
  checkTextWrap: {
    flex: 1,
  },
  checkText: {
    ...typography.small,
    color: colors.white,
    opacity: 0.85,
  },
  checkLink: {
    ...typography.small,
    color: colors.brand.pale,
    textDecorationLine: 'underline',
  },
  error: {
    ...typography.small,
    color: '#FFB4A9',
    textAlign: 'center',
  },

  // ── Спасибо ───────────────────────────────────────────────────────────────
  thanksRoot: {
    flex: 1,
  },
  thanksHeader: {
    paddingHorizontal: SECTION_MARGIN,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thanksBody: {
    flex: 1,
    paddingHorizontal: SECTION_MARGIN,
    justifyContent: 'center',
    gap: 12,
  },
  thanksTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  thanksSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  thanksButton: {
    marginTop: 20,
  },
});
