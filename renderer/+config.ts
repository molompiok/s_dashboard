import type { Config } from 'vike/types'

// https://vike.dev/config
export default {
  // https://vike.dev/clientRouting
  clientRouting: true,

  passToClient: [
    'pageProps', 
    'baseUrl', 
    'lang', 
    'apiUrl', 
    'serverUrl',
    'serverApiUrl',
    'PUBLIC_VAPID_KEY'
  ],
 
  // https://vike.dev/meta
  meta: {
    // Define new setting 'title'
    title: {
      env: { server: true, client: true }
    },
    // Define new setting 'description'
    description: {
      env: { server: true }
    }
  },
  hydrationCanBeAborted: true
} satisfies Config

