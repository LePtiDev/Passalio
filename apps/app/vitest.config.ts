import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

const COMPONENT_TESTS = "src/**/components/**/*.test.tsx";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            environment: "node",
            exclude: [...configDefaults.exclude, "e2e/**", COMPONENT_TESTS],
          },
        },
        {
          extends: true,
          test: {
            name: "components",
            environment: "happy-dom",
            include: [COMPONENT_TESTS],
            setupFiles: ["@testing-library/jest-dom/vitest", "src/test-support/component-setup.ts"],
          },
        },
      ],
    },
  }),
);
