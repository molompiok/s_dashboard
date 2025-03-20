import type { Config } from 'vike/types'

// https://vike.dev/config
export default {
  // https://vike.dev/clientRouting
  clientRouting: true,
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

const Host = `http://172.25.69.125:3000`
const Server_Host = `http://172.25.69.125:5555`
const Api_host = 'http://172.25.64.1:3334'
export {Host, Server_Host,Api_host}