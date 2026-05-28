import 'intl-pluralrules';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import cs from '@/locales/cs.json';
import en from '@/locales/en.json';

const supportedLngs = ['cs', 'en'] as const;
type Lng = (typeof supportedLngs)[number];

function detectInitialLng(): Lng {
  const deviceLocale = getLocales()[0];
  const code = deviceLocale?.languageCode;
  if (code === 'cs' || code === 'sk') return 'cs'; // SK speakers OK with CZ
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    cs: { translation: cs },
    en: { translation: en },
  },
  lng: detectInitialLng(),
  fallbackLng: 'en',
  supportedLngs: [...supportedLngs],
  interpolation: {
    escapeValue: false, // React escapes itself
  },
  returnNull: false,
  compatibilityJSON: 'v4', // ICU plural CLDR (CZ: one/few/other)
});

// Register custom formatters for `{{value, currency}}` / `{{value, date-short}}` usage.
// API change in i18next v26 — formatters registered via services.formatter.add()
// instead of the deprecated `interpolation.format` callback.
i18n.services.formatter?.add('currency', (value, lng) => {
  return new Intl.NumberFormat(lng === 'cs' ? 'cs-CZ' : 'en-US', {
    style: 'currency',
    currency: lng === 'cs' ? 'CZK' : 'USD',
    maximumFractionDigits: 0,
  }).format(value as number);
});

i18n.services.formatter?.add('date-short', (value, lng) => {
  return new Intl.DateTimeFormat(lng === 'cs' ? 'cs-CZ' : 'en-US', {
    dateStyle: 'short',
  }).format(new Date(value as string | number | Date));
});

export default i18n;
