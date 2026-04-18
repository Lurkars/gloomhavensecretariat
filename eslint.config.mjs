import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended, ...angular.configs.tsRecommended, prettier],
    processor: angular.processInlineTemplates,
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['./*', '../*'], message: "Use absolute 'src/' imports instead of relative paths." }] }
      ],
      // relax rules that would be too noisy for an existing codebase
      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-output-rename': 'off'
    }
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, prettier],
    rules: {
      '@angular-eslint/template/eqeqeq': 'off'
    }
  }
);
