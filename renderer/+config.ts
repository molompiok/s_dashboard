import type { Config } from 'vike/types'

// https://vike.dev/config
export default {
  // https://vike.dev/clientRouting
  clientRouting: true,

  passToClient: ['pageProps', 'baseUrl', 'lang', 'apiUrl', 'serverUrl','server'],
 
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

const Host = ``
const Server_Host = `http://172.25.72.235:5555`
const Api_host = 'http://172.25.72.235:3334'
export {Host, Server_Host,Api_host}

