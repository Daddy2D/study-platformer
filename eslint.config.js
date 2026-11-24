import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "public/**",
      "_backup_original/**",
      "_backup_levels_p1/**",
      "Пак_уровней(20.11.26)/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    },
    rules: {
      eqeqeq: ["error", "smart"],
      "no-var": "error",
      "no-unused-vars": ["error", { args: "none" }]
    }
  },
  {
    files: [
      "vite.config.js",
      "vitest.config.js",
      "eslint.config.js",
      "tests/**/*.js"
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
