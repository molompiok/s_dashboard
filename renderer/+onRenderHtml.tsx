// https://vike.dev/onRenderHtml
export { onRenderHtml }
import i18next from "../Lib/i18n";
import ReactDOMServer from 'react-dom/server'
import { Layout } from './Layout'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import logoUrl from './logo.png'
import type { OnRenderHtmlAsync } from 'vike/types'
import { getPageTitle } from './getPageTitle'
import { I18nextProvider } from 'react-i18next';
import './tw.css'
import { getToken } from "../pages/auth/AuthStore";
import { SublymusApiProvider } from "../api/ReactSublymusApi";
const onRenderHtml: OnRenderHtmlAsync = async (pageContext): ReturnType<OnRenderHtmlAsync> => {
  const { Page } = pageContext
  const i18n = i18next.cloneInstance();
  // This onRenderHtml() hook only supports SSR, see https://vike.dev/render-modes for how to modify
  // onRenderHtml() to support SPA
  if (!Page) throw new Error('My onRenderHtml() hook expects pageContext.Page to be defined')

  const headersOriginal = pageContext.headers as Record<string, string> || {};
  const baseUrlFromHeader = headersOriginal['x-base-url'] || '/';
  const apiUrlFromHeader = headersOriginal['x-target-api-service'] || '/';
  const serverUrlFromHeader = headersOriginal['x-server-url'] || '/';
  const serverApiFromHeader = headersOriginal['x-server-api-url'] //|| 'server.'+serverUrlFromHeader;


  console.log({
    baseUrl: baseUrlFromHeader,
    serverUrl: (process.env.NODE_ENV =='production'?'https://':'http://' ) + serverApiFromHeader,
    apiUrl: apiUrlFromHeader,
    server: serverUrlFromHeader
  });

  // Alternatively, we can use an HTML stream, see https://vike.dev/streaming
  const pageHtml = ReactDOMServer.renderToString(
    <SublymusApiProvider  storeApiUrl={apiUrlFromHeader} mainServerUrl={serverApiFromHeader} getAuthToken={getToken}>
      <I18nextProvider i18n={i18n}>
        <Layout pageContext={pageContext}>
          <Page />
        </Layout>
      </I18nextProvider>
    </SublymusApiProvider>
  )

  const title = getPageTitle(pageContext)
  const desc = pageContext.data?.description || pageContext.config.description || 'Demo of using Vike'
  const lang = pageContext.headers?.['accept-language']?.includes('fr') ? 'fr' : 'en';
  await i18n.changeLanguage(lang);
  console.log(pageContext.urlOriginal);

  // const logo = (pageContext.data as any)?.logoUrl || logoUrl
  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        
        <meta name="description" content="${desc}" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css"/>
        <title>${title}</title>
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
        
      </body>
    </html>`

  return {
    documentHtml,
    pageContext: {
      lang,
      baseUrl: baseUrlFromHeader,
      serverUrl: serverUrlFromHeader,
      apiUrl: apiUrlFromHeader,
    }
  }
}