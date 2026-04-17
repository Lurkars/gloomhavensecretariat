import angular from "angular-eslint";
import prettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      prettier,
    ],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    processor: angular.processInlineTemplates,
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "no-restricted-imports": ["error", { patterns: [{ group: ["./*", "../*"], message: "Use absolute 'src/' imports instead of relative paths." }] }],
      // relax rules that would be too noisy for an existing codebase
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-expressions": "warn",
      "@angular-eslint/prefer-inject": "off",
      "@angular-eslint/no-input-rename": "off",
      "@angular-eslint/no-output-rename": "off",
      "@angular-eslint/no-output-native": "warn",
      "@angular-eslint/no-output-on-prefix": "warn",
      "@angular-eslint/no-empty-lifecycle-method": "off",
      "@angular-eslint/directive-selector": "off",
      "@angular-eslint/component-selector": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      prettier,
    ],
    rules: {
      "@angular-eslint/template/eqeqeq": "off",
    },
  }
);
