import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

// Detect browser language and set locale accordingly
const detectLocale = (): string => {
  const browserLang = navigator.language?.toLowerCase();
  if (browserLang?.startsWith('nl')) {
    return 'nl';
  }
  return 'en';
};

const i18n = createI18n({
  locale: detectLocale(),
  fallbackLocale: 'en',
  legacy: false,
  messages,
});

export default boot(({ app }) => {
  app.use(i18n);
  app.config.globalProperties.$customT = i18n.global.t;
  app.provide('$customT', i18n.global.t);
});

export { i18n };
