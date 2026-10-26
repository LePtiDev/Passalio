import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";

const fontAsArrayBuffer: Plugin = {
  name: "font-as-array-buffer",
  enforce: "pre",
  load: (id) =>
    id.endsWith(".ttf")
      ? `import { readFileSync } from "node:fs";\nconst bytes = readFileSync(${JSON.stringify(id)});\nexport default bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);`
      : undefined,
};

export default defineConfig({
  plugins: [fontAsArrayBuffer],
  resolve: {
    alias: {
      "cloudflare:workers": fileURLToPath(
        new URL("./test/cloudflare-workers-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    server: { deps: { inline: ["@cloudflare/workers-oauth-provider"] } },
  },
});
