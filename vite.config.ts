import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
import { UserConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const config: UserConfig = {
  plugins: [react(), vike(), tailwindcss()],
  server: {
    allowedHosts:true,
    port: 3005,  
    hmr: {
      port: 24705,
    },
  },
  build:{
    ssr: 'server/entry-server.js', // ou entry.mjs
    outDir: 'dist',
  },
  ssr:{
    noExternal: ['vike'],
  }
}

export default config
