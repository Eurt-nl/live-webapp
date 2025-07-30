import type { I18nGlobal } from 'vue-i18n';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $customT: I18nGlobal['t'];
  }
}
