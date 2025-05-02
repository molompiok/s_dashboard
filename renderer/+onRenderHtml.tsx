// https://vike.dev/onRenderHtml
export { onRenderHtml }
import i18next from "../Lib/i18n";
import ReactDOMServer from 'react-dom/server'
import { Layout } from './Layout'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import logoUrl from './logo.svg'
import type { OnRenderHtmlAsync } from 'vike/types'
import { getPageTitle } from './getPageTitle'
import { I18nextProvider } from 'react-i18next';
import './tw.css'
import { SublymusApiProvider } from "../api/ReactSublymusApi";
import { Server_Host } from "./+config";
const onRenderHtml: OnRenderHtmlAsync = async (pageContext): ReturnType<OnRenderHtmlAsync> => {
  const { Page } = pageContext
  const i18n = i18next.cloneInstance();
  // This onRenderHtml() hook only supports SSR, see https://vike.dev/render-modes for how to modify
  // onRenderHtml() to support SPA
  if (!Page) throw new Error('My onRenderHtml() hook expects pageContext.Page to be defined')

  // Alternatively, we can use an HTML stream, see https://vike.dev/streaming
  const pageHtml = ReactDOMServer.renderToString(
    <SublymusApiProvider serverApiUrl={Server_Host}>
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
  const isPreviewMode = pageContext.urlOriginal.includes('preview')
  console.log(pageContext.urlOriginal);

  // const logo = (pageContext.data as any)?.logoUrl || logoUrl
  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="fr">
      <head>
      <meta name="viewport" content="width=${isPreviewMode?'1080':'width=device-width, initial-scale=1.0'}"></meta>
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
      // We can add custom pageContext properties here, see https://vike.dev/pageContext#custom
    }
  }
}