import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import * as en from "../src/locales/en/translation.json";
import * as fr from "../src/locales/fr/translation.json";
// Exemple de ressources de traduction
const resources = {
  en: {
    translation: en
  },
  fr: {
    translation: fr
  }
};

i18next
  .use(LanguageDetector) // Détecte la langue du navigateur
  .use(initReactI18next) // Intègre i18next avec React
  .init({
    resources,
    fallbackLng: 'en', // Langue par défaut si la détection échoue
    interpolation: {
      escapeValue: false // React gère déjà l'échappement
    }
  });

export default i18next;