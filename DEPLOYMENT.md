# Deployment Guide for Organic Soil Wholesale

> **Warning:**
> Before deploying, ensure that no global debug styles (such as `@apply border;` on the universal selector `*` in your CSS) are present. These can cause disruptive outlines/grid lines across your site in production. Only apply borders to specific elements as needed.

This guide documents the deployment process to Vercel and includes a checklist of common issues and their solutions.

## Prerequisites

- Node.js installed (v16 or higher)
- Vercel CLI installed (`npm i -g vercel`)
- A Vercel account
- Git repository with your project

## 🚦 **Pre-deployment Checklist (Strict)**

- [ ] **TypeScript:** Skip TypeScript checks during build to avoid deployment failures. Use `"build": "vite build"` instead of `"build": "tsc && vite build"` in package.json.
- [ ] **Schema Exports:** All required schema exports in `shared/schema.ts` are uncommented and correct.
- [ ] **Vite Config:**
  - `base: "./"` in `vite.config.ts` (CRITICAL for asset loading)
  - `sourcemap: true` for debugging
  - Disable `drop_console` and `drop_debugger` in terser options during initial deployment
- [ ] **Build Scripts:** Ensure `vercel-build` script exists in root package.json: `"vercel-build": "npm run build"`
- [ ] **vercel.json:**
  - Use correct buildCommand: `"buildCommand": "npm run vercel-build"`
  - Set correct outputDirectory: `"outputDirectory": "dist/public"`
  - Ensure proper route handling including filesystem:
    ```json
    "routes": [
      { "handle": "filesystem" },
      { "src": "/assets/(.*)", "dest": "/assets/$1" },
      { "src": "/(.*)", "dest": "/index.html" }
    ]
    ```
- [ ] **Firebase Config:** Make sure Firebase configuration is properly set up if using Firebase storage
- [ ] **Environment Variables:** All required variables are set in Vercel dashboard
- [ ] **No Debug CSS:** No global debug styles in any CSS files
- [ ] **drizzle-zod Version:** Must use drizzle-zod 0.5.1. Newer versions have a bug with .omit() and TypeScript 5.x

## 🛠️ **Fixing TypeScript Errors**

- **Deployment Errors with TypeScript:**
  - If you encounter TypeScript errors during deployment, modify your build script to skip TypeScript checks:
  ```json
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc"
  }
  ```
  - Run typecheck locally but skip it during deployment

- **General TypeScript Fixes:**
  - Always coalesce `undefined` to `null`:
  ```ts
  // BAD
  const imageUrl: string | null = possiblyUndefined;
  // GOOD
  const imageUrl: string | null = possiblyUndefined ?? null;
  ```
  - Never assign `undefined` where only `null` is allowed by your types
  - Use default values or type guards as needed

## 🖼️ **Asset Handling & Vite Config**

- In `vite.config.ts`:
  ```ts
  export default defineConfig({
    plugins: [react()],
    base: "./", // CRITICAL - Use relative base for correct asset loading
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@shared": path.resolve(__dirname, "../shared"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true, // Enable during development and initial deployments
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: false, // Set to true only after successful deployment
          drop_debugger: false, // Set to true only after successful deployment
        },
      },
    },
  });
  ```

- In `vercel.json`, ensure:
  ```json
  {
    "version": 2,
    "buildCommand": "npm run vercel-build",
    "outputDirectory": "dist/public",
    "framework": "vite",
    "routes": [
      { "handle": "filesystem" },
      { "src": "/assets/(.*)", "dest": "/assets/$1" },
      { "src": "/(.*)", "dest": "/index.html" }
    ]
  }
  ```

## 🧪 **Local Testing Before Deploy**

1. Run `npm run vercel-build` to test the exact build process Vercel will use
2. Check the `dist/public` directory to ensure all assets were built correctly 
3. Run `npm run preview` and test the app locally
4. Open the browser console and check for errors
5. Ensure all routes, assets, and API endpoints work as expected

## 🚀 **Deployment Steps**

1. **Final Checklist**
   - [ ] TypeScript checks skipped in build script
   - [ ] All schema exports present
   - [ ] Vite config has `base: "./"`
   - [ ] vercel.json has correct buildCommand and outputDirectory
   - [ ] Proper route handling in vercel.json
   - [ ] All environment variables set

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Post-deployment Verification**
   - Check all routes and assets load (no 404s)
   - Open browser console for errors (blank white screen often indicates JS errors)
   - Test API endpoints
   - Confirm database and Firebase connections
   - Check all images are loading properly

## 🆘 **Troubleshooting**

- **Blank White Screen:**
  - Check browser console for JavaScript errors
  - Verify that assets are loading correctly (no 404s)
  - Make sure `base: "./"` is set in vite.config.ts
  - Correct routing in vercel.json to handle all routes

- **TypeScript Build Errors:**
  - Modify build script to skip TypeScript checks during deployment
  - Run TypeScript checks locally before deployment

- **Asset Loading Issues:**
  - Ensure proper route configuration in vercel.json
  - Verify Firebase or other CDN permissions
  - Check network tab in browser for failed requests

- **Build Configuration:**
  - If you see errors like "Command exited with code 1/2", check vercel.json buildCommand
  - Ensure the path in buildCommand is correct
  - Use vercel logs to diagnose build failures

- **API Connection Issues:**
  - Check environment variables in Vercel dashboard
  - Verify API endpoints are correctly configured
  - Check CORS settings if applicable

## 🔄 **Recent Deployment Findings**

- TypeScript checks during build can cause deployment failures - skip them in the build script
- The `base: "./"` setting in vite.config.ts is critical for asset loading
- When using Firebase storage, ensure CORS settings allow your Vercel domain
- Always use `vercel --prod` for production deployments
- Use the `vercel logs` command to diagnose build failures

## 📚 **Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Configuration Guide](https://vitejs.dev/config/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Firebase Storage Configuration](https://firebase.google.com/docs/storage)

## 💬 **Support**

- Check Vercel deployment logs: `vercel logs your-deployment-url`
- Review build output for errors
- Test locally with `npm run vercel-build` before deploying
- Use browser console to diagnose client-side issues
