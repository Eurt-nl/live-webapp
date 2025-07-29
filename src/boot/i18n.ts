import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

export default ({ app }) => {
  // Bepaal de standaardtaal op basis van browser taal
  const getDefaultLocale = () => {
    try {
      const browserLocale = navigator.language;
      const supportedLocales = Object.keys(messages);

      // Probeer exacte match
      if (supportedLocales.includes(browserLocale)) {
        return browserLocale;
      }

      // Probeer taal match (bijv. nl-NL -> nl)
      const language = browserLocale.split('-')[0];
      const languageMatch = supportedLocales.find((locale) => locale.startsWith(language));
      if (languageMatch) {
        return languageMatch;
      }

      // Fallback naar Engels (volgens Quasar documentatie)
      return 'en';
    } catch (error) {
      console.warn('Error determining default locale:', error);
      return 'en';
    }
  };

  // Create I18n instance volgens Quasar documentatie
  const i18n = createI18n({
    locale: getDefaultLocale(),
    globalInjection: true,
    legacy: false, // Gebruik Composition API mode
    messages,
    fallbackLocale: 'en', // Fallback naar Engels als vertaling ontbreekt
    missingWarn: false, // Onderdruk warnings voor ontbrekende vertalingen
    fallbackWarn: false, // Onderdruk warnings voor fallback
  });

  // Tell app to use the I18n instance
  app.use(i18n);

  // Verbeterde custom translation functie met betere fallback handling
  const customT = (key: string, params?: Record<string, any>) => {
    try {
      // Probeer eerst de standaard Vue I18n functie
      const result = i18n.global.t(key, params);
      if (result !== key) {
        return result;
      }

      // Fallback naar directe toegang tot messages
      const keys = key.split('.');
      let value = messages[i18n.global.locale.value];

      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          break;
        }
      }

      // Als we een waarde hebben gevonden, pas parameters toe
      if (value && typeof value === 'string' && params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? params[paramKey] : match;
        });
      }

      return value || key;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return key;
    }
  };

  // Debug: Test volgens Quasar documentatie
  const currentLocale = i18n.global.locale.value;

  console.log('Quasar i18n debug:', {
    locale: currentLocale,
    availableLocales: Object.keys(messages),
    testTranslation: i18n.global.t('home.aboutThisApp'),
    customTranslation: customT('home.aboutThisApp'),
    directAccess: messages[currentLocale]?.home?.aboutThisApp,
    legacy: false,
    globalInjection: true,
  });

  // Voeg custom translation functie toe aan app als globale property
  app.config.globalProperties.$customT = customT;

  // Maak ook beschikbaar in de template context
  app.provide('$customT', customT);

  // Quasar i18n is nu correct geïnitialiseerd
};
