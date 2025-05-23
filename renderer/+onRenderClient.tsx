// https://vike.dev/onRenderClient
export { onRenderClient }
import '../Lib/i18n';
import ReactDOM from 'react-dom/client'
import { Layout } from './Layout'
import { getPageTitle } from './getPageTitle'
import type { OnRenderClientAsync } from 'vike/types'
import { SublymusApiProvider } from '../api/ReactSublymusApi';
import { I18nextProvider } from 'react-i18next';
import i18next from '../Lib/i18n';
import './tw.css'
import { Server_Host } from './+config';
import { getToken } from '../pages/users/login/AuthStore';

let root: ReactDOM.Root
const onRenderClient: OnRenderClientAsync = async (pageContext): ReturnType<OnRenderClientAsync> => {
  const { Page } = pageContext

  // This onRenderClient() hook only supports SSR, see https://vike.dev/render-modes for how to modify onRenderClient()
  // to support SPA
  const i18n = i18next.cloneInstance();
  if (!Page) throw new Error('My onRenderClient() hook expects pageContext.Page to be defined')

  const container = document.getElementById('root')
  if (!container) throw new Error('DOM element #root not found')

  const page = (
    <SublymusApiProvider serverApiUrl={Server_Host} getToken={getToken}>
      <I18nextProvider i18n={i18n}>
        <Layout pageContext={pageContext}>
          <Page />
        </Layout>
      </I18nextProvider>
    </SublymusApiProvider>
  )
  if (pageContext.isHydration) {
    root = ReactDOM.hydrateRoot(container, page)
  } else {
    if (!root) {
      root = ReactDOM.createRoot(container)
    }
    root.render(page)
  }
  document.title = getPageTitle(pageContext)
}