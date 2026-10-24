import { defineConfig, mergeConfig, type Plugin } from "vite";
import viteConfig from "./vite.config";

export const E2E_BUILD_META = "passalio-e2e-build";

const buildId = process.env["E2E_BUILD_ID"] ?? "initial";

const outDir = process.env["E2E_OUT_DIR"] ?? ".e2e/pwa-dist";

const buildIdMeta = (): Plugin => ({
  name: "passalio-e2e-build-id",
  transformIndexHtml: () => [
    { tag: "meta", attrs: { name: E2E_BUILD_META, content: buildId }, injectTo: "head" },
  ],
});

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [buildIdMeta()],
    build: { outDir, emptyOutDir: true },
  }),
);
