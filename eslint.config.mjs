// Chequeo de identificadores sin definir (por ejemplo, un hook de React sin importar).
// Se corre con `npm run lint` y como parte de `npm test`.
import globals from "globals";

export default [
  { ignores: ["android/**", "www/**"] },
  {
    files: ["src/**/*.js", "src/**/*.jsx", "tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        __APP_VERSION__: "readonly",
        __ADMOB_INTERSTITIAL__: "readonly",
        __ADMOB_REWARDED__: "readonly",
        __FIREBASE__: "readonly",
      },
    },
    rules: { "no-undef": "error" },
  },
];
