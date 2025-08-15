import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import pluginQuasar from '@quasar/app-vite/eslint';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default defineConfigWithVueTs(
  /**
   * Basissettings (Quasar plugin regelt ignores zoals node_modules)
   */
  {},

  pluginQuasar.configs.recommended(),
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommendedTypeChecked,

  /**
   * Hoofdregels voor projectbestanden
   */
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
      // ---------- TypeScript ----------
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'prefer-promise-reject-errors': 'off',

      // Debugger is toegestaan in dev (Quasar dev workflow)
      'no-debugger': 'off',

      // ---------- i18n: altijd $customT ----------
      'no-restricted-syntax': [
        'error',
        // Verplicht $customT i.p.v. $t
        {
          selector: "CallExpression[callee.name='$t']",
          message: 'Gebruik altijd $customT in plaats van $t voor vertalingen.',
        },
        // Verplicht $customT i.p.v. t
        {
          selector: "CallExpression[callee.name='t']",
          message: 'Gebruik altijd $customT in plaats van t voor vertalingen.',
        },
        // Verbied direct aanmaken van PocketBase clients buiten de centrale plekken
        {
          selector: "NewExpression[callee.name='PocketBase']",
          message:
            'Maak geen nieuwe PocketBase() buiten src/config/pocketbase.ts of src/composables/usePocketbase.ts. Gebruik de bestaande singleton/composable.',
        },
        // Verbied toISOString() zodat we het PB-formaat "YYYY-MM-DD HH:mm:ss" afdwingen
        {
          selector: "CallExpression[callee.property.name='toISOString']",
          message:
            'Vermijd toISOString(); formatteer datums als "YYYY-MM-DD HH:mm:ss" (zonder T/Z) vóór opslag of filters naar PocketBase.',
        },
      ],

      // ---------- Imports: verboden modules/locaties ----------
      // Geen directe import van "pocketbase" in de app (alleen via centrale wrapper/composable)
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'src/config/pocketbase',
              message: 'Gebruik usePocketbase() in UI/stores. Direct importeren is verboden.',
            },
          ],
        },
      ],
    },
  },

  /**
   * Uitzonderingen: hier mag je wel direct met PocketBase werken (init/wrapper)
   */
  {
    files: ['src/config/pocketbase.ts', 'src/composables/usePocketbase.ts'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  /**
   * Script bestanden: Node.js globals toestaan
   */
  {
    files: ['scripts/**/*.js', 'src-pwa/express/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  /**
   * Service worker-specifieke rules
   * Opmerking: custom-service-worker.ts is verwijderd, Quasar GenerateSW wordt gebruikt
   */

  // Prettier integratie (laat formatting aan Prettier)
  prettierSkipFormatting,
);
