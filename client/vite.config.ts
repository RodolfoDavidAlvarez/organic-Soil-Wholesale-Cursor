import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const standaloneBrand = process.env.VITE_DEFAULT_BRAND === "rls";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ...(standaloneBrand ? [{
    name: "rls-document-metadata",
    transformIndexHtml(html) {
      return html.replace(/<html\b/, '<html data-site-brand="rls"')
        .replace(/<title>[^<]*<\/title>/, '<title>Regenerative Landscaper Supply | Landscape Materials for the Job</title>')
        .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, '<meta name="description" content="Build a material list with current Arizona compost, soil, worm castings and mulch prices for landscape crews. Pickup and delivery through Organic Soil Wholesale." />')
        .replace(/<meta name="keywords"[^>]*\/>/, '<meta name="keywords" content="landscape materials Arizona, landscaper supply Phoenix, bulk compost, mulch, soil amendments, contractor soil" />')
        .replace(/<meta name="author"[^>]*\/>/, '<meta name="author" content="Regenerative Landscaper Supply" />')
        .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, '<link rel="canonical" href="https://regenerativelandscapersupply.com/" />')
        .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, '<meta property="og:url" content="https://regenerativelandscapersupply.com/" />')
        .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, '<meta property="og:title" content="Regenerative Landscaper Supply | Better ground. Better work." />')
        .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, '<meta property="og:description" content="Landscape materials for Arizona crews. Build a material list with live formats and prices." />')
        .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, '<meta property="og:image" content="https://regenerativelandscapersupply.com/images/optimized/mulch-texture-hand.jpg" />')
        .replace(/<meta property="og:site_name" content="[^"]*"\s*\/>/, '<meta property="og:site_name" content="Regenerative Landscaper Supply" />')
        .replace(/<meta property="twitter:url" content="[^"]*"\s*\/>/, '<meta property="twitter:url" content="https://regenerativelandscapersupply.com/" />')
        .replace(/<meta property="twitter:title" content="[^"]*"\s*\/>/, '<meta property="twitter:title" content="Regenerative Landscaper Supply | Better ground. Better work." />')
        .replace(/<meta\s+property="twitter:description"\s+content="[^"]*"\s*\/>/, '<meta property="twitter:description" content="Landscape materials for Arizona crews. Build a material list with live formats and prices." />')
        .replace(/<meta property="twitter:image" content="[^"]*"\s*\/>/, '<meta property="twitter:image" content="https://regenerativelandscapersupply.com/images/optimized/mulch-texture-hand.jpg" />')
        .replace(/<meta name="theme-color" content="[^"]*"\s*\/>/, '<meta name="theme-color" content="#24382d" />')
        .replace('</head>', '  <link rel="icon" type="image/svg+xml" href="/rls-mark.svg" />\n  </head>');
    }}]
    : [])],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@app-entry": path.resolve(__dirname, "./src/AppEntry.tsx"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "wouter"],
          ui: ["@radix-ui/react-hover-card", "@radix-ui/react-select", "@radix-ui/react-tabs"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
