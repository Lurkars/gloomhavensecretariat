import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import path from 'path';
import { fileURLToPath } from 'url';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, 'src');

const noRelativeImportsPlugin = {
  rules: {
    'no-relative-imports': {
      meta: { fixable: 'code' },
      create(context) {
        return {
          ImportDeclaration(node) {
            const source = node.source.value;
            if (typeof source === 'string' && (source.startsWith('./') || source.startsWith('../'))) {
              const filePath = context.filename ?? context.getFilename();
              const fileDir = path.dirname(filePath);
              const abs = path.resolve(fileDir, source);
              const rel = path.relative(srcRoot, abs).replace(/\\/g, '/');
              if (!rel.startsWith('..')) {
                const fixed = 'src/' + rel;
                context.report({
                  node: node.source,
                  message: "Prefer absolute 'src/' imports instead of relative paths.",
                  fix(fixer) {
                    return fixer.replaceText(node.source, `'${fixed}'`);
                  }
                });
              }
            }
          }
        };
      }
    }
  }
};

export default defineConfig(
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended, ...angular.configs.tsRecommended, prettier],
    plugins: { local: noRelativeImportsPlugin },
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'local/no-relative-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-output-rename': 'off'
    }
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, prettier]
  }
);
