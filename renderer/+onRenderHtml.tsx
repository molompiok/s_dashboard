// renderer/+onRenderHtml.tsx
import ReactDOMServer from 'react-dom/server';
import { Layout } from './Layout';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import logoUrl from './logo.svg';
import type { OnRenderHtmlAsync } from 'vike/types';
import { getPageTitle } from './getPageTitle';
import { I18nextProvider } from 'react-i18next'; // ✅ Importer le Provider

const onRenderHtml: OnRenderHtmlAsync = async (pageContext): ReturnType<OnRenderHtmlAsync> => {
    const { Page, i18nInstance, initialI18nStore, initialLanguage } = pageContext; // ✅ Récupérer les props i18n

    if (!Page) throw new Error('My onRenderHtml() hook expects pageContext.Page to be defined');
    if (!i18nInstance) throw new Error('i18nInstance missing in pageContext'); // Sécurité

    // Rendre l'application en enveloppant avec I18nextProvider
    const pageHtml = ReactDOMServer.renderToString(
        <I18nextProvider i18n={i18nInstance}> {/* ✅ Envelopper avec le Provider */}
            <Layout pageContext={pageContext}>
                <Page />
            </Layout>
        </I18nextProvider>
    );

    const title = getPageTitle(pageContext);
    const desc = pageContext.data?.description || pageContext.config.description || 'Demo of using Vike';

    const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="${initialLanguage||'fr'}"> {/* ✅ Utiliser la langue initiale */}
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${desc}" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css"/>
        <title>${title}</title>
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
        {/* ✅ Injecter les données d'hydratation i18n */}
        <script>
          window.__INITIAL_I18N_STORE__ = ${dangerouslySkipEscape(JSON.stringify(initialI18nStore))};
          window.__INITIAL_LANGUAGE__ = '${initialLanguage||'fr'}';
        </script>
      </body>
    </html>`;

    return {
        documentHtml,
        pageContext: {
            // On peut passer d'autres choses si besoin
        }
    };
};