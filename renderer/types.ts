import type { i18n as I18nInstanceType } from 'i18next'; // ✅ Importer le type

// Type pour les données d'hydratation du store i18next
// C'est une structure imbriquée: { langue: { namespace: { clé: valeur } } }
type InitialI18nStoreData = {
  [lang: string]: {
    [ns: string]: {
      [key: string]: string;
    };
  };
};

declare global {
  namespace Vike {
    interface PageContext {
      Page: () => React.ReactElement
      data?: {
        /** Value for <title> defined dynamically by by /pages/some-page/+data.js */
        title?: string
        /** Value for <meta name="description"> defined dynamically */
        description?: string
      }
      config: {
        /** Value for <title> defined statically by /pages/some-page/+title.js (or by `export default { title }` in /pages/some-page/+config.js) */
        title?: string
        /** Value for <meta name="description"> defined statically */
        description?: string
      }
      /** https://vike.dev/render */
      abortReason?: string
      i18nInstance?: I18nInstanceType; // ✅ Type de l'instance

      /**
       * Les traductions chargées côté serveur pour l'hydratation client.
       */
      initialI18nStore?: InitialI18nStoreData; // ✅ Type pour les données du store

      /**
       * La langue détectée et utilisée pour le rendu SSR.
       */
      initialLanguage?: string; // ✅ Type pour la langue initiale
      lang:string,

      // App urls
      serverUrl: string,
      serverApiUrl:string,
      apiUrl: string,
      baseUrl:string
    }
  }
}

// Tell TypeScript this file isn't an ambient module
export {}
