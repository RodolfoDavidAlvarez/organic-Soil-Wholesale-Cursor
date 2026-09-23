// Local review server: live OSW reads; writes are blocked to prevent accidental orders/leads.
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const port = Number(process.env.RLS_PREVIEW_PORT || 5188);
const server = await createServer({
  configFile: fileURLToPath(new URL('../client/vite.config.ts', import.meta.url)),
  root: fileURLToPath(new URL('../client', import.meta.url)),
  plugins: [{ name: 'review-read-only', configureServer(server) { server.middlewares.use((req,res,next) => { if(req.url?.startsWith('/api/') && !['GET','HEAD'].includes(req.method)) { res.statusCode=403; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Review preview: submissions and payments are disabled.'})); return; } next(); }); } }],
  server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [fileURLToPath(new URL('..', import.meta.url)), '/Users/rodolfoalvarez/Documents/Soil Seed and Water/Organic Soil Wholesale/Organic Soil Wholesale Website'] }, proxy: { '/api': { target: 'https://www.organicsoilwholesale.com', changeOrigin: true }, '/uploads': { target: 'https://www.organicsoilwholesale.com', changeOrigin: true } } },
});
await server.listen();
console.log(`Review preview: http://127.0.0.1:${port}${process.env.VITE_DEFAULT_BRAND === 'rls' ? '/' : '/landscaper-supply'} (live reads; submissions disabled)`);
