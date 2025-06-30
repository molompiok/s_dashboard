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
import { getToken } from "../api/stores/AuthStore";
import { SublymusApiProvider } from "../api/ReactSublymusApi";
import { Data } from "./AppStore/Data";
const onRenderHtml: OnRenderHtmlAsync = async (pageContext): ReturnType<OnRenderHtmlAsync> => {
  const { Page, serverApiUrl,serverUrl, PUBLIC_VAPID_KEY } = pageContext
  const i18n = i18next.cloneInstance();
  // This onRenderHtml() hook only supports SSR, see https://vike.dev/render-modes for how to modify
  // onRenderHtml() to support SPA
  if (!Page) throw new Error('My onRenderHtml() hook expects pageContext.Page to be defined')

 
  Data.apiUrl = '';
  Data.serverApiUrl = serverApiUrl;
  Data.serverUrl = serverUrl

  console.log({PUBLIC_VAPID_KEY});
  

  // Alternatively, we can use an HTML stream, see https://vike.dev/streaming
  const pageHtml = ReactDOMServer.renderToString(
    <SublymusApiProvider storeApiUrl={serverApiUrl} mainServerUrl={'http://api.sublymus-server.com'} getAuthToken={getToken}>
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
 
  // const logo = (pageContext.data as any)?.logoUrl || logoUrl
  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="fr">
      <head style="z-index=-10">
      <!--${serverApiUrl}-->
        <meta name="theme-color" content="#0ac993" /> 
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${desc}" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css"/>
        <title>${title}</title>
      </head>
      <body style="z-index=-10">
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`

  return {
    documentHtml,
    pageContext: {
      lang,
    }
  }
}