import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ptBR from './pt-BR';
import enUS from './en-US';

const LANGUAGE_KEY = '@pettinder_language';

export async function getStoredLanguage(): Promise<string> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return lang ?? 'pt-BR';
  } catch {
    return 'pt-BR';
  }
}

export async function setStoredLanguage(lang: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
}

// Initialize synchronously with default language, then switch to stored language asynchronously.
// Components re-render automatically when i18n.changeLanguage() resolves.
i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': ptBR,
    'en-US': enUS,
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

getStoredLanguage().then((lang) => {
  if (lang !== i18n.language) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;
