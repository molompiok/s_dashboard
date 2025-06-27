// https://vike.dev/onRenderClient
export { onRenderClient }
import '../Lib/i18n';
import ReactDOM from 'react-dom/client'
import { Layout } from './Layout'
import { getPageTitle } from './getPageTitle'
import type { OnRenderClientAsync } from 'vike/types'
import { I18nextProvider } from 'react-i18next';
import i18next from '../Lib/i18n';
import './tw.css'
import { getToken, logoutUserGlobally } from "../api/stores/AuthStore";
import { SublymusApiProvider } from '../api/ReactSublymusApi';
import { Data, host } from './AppStore/Data';
import { useGlobalStore } from '../api/stores/StoreStore';
import { ClientCall, http } from '../Components/Utils/functions';

let root: ReactDOM.Root
const onRenderClient: OnRenderClientAsync = async (pageContext): ReturnType<OnRenderClientAsync> => {
  const { Page } = pageContext

  // This onRenderClient() hook only supports SSR, see https://vike.dev/render-modes for how to modify onRenderClient()
  // to support SPA
  const i18n = i18next.cloneInstance();
  if (!Page) throw new Error('My onRenderClient() hook expects pageContext.Page to be defined')

  const container = document.getElementById('root')
  if (!container) throw new Error('DOM element #root not found')
  const currentStore = useGlobalStore.getState().getCurrentStore();
  
  Data.serverUrl = pageContext.serverUrl;
  Data.serverApiUrl = pageContext.serverApiUrl ;
  Data.apiUrl = currentStore?.api_url?.startsWith('http') ? currentStore?.api_url : http + currentStore?.api_url ; 
 
  
  const page = (
    <SublymusApiProvider
      storeApiUrl={Data.apiUrl}
      mainServerUrl={Data.serverApiUrl}
      getAuthToken={getToken}
      handleUnauthorized={(action) => {
        console.warn('handleUnauthorized', action);

        if (action == 'server') logoutUserGlobally()
      }}
    >
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