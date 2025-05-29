# 🚀 Organic Soil Wholesale — Deployment Guide

This is the **only official deployment guide** for this project. Follow these steps to ensure a successful deployment to Vercel.

---

## Prerequisites

- Node.js v16 or higher
- Vercel CLI (`npm i -g vercel`)
- Vercel account
- Project cloned locally

---

## 1. Pre-deployment Checklist

- [ ] **TypeScript:** Build script skips type checks (run them locally if needed)
- [ ] **Schema Exports:** All required exports in `shared/schema.ts` are correct
- [ ] **Vite Config:**
  - `base: "./"` (for static asset loading)
  - `sourcemap: true` (for debugging)
  - No global debug CSS
- [ ] **Build Scripts:**
  - `"build": "vite build"`
  - `"vercel-build": "npm run build"`
- [ ] **vercel.json:**
  - `"buildCommand": "npm run vercel-build"`
  - `"outputDirectory": "dist"` (or `dist/public` if your build outputs there)
  - Proper SPA fallback routing:
    ```json
    "routes": [
      { "handle": "filesystem" },
      { "src": "/(.*)", "dest": "/index.html" }
    ]
    ```
- [ ] **Environment Variables:** Set in Vercel dashboard if needed
- [ ] **No global debug CSS:** (e.g. `@apply border;` on `*` selector)
- [ ] **Dependencies:** All installed (`npm install`)

---

## 2. Vite & Vercel Configuration

### vite.config.ts

```ts
export default defineConfig({
  plugins: [react()],
  base: "./", // Use relative base for static asset loading
  build: {
    outDir: "dist", // or "dist/public" if you prefer
    sourcemap: true,
    assetsDir: "assets",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
  // ...aliases and other config
});
```

### vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "framework": "vite",
  "routes": [{ "handle": "filesystem" }, { "src": "/(.*)", "dest": "/index.html" }]
}
```

---

## 3. Local Testing Before Deploy

1. **Build:**
   ```bash
   npm run vercel-build
   ```
2. **Preview:**
   ```bash
   npm run preview
   ```
3. **Check:**
   - Open the app in your browser
   - Check for errors in the console
   - Ensure all routes and assets load (no 404s)

---

## 4. Deploy to Vercel

1. **Deploy:**
   ```bash
   vercel --prod
   ```
2. **Check the output URL** and verify your site is live and working.
3. **If using a custom domain:** Point it to the latest deployment in the Vercel dashboard.

---

## 5. Troubleshooting

- **Blank screen or 404s:**
  - Check browser console for JS errors
  - Make sure `base: "./"` in Vite config
  - Ensure correct SPA fallback in `vercel.json`
- **TypeScript build errors:**
  - Skip type checks in build script, run them locally
- **Asset loading issues:**
  - Check Vite `base` and `assetsDir`
  - Ensure all assets are in the output directory
- **API/backend needed?**
  - Vercel static deployments do not run custom Node servers. Use Vercel serverless functions for backend logic.
- **Check Vercel logs:**
  ```bash
  vercel logs <deployment-url>
  ```

---

## 6. Best Practices

- Always test locally before deploying
- Keep this guide up to date with any changes to your build or deployment process
- Use version control (Git) and commit all changes before deploying
- Only one `DEPLOYMENT.md` should exist in the project root

---

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Configuration Guide](https://vitejs.dev/config/)

---

**This is the only deployment guide for this project. Delete any other deployment docs to avoid confusion.**
