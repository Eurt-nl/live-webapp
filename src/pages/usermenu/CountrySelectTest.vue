<template>
  <div class="q-pa-md">
    <!-- QSelect met landen, met custom filtering via @filter -->
    <q-select
      filled
      v-model="selectedCountry"
      :options="options"
      :label="$customT('courses.searchCountry')"
      option-label="name"
      option-value="id"
      use-input
      input-debounce="0"
      clearable
      @filter="filterFn"
      style="max-width: 400px"
    />
    <div class="q-mt-md">{{ $customT('courses.country') }}: {{ selectedCountry }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Oorspronkelijke lijst met landen (de bron voor filtering)
const allCountries = [
  { id: 'af', name: 'Afghanistan' },
  { id: 'al', name: 'Albanië' },
  { id: 'dz', name: 'Algerije' },
  { id: 'ad', name: 'Andorra' },
  { id: 'ao', name: 'Angola' },
  { id: 'ar', name: 'Argentinië' },
  { id: 'am', name: 'Armenië' },
  { id: 'au', name: 'Australië' },
  { id: 'at', name: 'Oostenrijk' },
  { id: 'az', name: 'Azerbeidzjan' },
  { id: 'bs', name: 'Bahama' },
  { id: 'bh', name: 'Bahrein' },
  { id: 'bd', name: 'Bangladesh' },
  { id: 'bb', name: 'Barbados' },
  { id: 'by', name: 'Wit-Rusland' },
  { id: 'be', name: 'België' },
  { id: 'bz', name: 'Belize' },
  { id: 'bj', name: 'Benin' },
  { id: 'bt', name: 'Bhutan' },
  { id: 'bo', name: 'Bolivia' },
  { id: 'nl', name: 'Nederland' },
  { id: 'us', name: 'Verenigde Staten' },
  { id: 'za', name: 'Zuid-Afrika' },
];

// Reactieve opties-array die getoond wordt in de QSelect
const options = ref([...allCountries]);

// Geselecteerd land (id)
const selectedCountry = ref('');

// Custom filterfunctie voor QSelect
function filterFn(val: string, update: (fn: () => void) => void) {
  update(() => {
    // Filter de landenlijst op basis van de ingevoerde tekst (case-insensitive)
    const needle = val.toLowerCase();
    options.value = allCountries.filter((c) => c.name.toLowerCase().includes(needle));
  });
}
</script>

<style scoped>
.q-pa-md {
  max-width: 500px;
}
</style>
