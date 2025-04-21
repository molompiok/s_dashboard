// server/index.ts
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser'; // ✅ Importer cookie-parser
import { renderPage, createDevMiddleware } from 'vike/server';
import { localDir, root } from './root.js';
import { DEFAULT_LANG } from "../Lib/constants.js";
import { handle } from 'i18next-http-middleware'; // ✅ Importer le middleware i18next
import i18next, { supportedLngs, defaultLng } from '../Lib/i18n.js'; // ✅ Importer les langues supportées

const isProduction = process.env.NODE_ENV === 'production';

startServer();

async function startServer() {
  const app = express();

  app.use(compression());
  app.use(cookieParser()); // ✅ Utiliser cookie-parser AVANT le middleware i18next

  // Middleware i18next pour la détection de langue côté serveur
  // Il va lire 'Accept-Language' et le cookie ('user_lang' ici)
  app.use((req, res, next) => {
    req.cookies = req.cookies||{}
    req.cookies['user_lang'] = req.cookies['user_lang']|| DEFAULT_LANG
    next();
  });

  app.use(handle(i18next, {
    // Optionnel: Ignorer certaines routes (ex: /assets)
    // ignoreRoutes: ["/favicon.ico", "/assets/"],
    // Optionnel: Forcer la suppression du q-factor des langues
    // removeLngFromUrl: false // Garder à false par défaut
  }));


  // Vite integration (inchangé)
  if (isProduction) {
    const sirv = (await import('sirv')).default;
    // Servir les locales statiquement pour le client
    app.use(sirv(`${root}/dist/client`)); // Assurez-vous que 'public/locales' est copié dans 'dist/client/locales'
  } else {
    const { devMiddleware } = await createDevMiddleware({ root });
    app.use(devMiddleware);
    // Servir les locales depuis public en dev
    const sirv = (await import('sirv')).default;
    app.use(sirv(`${root}/public`));
  }


  // Route pour les assets statiques (inchangée)
  app.get("/res/*", async (req, res) => {
    const url = localDir + "/public" + req.originalUrl;
    res.sendFile(url);
  });

  // Middleware Vike (catch-all)
  app.get('*', async (req, res, next) => { // Ajout de next
    // req.i18n est maintenant disponible grâce au middleware i18next
    // Il contient l'instance i18n initialisée avec la langue détectée pour CETTE requête
    const currentI18nInstance = req.i18n;

    // S'assurer que la langue détectée est supportée, sinon fallback
    let detectedLng = currentI18nInstance.language || defaultLng;
    if (!supportedLngs.includes(detectedLng)) {
      detectedLng = defaultLng;
      // Changer la langue DANS l'instance de la requête actuelle
      await currentI18nInstance.changeLanguage(detectedLng);
    }
    console.log(`[SSR] Detected/Using language: ${detectedLng}`);


    const pageContextInit = {
      urlOriginal: req.originalUrl,
      headersOriginal: req.headers,
      // ✅ Passer l'instance i18n et les données initiales au contexte Vike
      i18nInstance: currentI18nInstance,
      initialI18nStore: currentI18nInstance.store.data, // Les traductions chargées
      initialLanguage: detectedLng, // La langue utilisée pour le rendu
    };

    let pageContext;
    try {
      pageContext = await renderPage(pageContextInit);
    } catch (err) {
      // Gérer les erreurs de rendu Vike
      console.error("Vike renderPage error:", err);
      return next(err); // Passer à un gestionnaire d'erreurs Express si configuré
    }


    if (pageContext.errorWhileRendering) {
      console.error("Vike errorWhileRendering:", pageContext.errorWhileRendering);
      // Install error tracking here
    }

    const { httpResponse } = pageContext;
    if (!httpResponse) {
      // Si Vike ne gère pas la route, passer au middleware suivant (ou 404)
      return next();
    }

    // Envoyer la réponse (inchangé)
    if (res.writeEarlyHints) res.writeEarlyHints({ link: httpResponse.earlyHints.map((e) => e.earlyHintLink) });
    httpResponse.headers.forEach(([name, value]) => res.setHeader(name, value));
    res.status(httpResponse.statusCode);
    res.send(httpResponse.body);
  });

  const port = process.env.PORT || 3005;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}