// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // Détecteur client
import HttpBackend from 'i18next-http-backend'; // Backend client
import { localDir } from '../server/root.js'; // Pour le chemin serveur
import { DEFAULT_LANG } from './constants.js';
// import { isServer } from '../renderer/utils/isServer'; // Fonction utilitaire (à créer)

// Langues supportées et langue par défaut
export const supportedLngs = ['fr', 'en'];
export const defaultLng = 'fr';

// Fonction utilitaire pour savoir si on est côté serveur
// src/renderer/utils/isServer.ts
export const isServer = typeof window === 'undefined';

// Charger FSBackend dynamiquement via require UNIQUEMENT côté serveur
let BackendAdapter: any; // Utiliser 'any' pour le type dynamique
if (isServer) {
    try {
        BackendAdapter = require('i18next-fs-backend/cjs');
        // OU essaie le chemin relatif si le premier ne marche pas:
        // BackendAdapter = require('../../node_modules/i18next-fs-backend/cjs/index.js');
    } catch (err) {
        console.error("Failed to require i18next-fs-backend:", err);
        // Gérer l'erreur si nécessaire (peut-être lancer une erreur fatale)
        process.exit(1);
    }
} else {
    BackendAdapter = HttpBackend; // Utiliser HttpBackend côté client
}


i18n
  // Détecteur de langue (client seulement)
  // Détecte depuis: cookie, localStorage, navigator, querystring, htmlTag, path, subdomain
  //@ts-ignore
  .use(BackendAdapter) // Choisir le backend approprié
  .use(LanguageDetector) // Utiliser SEULEMENT côté client
  .use(initReactI18next) // Passes i18n instance à react-i18next.
  .init({
    // -- Configuration Générale --
    supportedLngs: supportedLngs,
    fallbackLng: defaultLng,
    ns: ['translation'], // Namespace(s) de tes fichiers JSON
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React le fait déjà
    },
    // debug: !isProduction, // Activer logs en dev
    detection: { // Options pour i18next-browser-languagedetector (client)
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'], // Où mettre en cache la langue choisie
      lookupCookie: 'user_lang', // Nom du cookie
      lookupLocalStorage: 'lang', // Nom de l'item localStorage
      cookieMinutes: 60 * 24 * 30, // Durée du cookie (30 jours)
      cookieOptions: { path: '/' }, // Portée du cookie
      convertDetectedLanguage(lng) {
        console.log({lng});
        
        return lng ||DEFAULT_LANG
      },// checkWhitelist: true // 
    },

    // -- Configuration Backend (Serveur vs Client) --
    backend: isServer
      ? { // Options pour i18next-fs-backend (Serveur)
        loadPath: `${localDir}/public/locales/{{lng}}/{{ns}}.json`, // Chemin ABSOLU vers les fichiers
      }
      : { // Options pour i18next-http-backend (Client)
        loadPath: '/locales/{{lng}}/{{ns}}.json', // URL relative (servie par Express/Sirv)
      },

    // Important pour SSR:
    // Ne pas définir 'lng' ici, il sera défini par requête sur le serveur
    // ou via les données d'hydratation sur le client.
    // initImmediate: false // Déprécié en faveur de l'attente de l'init
  });


export default i18n;