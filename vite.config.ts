import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
// @ts-expect-error -- plain ESM module shared with the Node server and Lambda
import { dataMiddleware } from './server/upstreams.mjs'

/**
 * Live data proxy for SEC EDGAR (/api/sec/*) and NSE India (/api/nse/*).
 * Both upstreams require server-side headers (and NSE a cookie session), so the
 * browser talks to this same-origin proxy. See server/upstreams.mjs.
 *
 * .env.local:
 *   SEC_USER_AGENT="Your Company you@yourcompany.com"
 *   NSE_HOST=www.nseindia.in   (optional)
 */
const liveData = (): Plugin => ({
  name: 'aura-live-data',
  configureServer(server) {
    server.middlewares.use(dataMiddleware())
  },
  configurePreviewServer(server) {
    server.middlewares.use(dataMiddleware())
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['SEC_USER_AGENT', 'NSE_HOST']) if (env[key]) process.env[key] = env[key]
  return { plugins: [react(), liveData()] }
})
