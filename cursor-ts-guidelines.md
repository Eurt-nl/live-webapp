# Cursor richtlijnen voor TypeScript + ESLint

Gebruik altijd **TypeScript** in dit project.

Volg strikt de regels die staan in `eslint.config.js`.  
De codebase gebruikt:

- Vue 3 (Composition API)
- Quasar Framework
- ESLint + TypeScript + Prettier integratie

Alle code die je schrijft:

- Moet zonder TypeScript fouten compileren
- Moet ESLint-clean zijn (of auto-fixable)
- Moet `defineComponent` gebruiken bij Vue componenten
- Moet waar nodig types specificeren (bijv. bij props, ref, emits)

Gebruik `defineStore` met correcte types als je met Pinia werkt.

Gebruik geen `any` tenzij strikt noodzakelijk en gemotiveerd.

Vermijd JS-only snippets — dit project gebruikt altijd `.ts` en `.vue` bestanden met types.

## i18n (Internationalisatie)

Voor i18n in Vue templates en scripts:

- Gebruik **ALTIJD `$customT`** in templates (NIET `$t`)
- Gebruik **ALTIJD `$customT`** in script secties (NIET `t`)
- Destructureer altijd via: `const { t: $customT } = useI18n()`
- Voorbeeld template: `{{ $customT('common.save') }}`
- Voorbeeld script: `const { t: $customT } = useI18n(); $customT('common.save')`

**BELANGRIJK**: Gebruik NOOIT `$t` of `t` - dit veroorzaakt fouten! Gebruik altijd `$customT`.
