import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // These client screens intentionally start cancellable/guarded data loads
      // on mount. React 19's broad rule also flags the loading-state setters
      // inside those async callbacks, although they do not form render loops.
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^SentStatisticsTable$" }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "yedirenk/**",
  ]),
]);

export default eslintConfig;
