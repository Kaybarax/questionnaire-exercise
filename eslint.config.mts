import * as js from "@eslint/js";
import * as globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";

export default defineConfig([
  {
    ignores: ["**/build/**", "**/node_modules/**", "**/dist/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: {js},
    extends: ["js/recommended"],
    languageOptions: {globals: globals.browser},
  },
  tseslint.configs.recommended,
]);
