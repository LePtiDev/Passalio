import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      workbox: {
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/health$/,
          /^\/mcp$/,
          /^\/oauth\//,
          /^\/\.well-known\//,
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: "Passalio",
        short_name: "Passalio",
        lang: "fr",
        display: "standalone",
        start_url: "/",
        theme_color: "#0f2a44",
        background_color: "#ffffff",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:8787",
      "/mcp": "http://localhost:8787",
      "/oauth": "http://localhost:8787",
      "/.well-known/oauth-authorization-server": "http://localhost:8787",
      "/.well-known/oauth-protected-resource": "http://localhost:8787",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
