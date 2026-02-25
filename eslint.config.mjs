import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore all admin/seed scripts — they use CommonJS require() intentionally
    "scripts/**",
    "test-api.js",
    // Ignore public folder — service workers and workbox bundles are minified/external
    "public/**",
  ]),
  // Relax rules for app source files where 'any' is pragmatic (Firestore dynamic data)
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Natural apostrophes/quotes in UI text are fine — this rule causes too many false positives
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
