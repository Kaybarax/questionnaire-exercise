import * as js from "@eslint/js";
import * as globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: {js},
    extends: ["js/recommended"],
    languageOptions: {globals: globals.browser},
    ignores: ["**/build/**", "**/node_modules/**", "**/dist/**"],
  },
  tseslint.configs.recommended,
]);
