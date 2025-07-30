import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import pluginQuasar from '@quasar/app-vite/eslint';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default defineConfigWithVueTs(
  {
    /**
     * Ignore the following files.
     * Please note that pluginQuasar.configs.recommended() already ignores
     * the "node_modules" folder for you (and all other Quasar project
     * relevant folders and files).
     *
     * ESLint requires "ignores" key to be the only one in this object
     */
    // ignores: []
  },

  pluginQuasar.configs.recommended(),
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommendedTypeChecked,

  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        process: 'readonly',
        ga: 'readonly',
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'prefer-promise-reject-errors': 'off',

      // Allow debugger during development only
      'no-debugger': 'off',

      /**
       * Enforce i18n translation usage consistency
       * - Always use $customT (destructured from useI18n)
       * - Forbid $t() and bare t() calls
       */
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='$t']",
          message: 'Gebruik altijd $customT in plaats van $t voor vertalingen.',
        },
        {
          selector: "CallExpression[callee.name='t']",
          message: 'Gebruik altijd $customT in plaats van t voor vertalingen.',
        },
      ],
    },
  },

  {
    files: ['src-pwa/custom-service-worker.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  prettierSkipFormatting,
);
